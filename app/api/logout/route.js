
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    // สร้าง Response
    const response = NextResponse.json(
      {
        success: true,
        message: "ออกจากระบบสำเร็จ",
      },
      {
        status: 200,
      }
    );

    // ลบ Session Cookie ของ SmartDesk AI
    response.cookies.set({
      name: "smartdesk_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });

    return response;

  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      },
      {
        status: 500,
      }
    );
  }
}
