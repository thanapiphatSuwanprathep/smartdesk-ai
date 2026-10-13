import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    // อ่าน Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("smartdesk_session")?.value;

    // ไม่มี Cookie = ยังไม่ได้ Login
    if (!token) {
      return NextResponse.json(
        {
          message: "กรุณาเข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      );
    }

    // ตรวจสอบ Secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    // ตรวจสอบ JWT
    const { payload } = await jwtVerify(
      token,
      secret
    );

    // ส่งข้อมูลผู้ใช้กลับ
    return NextResponse.json(
      {
        user: {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error("ME ERROR:", error);

    return NextResponse.json(
      {
        message: "Session ไม่ถูกต้องหรือหมดอายุ",
      },
      {
        status: 401,
      }
    );
  }
}