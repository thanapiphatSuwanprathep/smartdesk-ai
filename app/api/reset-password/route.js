
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { resetDb } from "../../../src/lib/reset-db";

export const runtime = "nodejs";

export async function POST(request) {
  let client;

  try {
    const body = await request.json();

    const token = body.token;
    const password = body.password;

    // ตรวจสอบข้อมูล
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { message: "ลิงก์หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Hash Token เพื่อค้นหาในฐานข้อมูล
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(password, 12);

    client = await resetDb.connect();

    await client.query("BEGIN");

    // ตรวจสอบ Token พร้อมล็อกแถว ป้องกันการใช้ซ้ำ
    const tokenResult = await client.query(
      `
      SELECT
        id,
        "userId",
        "expiresAt",
        "usedAt"
      FROM public."PasswordResetToken"
      WHERE "tokenHash" = $1
      FOR UPDATE
      `,
      [tokenHash]
    );

    const resetToken = tokenResult.rows[0];

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      new Date(resetToken.expiresAt).getTime() <= Date.now()
    ) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          message:
            "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หมดอายุ หรือถูกใช้งานแล้ว",
        },
        { status: 400 }
      );
    }

    // เปลี่ยนรหัสผ่านของผู้ใช้
    const updateUser = await client.query(
      `
      UPDATE public."User"
      SET
        password = $1,
        "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id
      `,
      [hashedPassword, resetToken.userId]
    );

    if (updateUser.rowCount !== 1) {
      throw new Error("ไม่พบผู้ใช้งาน");
    }

    // ยกเลิก Token ทั้งหมดของผู้ใช้นี้
    await client.query(
      `
      UPDATE public."PasswordResetToken"
      SET "usedAt" = NOW()
      WHERE "userId" = $1
        AND "usedAt" IS NULL
      `,
      [resetToken.userId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
      },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
