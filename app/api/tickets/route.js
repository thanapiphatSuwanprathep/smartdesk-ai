import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "../../../src/prisma/db";

// ======================================================
// อ่านข้อมูล User จาก JWT
// ======================================================
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


// ======================================================
// GET
// ดึง Ticket ของ User ที่ Login อยู่
// ======================================================
export async function GET() {
  try {
    // -----------------------------
    // ตรวจสอบ Login
    // -----------------------------
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "กรุณาเข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      );
    }

    // -----------------------------
    // ดึง Ticket
    // Prisma 8 ORM
    // -----------------------------
    const tickets = await db.orm.public.Ticket
  .where({
    userId: user.id,
  })
  .all();
    // -----------------------------
    // ส่งข้อมูลกลับ
    // -----------------------------
    return NextResponse.json(
      {
        message: "โหลด Ticket สำเร็จ",
        tickets: tickets,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "GET TICKETS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "ไม่สามารถโหลด Ticket ได้",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// POST
// สร้าง Ticket ใหม่
// ======================================================
export async function POST(request) {
  try {
    // -----------------------------
    // ตรวจสอบ Login
    // -----------------------------
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "กรุณาเข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      );
    }

    // -----------------------------
    // รับข้อมูลจาก Form
    // -----------------------------
    const body = await request.json();

    const title = body.title?.trim();
    const category = body.category?.trim();
    const description = body.description?.trim();
    const priority = body.priority;

    // -----------------------------
    // ตรวจข้อมูล
    // -----------------------------
    if (
      !title ||
      !category ||
      !description ||
      !priority
    ) {
      return NextResponse.json(
        {
          message: "กรุณากรอกข้อมูลให้ครบ",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------
    // ตรวจ Priority
    // -----------------------------
    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    if (!allowedPriorities.includes(priority)) {
      return NextResponse.json(
        {
          message: "ระดับความสำคัญไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------
    // สร้าง Ticket
    // -----------------------------
    const ticket = await db.orm.public.Ticket.create({
      title: title,

      description: description,

      category: category,

      priority: priority,

      status: "OPEN",

      // ดึง ID จาก JWT
      userId: user.id,

      // Prisma 8 timestamptz
      updatedAt: Temporal.Now.instant(),
    });

    // -----------------------------
    // สำเร็จ
    // -----------------------------
    return NextResponse.json(
      {
        message: "สร้าง Ticket สำเร็จ",

        ticket: {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          userId: ticket.userId,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "CREATE TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการสร้าง Ticket",
      },
      {
        status: 500,
      }
    );
  }
}