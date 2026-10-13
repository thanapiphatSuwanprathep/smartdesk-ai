
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../../src/prisma/db";

// ========================================
// ตรวจสอบ Session และสิทธิ์ ADMIN
// ========================================
async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartdesk_session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null;
    }

    // ตรวจสอบ Role จากฐานข้อมูลจริง
    const admin = await db.orm.public.User.first({
      id: userId,
    });

    if (!admin || admin.role !== "ADMIN") {
      return null;
    }

    return admin;
  } catch {
    return null;
  }
}

// ========================================
// PATCH /api/admin/users/[id]
// ADMIN เปลี่ยนสิทธิ์ USER <-> IT
// ========================================
export async function PATCH(request, { params }) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          message: "ไม่มีสิทธิ์ดำเนินการ กรุณาเข้าสู่ระบบ ADMIN",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number(id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "User ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ห้ามแก้ไขบัญชีตัวเอง
    if (userId === admin.id) {
      return NextResponse.json(
        { message: "ไม่สามารถเปลี่ยนสิทธิ์ตัวเองได้" },
        { status: 403 }
      );
    }

    const targetUser = await db.orm.public.User.first({
      id: userId,
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้งาน" },
        { status: 404 }
      );
    }

    // ไม่อนุญาตให้แก้ไขบัญชี ADMIN
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { message: "ไม่สามารถเปลี่ยนสิทธิ์บัญชี ADMIN ได้" },
        { status: 403 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const newRole = body?.role;

    // อนุญาตเฉพาะ USER และ IT
    if (!["USER", "IT"].includes(newRole)) {
      return NextResponse.json(
        {
          message: "เลือกสิทธิ์ได้เฉพาะ USER หรือ IT",
        },
        { status: 400 }
      );
    }

    if (targetUser.role === newRole) {
      return NextResponse.json(
        {
          message: "บัญชีนี้มีสิทธิ์ดังกล่าวอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    // ป้องกันการเปลี่ยน IT ที่ยังมี Ticket รับผิดชอบ
    // เพื่อไม่ให้ Ticket ค้างอยู่กับผู้ที่ไม่ใช่ IT
    if (targetUser.role === "IT" && newRole === "USER") {
      const assignedTickets = await db.orm.public.Ticket
        .where({ assignedToId: userId })
        .all();

      const activeTickets = assignedTickets.filter(
        (ticket) =>
          ticket.status === "OPEN" ||
          ticket.status === "IN_PROGRESS" ||
          ticket.status === "RESOLVED"
      );

      if (activeTickets.length > 0) {
        return NextResponse.json(
          {
            message:
              "ไม่สามารถเปลี่ยนเป็น USER ได้ เพราะเจ้าหน้าที่คนนี้ยังมี Ticket ที่ไม่ปิดงาน",
          },
          { status: 409 }
        );
      }
    }

    // ========================================
    // Prisma ORM 8 - UPDATE
    // ========================================
    await db.orm.public.User
      .where({
        id: userId,
        role: targetUser.role,
      })
      .update({
        role: newRole,
        updatedAt: Temporal.Now.instant(),
      });

    // ตรวจสอบข้อมูลล่าสุด
    const updatedUser = await db.orm.public.User.first({
      id: userId,
    });

    if (!updatedUser || updatedUser.role !== newRole) {
      return NextResponse.json(
        { message: "ไม่สามารถเปลี่ยนสิทธิ์ได้" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: `เปลี่ยนสิทธิ์ของ ${updatedUser.name} เป็น ${newRole} สำเร็จ`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ADMIN UPDATE USER ROLE ERROR:", error);

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์ผู้ใช้งาน",
      },
      { status: 500 }
    );
  }
}
