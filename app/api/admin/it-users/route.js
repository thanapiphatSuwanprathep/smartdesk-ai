
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../src/prisma/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("smartdesk_session")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    let payload;

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET
      );

      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch {
      return NextResponse.json(
        { message: "Session ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const adminId = Number(payload.userId);

    if (!Number.isSafeInteger(adminId) || adminId <= 0) {
      return NextResponse.json(
        { message: "Session ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const admin = await db.orm.public.User.first({
      id: adminId,
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const users = await db.orm.public.User
      .where({ role: "IT" })
      .all();

    const itUsers = [...users]
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }))
      .sort((a, b) => a.id - b.id);

    return NextResponse.json({
      message: "โหลดรายชื่อ IT สำเร็จ",
      itUsers,
    });
  } catch (error) {
    console.error("GET IT USERS ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลดรายชื่อ IT ได้" },
      { status: 500 }
    );
  }
}
