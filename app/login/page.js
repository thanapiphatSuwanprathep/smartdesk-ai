"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // Login
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      await Swal.fire({
        icon: "warning",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกอีเมลและรหัสผ่าน",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      // ดูข้อมูลจาก Login API
      console.log("LOGIN RESPONSE:", data);
      console.log("LOGIN USER:", data.user);
      console.log("LOGIN ROLE:", data.user?.role);

      // =================================================
      // Login ไม่สำเร็จ
      // =================================================
      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          confirmButtonText: "ตกลง",
        });

        return;
      }

      // ป้องกันกรณี API ไม่ส่ง User กลับมา
      if (!data.user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้งานจากระบบ");
      }

      // =================================================
      // Login สำเร็จ
      // =================================================
      await Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: `ยินดีต้อนรับ ${data.user.name}`,
        confirmButtonText: "ตกลง",
        timer: 1200,
        timerProgressBar: true,
      });

      // =================================================
      // ตรวจสอบ Role
      // =================================================
      const role = String(data.user.role || "")
        .trim()
        .toUpperCase();

      console.log("NORMALIZED ROLE:", role);

      // =================================================
      // Redirect ตาม Role
      // =================================================

      // IT
      if (role === "IT") {
        window.location.href = "/it/dashboard";
        return;
      }

      // ADMIN
      if (role === "ADMIN") {
        window.location.href = "/admin/dashboard";
        return;
      }

      // USER
      if (role === "USER") {
        window.location.href = "/dashboard";
        return;
      }

      // Role ไม่รู้จัก
      await Swal.fire({
        icon: "error",
        title: "Role ไม่ถูกต้อง",
        text: `ไม่พบสิทธิ์การใช้งาน: ${role}`,
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อกับระบบได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // หน้า Login
  // =====================================================
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card border-0 shadow p-4"
        style={{
          width: "100%",
          maxWidth: "450px",
        }}
      >
        <div className="card-body">
          {/* Title */}
          <div className="text-center mb-4">
            <h2
              className="fw-bold mb-1"
              style={{
                color: "#111111",
              }}
            >
              SmartDesk AI
            </h2>

            <p className="text-secondary mb-0">เข้าสู่ระบบ IT Helpdesk</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-semibold">อีเมล</label>

              <input
                type="email"
                className="form-control"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold">รหัสผ่าน</label>

              <input
                type="password"
                className="form-control"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="text-end mt-2 mb-3">
              <Link
                href="/forgot-password"
                className="text-decoration-none fw-semibold"
                style={{ fontSize: "13px", color: "#1768d2" }}
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          {/* Register */}
          <div className="text-center mt-4">
            <span className="text-secondary">ยังไม่มีบัญชี? </span>

            <Link href="/register" className="text-decoration-none fw-semibold">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
