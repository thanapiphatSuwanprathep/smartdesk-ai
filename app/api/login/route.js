import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "../../../src/prisma/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // =========================
    // ตรวจสอบข้อมูล
    // =========================
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "กรุณากรอกอีเมลและรหัสผ่าน",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // ค้นหาผู้ใช้
    // =========================
    const user = await db.orm.public.User.first({
      email: email,
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    // =========================
    // ตรวจสอบ Password
    // =========================
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    // =========================
    // ตรวจสอบ JWT_SECRET
    // =========================
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // =========================
    // สร้าง JWT
    // =========================
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const token = await new SignJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // =========================
    // Response
    // =========================
    const response = NextResponse.json(
      {
        message: "เข้าสู่ระบบสำเร็จ",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
      }
    );

    // =========================
    // เก็บ JWT ใน HttpOnly Cookie
    // =========================
    response.cookies.set("smartdesk_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",

      // 7 วัน
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      },
      {
        status: 500,
      }
    );
  }
}