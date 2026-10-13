
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../src/prisma/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartdesk_session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null;
    }

    // ตรวจสอบสิทธิ์จากฐานข้อมูลจริง
    return await db.orm.public.User.first({ id: userId });
  } catch (error) {
    console.error("IT SESSION ERROR:", error);
    return null;
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    if (user.role !== "IT") {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 }
      );
    }

    const [tickets, users] = await Promise.all([
      db.orm.public.Ticket.all(),
      db.orm.public.User.all(),
    ]);

    const userMap = new Map(
      users.map((item) => [Number(item.id), item])
    );

    const result = tickets
      .map((ticket) => {
        const reporter = userMap.get(Number(ticket.userId));
        const assignee = ticket.assignedToId == null
          ? null
          : userMap.get(Number(ticket.assignedToId));

        return {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          userId: ticket.userId,
          assignedToId: ticket.assignedToId,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          reporterName: reporter?.name || `User #${ticket.userId}`,
          assigneeName: assignee?.name || "ยังไม่มีผู้รับงาน",
        };
      })
      .sort((a, b) => Number(b.id) - Number(a.id));

    return NextResponse.json({
      message: "โหลด Ticket สำเร็จ",
      tickets: result,
    });
  } catch (error) {
    console.error("GET IT TICKETS ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลด Ticket ได้" },
      { status: 500 }
    );
  }
}
