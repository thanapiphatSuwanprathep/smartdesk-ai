
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../src/prisma/db";

export const dynamic = "force-dynamic";

// ตรวจสอบสิทธิ์ ADMIN จากฐานข้อมูลจริง
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

    const user = await db.orm.public.User.first({
      id: userId,
    });

    return user?.role === "ADMIN" ? user : null;
  } catch {
    return null;
  }
}

// GET /api/admin/tickets
export async function GET() {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เข้าถึงข้อมูล ADMIN" },
        { status: 403 }
      );
    }

    // โหลด Ticket ทั้งหมด
    const tickets = await db.orm.public.Ticket.all();

    // โหลดผู้ใช้งาน เพื่อแสดงชื่อผู้แจ้งและผู้รับงาน
    const users = await db.orm.public.User.all();

    const userMap = new Map(
      users.map((user) => [
        Number(user.id),
        {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      ])
    );

    const ticketsWithUsers = tickets.map((ticket) => ({
      ...ticket,
      reporter: userMap.get(Number(ticket.userId)) || null,
      assignee: ticket.assignedToId
        ? userMap.get(Number(ticket.assignedToId)) || null
        : null,
    }));

    // เรียง Ticket ใหม่สุดก่อน
    ticketsWithUsers.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );

    const stats = {
      total: tickets.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    for (const ticket of tickets) {
      if (Object.hasOwn(stats, ticket.status)) {
        stats[ticket.status]++;
      }
    }

    return NextResponse.json(
      {
        message: "โหลด Ticket สำเร็จ",
        tickets: ticketsWithUsers,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ADMIN TICKETS ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลด Ticket ได้" },
      { status: 500 }
    );
  }
}
