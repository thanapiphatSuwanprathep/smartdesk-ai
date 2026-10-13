
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "ลิงก์ไม่ถูกต้อง",
        text: "กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่",
      });
      return;
    }

    if (password.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
      });
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณายืนยันรหัสผ่านอีกครั้ง",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "ไม่พบ API รีเซ็ตรหัสผ่าน กรุณาตรวจสอบ app/api/reset-password/route.js"
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        text: "เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว",
        confirmButtonText: "ไปหน้าเข้าสู่ระบบ",
        confirmButtonColor: "#7045d5",
      });

      window.location.replace("/login");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message,
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background:
          "linear-gradient(135deg, #f8f5ff, #e9ddff)",
      }}
    >
      <div
        className="card border-0 shadow-lg w-100"
        style={{
          maxWidth: 460,
          borderRadius: 22,
        }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "#eee7ff",
                color: "#7045d5",
                fontSize: 28,
              }}
            >
              🔐
            </div>

            <h2
              className="fw-bold mb-2"
              style={{ color: "#281b45" }}
            >
              ตั้งรหัสผ่านใหม่
            </h2>

            <p className="text-secondary">
              กำหนดรหัสผ่านใหม่สำหรับบัญชี SmartDesk AI
            </p>
          </div>

          {!token ? (
            <div className="text-center">
              <div className="alert alert-danger">
                ไม่พบโทเค็นรีเซ็ตรหัสผ่าน
              </div>

              <Link href="/forgot-password">
                ขอรับลิงก์ใหม่
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  รหัสผ่านใหม่
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control py-3"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  ยืนยันรหัสผ่านใหม่
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control py-3"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-check mb-4">
                <input
                  id="showPassword"
                  type="checkbox"
                  className="form-check-input"
                  checked={showPassword}
                  onChange={(e) =>
                    setShowPassword(e.target.checked)
                  }
                />

                <label
                  htmlFor="showPassword"
                  className="form-check-label"
                >
                  แสดงรหัสผ่าน
                </label>
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
                {loading
                  ? "กำลังบันทึกรหัสผ่าน..."
                  : "ยืนยันการเปลี่ยนรหัสผ่าน"}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-decoration-none fw-semibold"
              style={{ color: "#7045d5" }}
            >
              ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>กำลังโหลด...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
