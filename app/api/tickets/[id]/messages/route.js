
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../../src/prisma/db";

// =====================================================
// อ่าน Session
// =====================================================
async function getSessionUser() {
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

    return {
      id: userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    console.error("SESSION VERIFY ERROR:", error);
    return null;
  }
}

// =====================================================
// ตรวจสอบ Ticket ID
// =====================================================
async function getTicketId(params) {
  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    return null;
  }

  return ticketId;
}

// =====================================================
// ตรวจสอบสิทธิ์เข้าถึง Ticket
// =====================================================
async function getAccessibleTicket(ticketId, user) {
  const ticket = await db.orm.public.Ticket.first({
    id: ticketId,
  });

  if (!ticket) {
    return {
      ticket: null,
      status: 404,
      message: "ไม่พบ Ticket",
    };
  }

  // USER เข้าถึงได้เฉพาะ Ticket ของตัวเอง
  if (user.role === "USER") {
    if (Number(ticket.userId) !== user.id) {
      return {
        ticket: null,
        status: 403,
        message: "คุณไม่มีสิทธิ์เข้าถึง Ticket นี้",
      };
    }
  }

  // IT เข้าถึง Ticket ที่ไม่มีผู้รับงาน
  // หรือ Ticket ที่ตัวเองรับผิดชอบ
  else if (user.role === "IT") {
    if (
      ticket.assignedToId != null &&
      Number(ticket.assignedToId) !== user.id
    ) {
      return {
        ticket: null,
        status: 403,
        message: "Ticket นี้มีเจ้าหน้าที่ IT คนอื่นรับงานแล้ว",
      };
    }
  }

  // ADMIN สามารถเข้าถึงได้
  else if (user.role !== "ADMIN") {
    return {
      ticket: null,
      status: 403,
      message: "คุณไม่มีสิทธิ์เข้าถึง Ticket นี้",
    };
  }

  return {
    ticket,
    status: 200,
    message: "เข้าถึง Ticket ได้",
  };
}

// =====================================================
// แปลงข้อมูลวันที่สำหรับส่ง JSON
// รองรับ Prisma Temporal และ JavaScript Date
// =====================================================
function serializeDate(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.toString === "function") {
    return value.toString();
  }

  return null;
}

// =====================================================
// เพิ่มข้อมูลผู้ส่งข้อความ
// =====================================================
async function addSenderToMessage(message) {
  const sender = await db.orm.public.User.first({
    id: Number(message.senderId),
  });

  return {
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId,
    message: message.message,
    createdAt: serializeDate(message.createdAt),

    sender: sender
      ? {
          id: sender.id,
          name: sender.name,
          role: sender.role,
        }
      : null,
  };
}

// =====================================================
// GET /api/tickets/[id]/messages
// โหลดประวัติข้อความทั้งหมด
// รวม Ticket ที่ปิดงานแล้ว
// =====================================================
export async function GET(request, { params }) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const ticketId = await getTicketId(params);

    if (!ticketId) {
      return NextResponse.json(
        { message: "Ticket ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบสิทธิ์
    const access = await getAccessibleTicket(
      ticketId,
      user
    );

    if (!access.ticket) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status }
      );
    }

    // =================================================
    // Prisma 8: โหลดข้อความจาก TicketMessage
    // =================================================
    const messages = await db.orm.public.TicketMessage
      .where({
        ticketId,
      })
      .all();

    // เรียงจากข้อความเก่าไปใหม่ด้วย ID
    const sortedMessages = [...messages].sort(
      (a, b) => Number(a.id) - Number(b.id)
    );

    // เพิ่มข้อมูลผู้ส่ง
    const messagesWithSender = await Promise.all(
      sortedMessages.map((message) =>
        addSenderToMessage(message)
      )
    );

    return NextResponse.json(
      {
        message: "โหลดข้อความสำเร็จ",
        messages: messagesWithSender,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET TICKET MESSAGES ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "ไม่สามารถโหลดข้อความได้",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/tickets/[id]/messages
// ส่งข้อความใหม่
// =====================================================
export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const ticketId = await getTicketId(params);

    if (!ticketId) {
      return NextResponse.json(
        { message: "Ticket ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบสิทธิ์
    const access = await getAccessibleTicket(
      ticketId,
      user
    );

    if (!access.ticket) {
      return NextResponse.json(
        { message: access.message },
        { status: access.status }
      );
    }

    // Ticket ปิดงานแล้ว อ่านได้แต่ส่งข้อความใหม่ไม่ได้
    if (access.ticket.status === "CLOSED") {
      return NextResponse.json(
        {
          message: "Ticket นี้ปิดงานแล้ว ไม่สามารถส่งข้อความใหม่ได้",
        },
        { status: 409 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const messageText =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!messageText) {
      return NextResponse.json(
        { message: "กรุณาพิมพ์ข้อความ" },
        { status: 400 }
      );
    }

    if (messageText.length > 2000) {
      return NextResponse.json(
        {
          message: "ข้อความต้องไม่เกิน 2,000 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    // =================================================
    // Prisma 8: บันทึกข้อความใหม่
    // =================================================
    const newMessage =
      await db.orm.public.TicketMessage.create({
        ticketId,
        senderId: user.id,
        message: messageText,
      });

    const messageWithSender =
      await addSenderToMessage(newMessage);

    return NextResponse.json(
      {
        message: "ส่งข้อความสำเร็จ",
        chatMessage: messageWithSender,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST TICKET MESSAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "ไม่สามารถส่งข้อความได้",
      },
      { status: 500 }
    );
  }
}
