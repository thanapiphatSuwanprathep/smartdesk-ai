
"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกอีเมล",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "API ไม่ได้ส่ง JSON กลับมา กรุณาตรวจสอบตำแหน่งไฟล์ route.js"
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ไม่สามารถส่งคำขอได้"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "รับคำขอสำเร็จ",
        text:
          data.message ||
          "ระบบได้รับคำขอของคุณแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#7045d5",
      });

      setEmail("");
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error.message ||
          "ไม่สามารถเชื่อมต่อกับระบบได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background:
          "linear-gradient(135deg, #f8f5ff 0%, #eee7ff 100%)",
      }}
    >
      <div
        className="card border-0 shadow-lg w-100"
        style={{
          maxWidth: 460,
          borderRadius: 20,
        }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: 65,
                height: 65,
                borderRadius: 18,
                background: "#eee7ff",
                color: "#7045d5",
                fontSize: 30,
              }}
            >
              ✉
            </div>

            <h2
              className="fw-bold mb-2"
              style={{ color: "#281b45" }}
            >
              ลืมรหัสผ่าน?
            </h2>

            <p className="text-secondary mb-0">
              กรอกอีเมลที่ใช้สมัคร SmartDesk AI
              เพื่อขอลิงก์ตั้งรหัสผ่านใหม่
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="forgotEmail"
                className="form-label fw-semibold"
              >
                อีเมล
              </label>

              <input
                id="forgotEmail"
                type="email"
                className="form-control py-3"
                placeholder="example@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                autoComplete="email"
                required
                style={{
                  borderRadius: 10,
                }}
              />
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 fw-semibold"
              style={{
                background: "#7045d5",
                color: "#ffffff",
                borderRadius: 10,
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  กำลังส่งคำขอ...
                </>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-decoration-none fw-semibold"
              style={{
                color: "#7045d5",
              }}
            >
              ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>

          <div className="text-center mt-4 pt-3 border-top">
            <Link
              href="/"
              className="text-secondary text-decoration-none small"
            >
              กลับหน้าหลัก SmartDesk AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
