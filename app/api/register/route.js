import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../src/prisma/db";

export async function POST(request) {
  try {
    // =========================
    // รับข้อมูลจากหน้า Register
    // =========================
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // =========================
    // ตรวจสอบข้อมูล
    // =========================
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          message: "กรุณากรอกข้อมูลให้ครบ",
        },
        {
          status: 400,
        }
      );
    }

    // รหัสผ่านอย่างน้อย 8 ตัว
    if (password.length < 8) {
      return NextResponse.json(
        {
          message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // ตรวจสอบ Email ซ้ำ
    // =========================
    const existingUser = await db.orm.public.User.first({
      email: email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "อีเมลนี้ถูกใช้งานแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    // =========================
    // Hash Password
    // =========================
    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // =========================
    // สร้าง User
    // =========================
    const user = await db.orm.public.User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: "USER",

      // Prisma 8 ใช้ Temporal.Instant
      updatedAt: Temporal.Now.instant(),
    });

    // =========================
    // สมัครสำเร็จ
    // =========================
    return NextResponse.json(
      {
        message: "สมัครสมาชิกสำเร็จ",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
      },
      {
        status: 500,
      }
    );
  }
}