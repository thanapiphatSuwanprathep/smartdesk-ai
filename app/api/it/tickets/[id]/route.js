import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../../../src/prisma/db";

// =====================================================
// อ่าน User จาก Session
// =====================================================
async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartdesk_session")?.value;

  if (!token) {
    return null;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET
  );

  const { payload } = await jwtVerify(
    token,
    secret
  );

  const userId = Number(payload.userId);

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };
}

// =====================================================
// ตรวจสอบว่าเป็น IT หรือไม่
// =====================================================
async function requireIT() {
  const user = await getSessionUser();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          message: "กรุณาเข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      ),
    };
  }

  if (user.role !== "IT") {
    return {
      error: NextResponse.json(
        {
          message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return { user };
}

// =====================================================
// หา User จาก ID
// =====================================================
async function getUserById(userId) {
  if (!userId) {
    return null;
  }

  const user = await db.orm.public.User.first({
    id: Number(userId),
  });

  if (!user) {
    return null;
  }

  // ไม่ส่ง password กลับไปหน้าเว็บ
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// =====================================================
// เพิ่มข้อมูลผู้แจ้ง + ผู้รับงานให้ Ticket
// =====================================================
async function buildTicketResponse(ticket) {
  if (!ticket) {
    return null;
  }

  const reporter = await getUserById(
    ticket.userId
  );

  let assignee = null;

  if (ticket.assignedToId) {
    assignee = await getUserById(
      ticket.assignedToId
    );
  }

  return {
    ...ticket,
    reporter,
    assignee,
  };
}

// =====================================================
// GET /api/it/tickets/[id]
// =====================================================
export async function GET(request, { params }) {
  try {
    const auth = await requireIT();

    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    const ticketId = Number(id);

    if (!ticketId) {
      return NextResponse.json(
        {
          message: "หมายเลข Ticket ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // หา Ticket
    // =================================================
    const ticket =
      await db.orm.public.Ticket.first({
        id: ticketId,
      });

    if (!ticket) {
      return NextResponse.json(
        {
          message: "ไม่พบ Ticket",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // หา User ผู้แจ้ง + IT ผู้รับงาน
    // =================================================
    const ticketWithUsers =
      await buildTicketResponse(ticket);

    return NextResponse.json(
      {
        message: "โหลด Ticket สำเร็จ",
        ticket: ticketWithUsers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET IT TICKET DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "ไม่สามารถโหลดรายละเอียด Ticket ได้",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH /api/it/tickets/[id]
// เปลี่ยนสถานะ Ticket
// =====================================================
export async function PATCH(request, { params }) {
  try {
    // =================================================
    // ตรวจสอบ IT
    // =================================================
    const auth = await requireIT();

    if (auth.error) {
      return auth.error;
    }

    const itUser = auth.user;

    // =================================================
    // Ticket ID
    // =================================================
    const { id } = await params;
    const ticketId = Number(id);

    if (!ticketId) {
      return NextResponse.json(
        {
          message: "หมายเลข Ticket ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // อ่านสถานะใหม่
    // =================================================
    const body = await request.json();
    const status = body.status;

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: "สถานะ Ticket ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // หา Ticket ปัจจุบัน
    // =================================================
    const existingTicket =
      await db.orm.public.Ticket.first({
        id: ticketId,
      });

    if (!existingTicket) {
      return NextResponse.json(
        {
          message: "ไม่พบ Ticket",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // ป้องกัน IT คนอื่นแก้ Ticket ที่มีคนรับแล้ว
    // =================================================
    if (
      existingTicket.assignedToId &&
      existingTicket.assignedToId !== itUser.id
    ) {
      return NextResponse.json(
        {
          message:
            "Ticket นี้มีเจ้าหน้าที่ IT คนอื่นรับงานแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    // =================================================
    // เตรียมข้อมูล Update
    // =================================================
    const updateData = {
      status,
      updatedAt: Temporal.Now.instant(),
    };

    // =================================================
    // รับงาน
    // OPEN -> IN_PROGRESS
    // =================================================
    if (
      status === "IN_PROGRESS" &&
      existingTicket.status === "OPEN"
    ) {
      updateData.assignedToId = itUser.id;
    }

    // =================================================
    // ป้องกันการ Resolve โดยยังไม่มีคนรับ
    // =================================================
    if (
      status === "RESOLVED" &&
      !existingTicket.assignedToId
    ) {
      return NextResponse.json(
        {
          message:
            "กรุณารับงาน Ticket ก่อนเปลี่ยนเป็นแก้ไขแล้ว",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Prisma ORM 8 UPDATE
    // =================================================
    const updatedTicket =
      await db.orm.public.Ticket
        .where({
          id: ticketId,
        })
        .update(updateData);

    if (!updatedTicket) {
      return NextResponse.json(
        {
          message: "ไม่สามารถอัปเดต Ticket ได้",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // เพิ่มชื่อผู้แจ้ง + ผู้รับงานกลับไปด้วย
    // =================================================
    const ticketWithUsers =
      await buildTicketResponse(updatedTicket);

    // =================================================
    // สำเร็จ
    // =================================================
    return NextResponse.json(
      {
        message:
          status === "IN_PROGRESS"
            ? "รับงาน Ticket สำเร็จ"
            : "อัปเดตสถานะ Ticket สำเร็จ",

        ticket: ticketWithUsers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE IT TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "เกิดข้อผิดพลาดในการอัปเดต Ticket",
      },
      {
        status: 500,
      }
    );
  }
}