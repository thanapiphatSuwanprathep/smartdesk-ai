
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../src/prisma/db";

// ========================================
// อ่าน User จาก Session
// ========================================
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
// เพิ่มข้อมูลเจ้าหน้าที่ผู้รับงาน
// ========================================
async function addAssigneeToTicket(ticket) {
  let assignee = null;

  if (ticket.assignedToId != null) {
    const assignedUser = await db.orm.public.User.first({
      id: Number(ticket.assignedToId),
    });

    if (assignedUser) {
      assignee = {
        id: assignedUser.id,
        name: assignedUser.name,
        email: assignedUser.email,
        role: assignedUser.role,
      };
    }
  }

  return {
    ...ticket,
    assignee,
  };
}

// ========================================
// GET /api/tickets/[id]
// ดูรายละเอียด Ticket ของตัวเอง
// ========================================
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

    // USER ดูได้เฉพาะ Ticket ของตัวเอง
    const ticket = await db.orm.public.Ticket.first({
      id: ticketId,
      userId: user.id,
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "ไม่พบ Ticket" },
        { status: 404 }
      );
    }

    // เพิ่มชื่อและอีเมลเจ้าหน้าที่ IT
    const ticketWithAssignee =
      await addAssigneeToTicket(ticket);

    return NextResponse.json(
      {
        ticket: ticketWithAssignee,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET TICKET DETAIL ERROR:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถโหลดข้อมูล Ticket ได้",
      },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH /api/tickets/[id]
// USER ยืนยันผลการแก้ไข Ticket
// ========================================
export async function PATCH(request, { params }) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // เฉพาะ USER เท่านั้น
    if (user.role !== "USER") {
      return NextResponse.json(
        {
          message:
            "เฉพาะผู้แจ้งปัญหาเท่านั้นที่ยืนยันผลได้",
        },
        { status: 403 }
      );
    }

    const ticketId = await getTicketId(params);

    if (!ticketId) {
      return NextResponse.json(
        { message: "Ticket ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเป็น Ticket ของ USER คนนี้
    const ticket = await db.orm.public.Ticket.first({
      id: ticketId,
      userId: user.id,
    });

    if (!ticket) {
      return NextResponse.json(
        {
          message:
            "ไม่พบ Ticket หรือไม่มีสิทธิ์เข้าถึง",
        },
        { status: 404 }
      );
    }

    // อ่านสถานะใหม่
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const status = body?.status;

    // USER เลือกได้แค่ 2 สถานะ
    if (!["CLOSED", "IN_PROGRESS"].includes(status)) {
      return NextResponse.json(
        { message: "สถานะที่เลือกไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ต้องรอให้ IT แก้ไขเสร็จก่อน
    if (ticket.status !== "RESOLVED") {
      return NextResponse.json(
        {
          message:
            "สามารถยืนยันผลได้เฉพาะ Ticket ที่เจ้าหน้าที่แก้ไขเสร็จแล้ว",
        },
        { status: 409 }
      );
    }

    // ====================================
    // Prisma ORM 8 - UPDATE
    // ====================================
    await db.orm.public.Ticket
      .where({
        id: ticketId,
        userId: user.id,
        status: "RESOLVED",
      })
      .update({
        status,
        updatedAt: Temporal.Now.instant(),
      });

    // โหลด Ticket ล่าสุดหลังอัปเดต
    const updatedTicket =
      await db.orm.public.Ticket.first({
        id: ticketId,
        userId: user.id,
      });

    if (
      !updatedTicket ||
      updatedTicket.status !== status
    ) {
      return NextResponse.json(
        {
          message:
            "ไม่สามารถเปลี่ยนสถานะ Ticket ได้",
        },
        { status: 409 }
      );
    }

    // เพิ่มข้อมูลเจ้าหน้าที่ผู้รับงาน
    const ticketWithAssignee =
      await addAssigneeToTicket(updatedTicket);

    return NextResponse.json(
      {
        message:
          status === "CLOSED"
            ? "ยืนยันการแก้ไขและปิด Ticket สำเร็จ"
            : "ส่ง Ticket กลับให้เจ้าหน้าที่ดำเนินการต่อแล้ว",
        ticket: ticketWithAssignee,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH USER TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "เกิดข้อผิดพลาดในการอัปเดต Ticket",
      },
      { status: 500 }
    );
  }
}
