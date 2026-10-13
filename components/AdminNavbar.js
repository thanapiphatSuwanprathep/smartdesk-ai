
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function AdminNavbar({ adminName }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    const result = await Swal.fire({
      title: "ยืนยันการออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc3545",
    });

    if (!result.isConfirmed) return;

    try {
      setLoggingOut(true);

      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("ออกจากระบบไม่สำเร็จ");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message,
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="navbar bg-white border-bottom shadow-sm">
      <div className="container py-3">
        <Link
          href="/admin/dashboard"
          className="navbar-brand fw-bold text-primary"
        >
          SmartDesk AI
        </Link>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Link
            href="/admin/dashboard"
            className="btn btn-outline-primary btn-sm"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/tickets"
            className="btn btn-outline-primary btn-sm"
          >
            จัดการ Ticket
          </Link>

          <Link
            href="/admin/users"
            className="btn btn-outline-primary btn-sm"
          >
            จัดการผู้ใช้
          </Link>

          <span className="badge bg-dark">
            ADMIN
          </span>

          <span className="small text-secondary">
            {adminName}
          </span>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </nav>
  );
}
