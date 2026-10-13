
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../../src/prisma/db";

export const dynamic = "force-dynamic";

// ========================================
// ตรวจสอบ ADMIN จากฐานข้อมูล
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

    const user = await db.orm.public.User.first({
      id: userId,
    });

    if (!user || user.role !== "ADMIN") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
    return null;
  }
}

// ========================================
// ตรวจสอบ Ticket ID
// ========================================
async function getTicketId(params) {
  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    return null;
  }

  return ticketId;
}

// ========================================
// แปลงข้อมูล User
// ไม่ส่ง Password กลับไปยัง Frontend
// ========================================
function safeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// ========================================
// แปลงวันที่
// รองรับ Date, String และ Temporal
// ========================================
function formatDate(value) {
  if (!value) return null;

  try {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      return value;
    }

    return value.toString();
  } catch {
    return null;
  }
}

// ========================================
// แปลงวันที่เป็น Timestamp
// ========================================
function getTimestamp(value) {
  const dateString = formatDate(value);

  if (!dateString) return 0;

  const timestamp = Date.parse(dateString);

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

// ========================================
// GET /api/admin/tickets/[id]
// โหลดรายละเอียด Ticket และรายชื่อ IT
// ========================================
export async function GET(request, { params }) {
  try {
    // ตรวจสอบ ADMIN
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          message: "ไม่มีสิทธิ์เข้าถึงข้อมูล ADMIN",
        },
        { status: 403 }
      );
    }

    // ตรวจสอบ Ticket ID
    const ticketId = await getTicketId(params);

    if (!ticketId) {
      return NextResponse.json(
        {
          message: "Ticket ID ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ====================================
    // โหลด Ticket
    // ====================================
    const ticket = await db.orm.public.Ticket.first({
      id: ticketId,
    });

    if (!ticket) {
      return NextResponse.json(
        {
          message: "ไม่พบ Ticket",
        },
        { status: 404 }
      );
    }

    // ====================================
    // โหลดผู้แจ้งปัญหา
    // ====================================
    const reporter = await db.orm.public.User.first({
      id: ticket.userId,
    });

    // ====================================
    // โหลดเจ้าหน้าที่ IT ที่รับงาน
    // ====================================
    let assignee = null;

    if (ticket.assignedToId) {
      assignee = await db.orm.public.User.first({
        id: ticket.assignedToId,
      });
    }

    // ====================================
    // โหลดรายชื่อเจ้าหน้าที่ IT ทั้งหมด
    // ====================================
    const itRecords = await db.orm.public.User
      .where({
        role: "IT",
      })
      .all();

    const itUsers = [...itRecords]
      .sort((a, b) => a.id - b.id)
      .map(safeUser);

    // ====================================
    // โหลดประวัติการสนทนา
    // ====================================
    const messageRecords =
      await db.orm.public.TicketMessage
        .where({
          ticketId,
        })
        .all();

    const messages = [...messageRecords];

    // เรียงข้อความจากเก่าไปใหม่
    messages.sort((a, b) => {
      const timeA = getTimestamp(a.createdAt);
      const timeB = getTimestamp(b.createdAt);

      return timeA - timeB || a.id - b.id;
    });

    // ====================================
    // โหลดข้อมูลผู้ส่งข้อความ
    // ====================================
    const senderIds = [
      ...new Set(
        messages.map((message) => message.senderId)
      ),
    ];

    const senders = await Promise.all(
      senderIds.map((senderId) =>
        db.orm.public.User.first({
          id: senderId,
        })
      )
    );

    const senderMap = new Map();

    for (const sender of senders) {
      if (sender) {
        senderMap.set(
          sender.id,
          safeUser(sender)
        );
      }
    }

    // ====================================
    // เตรียมข้อมูลข้อความสนทนา
    // ====================================
    const messagesWithSender = messages.map(
      (message) => ({
        id: message.id,
        ticketId: message.ticketId,
        senderId: message.senderId,
        message: message.message,
        createdAt: formatDate(message.createdAt),
        sender:
          senderMap.get(message.senderId) || null,
      })
    );

    // ====================================
    // เตรียมข้อมูล Ticket
    // ====================================
    const ticketData = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId,
      createdAt: formatDate(ticket.createdAt),
      updatedAt: formatDate(ticket.updatedAt),
      reporter: safeUser(reporter),
      assignee: safeUser(assignee),
    };

    // ====================================
    // ส่งข้อมูลกลับ
    // ====================================
    return NextResponse.json(
      {
        message: "โหลดรายละเอียด Ticket สำเร็จ",
        ticket: ticketData,
        messages: messagesWithSender,
        itUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET ADMIN TICKET DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "ไม่สามารถโหลดรายละเอียด Ticket ได้",
      },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH /api/admin/tickets/[id]
// ADMIN มอบหมาย Ticket ให้เจ้าหน้าที่ IT
// ========================================
export async function PATCH(request, { params }) {
  try {
    // ====================================
    // ตรวจสอบสิทธิ์ ADMIN
    // ====================================
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          message:
            "เฉพาะ ADMIN เท่านั้นที่มอบหมายงานได้",
        },
        { status: 403 }
      );
    }

    // ====================================
    // ตรวจสอบ Ticket ID
    // ====================================
    const ticketId = await getTicketId(params);

    if (!ticketId) {
      return NextResponse.json(
        {
          message: "Ticket ID ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ====================================
    // อ่านข้อมูลจาก Request
    // ====================================
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const assignedToId = Number(
      body?.assignedToId
    );

    if (
      !Number.isSafeInteger(assignedToId) ||
      assignedToId <= 0
    ) {
      return NextResponse.json(
        {
          message: "กรุณาเลือกเจ้าหน้าที่ IT",
        },
        { status: 400 }
      );
    }

    // ====================================
    // ตรวจสอบ Ticket
    // ====================================
    const ticket = await db.orm.public.Ticket.first({
      id: ticketId,
    });

    if (!ticket) {
      return NextResponse.json(
        {
          message: "ไม่พบ Ticket",
        },
        { status: 404 }
      );
    }

    // ====================================
    // ห้ามมอบหมายงานที่แก้ไขเสร็จหรือปิดแล้ว
    // ====================================
    if (
      ticket.status === "RESOLVED" ||
      ticket.status === "CLOSED"
    ) {
      return NextResponse.json(
        {
          message:
            "ไม่สามารถมอบหมาย Ticket ที่แก้ไขเสร็จหรือปิดงานแล้ว",
        },
        { status: 409 }
      );
    }

    // ตรวจสอบสถานะที่รองรับ
    if (
      ticket.status !== "OPEN" &&
      ticket.status !== "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          message:
            "สถานะ Ticket ไม่รองรับการมอบหมาย",
        },
        { status: 409 }
      );
    }

    // ====================================
    // ตรวจสอบเจ้าหน้าที่ IT
    // ====================================
    const itUser = await db.orm.public.User.first({
      id: assignedToId,
    });

    if (!itUser || itUser.role !== "IT") {
      return NextResponse.json(
        {
          message: "ไม่พบเจ้าหน้าที่ IT ที่เลือก",
        },
        { status: 400 }
      );
    }

    // ====================================
    // ตรวจสอบการมอบหมายซ้ำ
    // ====================================
    if (ticket.assignedToId === assignedToId) {
      return NextResponse.json(
        {
          message:
            "Ticket นี้มอบหมายให้เจ้าหน้าที่คนนี้อยู่แล้ว",
        },
        { status: 409 }
      );
    }

    // ====================================
    // เตรียมสถานะใหม่
    // ====================================
    const nextStatus =
      ticket.status === "OPEN"
        ? "IN_PROGRESS"
        : ticket.status;

    const updateData = {
      assignedToId,
      status: nextStatus,
      updatedAt: Temporal.Now.instant(),
    };

    // ====================================
    // Prisma ORM 8 - UPDATE
    // ====================================
    await db.orm.public.Ticket
      .where({
        id: ticketId,
        status: ticket.status,
        assignedToId: ticket.assignedToId,
      })
      .update(updateData);

    // ====================================
    // โหลด Ticket หลังอัปเดต
    // ====================================
    const updatedTicket =
      await db.orm.public.Ticket.first({
        id: ticketId,
      });

    // ตรวจสอบผลการมอบหมาย
    if (
      !updatedTicket ||
      updatedTicket.assignedToId !== assignedToId ||
      updatedTicket.status !== nextStatus
    ) {
      return NextResponse.json(
        {
          message:
            "ไม่สามารถมอบหมาย Ticket ได้ กรุณาโหลดข้อมูลใหม่",
        },
        { status: 409 }
      );
    }

    // ====================================
    // โหลดข้อมูลผู้แจ้ง
    // ====================================
    const reporter = await db.orm.public.User.first({
      id: updatedTicket.userId,
    });

    // ====================================
    // ส่งผลลัพธ์กลับ
    // ====================================
    return NextResponse.json(
      {
        message: "มอบหมาย Ticket สำเร็จ",

        ticket: {
          id: updatedTicket.id,
          title: updatedTicket.title,
          description: updatedTicket.description,
          category: updatedTicket.category,
          priority: updatedTicket.priority,
          status: updatedTicket.status,
          userId: updatedTicket.userId,
          assignedToId: updatedTicket.assignedToId,
          createdAt: formatDate(
            updatedTicket.createdAt
          ),
          updatedAt: formatDate(
            updatedTicket.updatedAt
          ),
          reporter: safeUser(reporter),
          assignee: safeUser(itUser),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH ADMIN ASSIGN TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "เกิดข้อผิดพลาดในการมอบหมาย Ticket",
      },
      { status: 500 }
    );
  }
}
