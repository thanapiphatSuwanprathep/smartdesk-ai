
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { Resend } from "resend";
import { resetDb } from "../../../src/lib/reset-db";

export const runtime = "nodejs";

const SUCCESS_MESSAGE =
  "หากอีเมลนี้มีบัญชีในระบบและสามารถรับอีเมลได้ คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { message: "กรุณากรอกอีเมลให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL;
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!appUrl || !apiKey || !fromEmail) {
      console.error("Missing reset email configuration");
      return NextResponse.json(
        { message: "ระบบส่งอีเมลยังไม่พร้อมใช้งาน" },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);

    // ค้นหาบัญชีจากอีเมล
    const userResult = await resetDb.query(
      `SELECT id, email
       FROM public."User"
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    // ไม่เปิดเผยว่าอีเมลมีบัญชีหรือไม่
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        message: SUCCESS_MESSAGE,
      });
    }

    const user = userResult.rows[0];

    // จำกัดการส่งอีเมลซ้ำ: 1 ครั้งต่อนาทีต่อบัญชี
    const recent = await resetDb.query(
      `SELECT id
       FROM public."PasswordResetToken"
       WHERE "userId" = $1
         AND "createdAt" > NOW() - INTERVAL '1 minute'
       LIMIT 1`,
      [user.id]
    );

    if (recent.rows.length > 0) {
      return NextResponse.json({
        message: SUCCESS_MESSAGE,
      });
    }

    // สร้างโทเค็นสุ่มและเก็บเฉพาะ Hash
    const token = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    const saved = await resetDb.query(
      `INSERT INTO public."PasswordResetToken"
         ("userId", "tokenHash", "expiresAt")
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, tokenHash, expiresAt]
    );

    const tokenId = saved.rows[0].id;

    const resetUrl = new URL(
      "/reset-password",
      appUrl
    );

    resetUrl.searchParams.set("token", token);

    // ส่งลิงก์ทางอีเมล
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: "ตั้งรหัสผ่านใหม่ - SmartDesk AI",
      text:
        "คุณได้รับคำขอตั้งรหัสผ่านใหม่สำหรับ SmartDesk AI\n\n" +
        `เปิดลิงก์นี้: ${resetUrl.toString()}\n\n` +
        "ลิงก์หมดอายุใน 15 นาที\n\n" +
        "หากคุณไม่ได้เป็นผู้ร้องขอ สามารถละเลยอีเมลนี้ได้",
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      // ไม่เก็บโทเค็นที่ส่งไม่สำเร็จ
      await resetDb.query(
        `DELETE FROM public."PasswordResetToken"
         WHERE id = $1`,
        [tokenId]
      );

      return NextResponse.json({
        message: SUCCESS_MESSAGE,
      });
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      { message: "ระบบไม่สามารถดำเนินการได้ในขณะนี้" },
      { status: 500 }
    );
  }
}
