"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบรหัสผ่านตรงกัน
    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณากรอกรหัสผ่านทั้งสองช่องให้ตรงกัน",
      });
      return;
    }

    if (password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "สมัครสมาชิกไม่สำเร็จ",
          text: data.message || "เกิดข้อผิดพลาด",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ",
        text: "บัญชีของคุณถูกสร้างเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
      });

      // ล้างฟอร์ม
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับระบบได้",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card border-0 shadow p-4"
        style={{ width: "100%", maxWidth: "450px" }}
      >
        <div className="card-body">
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-1">SmartDesk AI</h2>
            <p className="text-secondary mb-0">
              สร้างบัญชีเพื่อใช้งานระบบ IT Helpdesk
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">ชื่อผู้ใช้งาน</label>

              <input
                type="text"
                className="form-control"
                placeholder="กรอกชื่อของคุณ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">อีเมล</label>

              <input
                type="email"
                className="form-control"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">รหัสผ่าน</label>

              <input
                type="password"
                className="form-control"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">ยืนยันรหัสผ่าน</label>

              <input
                type="password"
                className="form-control"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-secondary">มีบัญชีอยู่แล้ว? </span>

            <Link href="/login" className="text-decoration-none">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}