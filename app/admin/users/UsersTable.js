
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const roleColors = {
  USER: "primary",
  IT: "info",
  ADMIN: "dark",
};

export default function UsersTable({ users, adminId }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        String(user.id).includes(keyword);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  async function handleEditRole(user) {
    if (user.id === adminId || user.role === "ADMIN") {
      return;
    }

    const result = await Swal.fire({
      title: "เปลี่ยนสิทธิ์ผู้ใช้งาน",
      html: `
        <div style="text-align:left">
          <p><strong>ชื่อ:</strong> ${escapeHtml(user.name)}</p>
          <p><strong>อีเมล:</strong> ${escapeHtml(user.email)}</p>
          <label for="new-role" style="margin-bottom:8px">
            เลือกสิทธิ์ใหม่
          </label>
          <select id="new-role" class="swal2-select"
            style="display:block;width:100%;margin:0">
            <option value="USER" ${user.role === "USER" ? "selected" : ""}>
              USER - พนักงาน
            </option>
            <option value="IT" ${user.role === "IT" ? "selected" : ""}>
              IT - เจ้าหน้าที่
            </option>
          </select>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#0d6efd",
      preConfirm: () => {
        const role =
          document.getElementById("new-role")?.value;

        if (!["USER", "IT"].includes(role)) {
          Swal.showValidationMessage("กรุณาเลือกสิทธิ์");
          return false;
        }

        if (role === user.role) {
          Swal.showValidationMessage(
            "กรุณาเลือกสิทธิ์ที่แตกต่างจากเดิม"
          );
          return false;
        }

        return role;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการเปลี่ยนสิทธิ์?",
      text: `เปลี่ยน ${user.name} จาก ${user.role} เป็น ${result.value}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setUpdatingId(user.id);

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: result.value,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้"
        );
      }

      await Swal.fire({
        title: "สำเร็จ",
        text: data.message,
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      router.refresh();
    } catch (error) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: error.message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">
            ผู้ใช้งานทั้งหมด ({filteredUsers.length})
          </h5>

          <div className="d-flex flex-wrap gap-2">
            <input
              type="search"
              className="form-control"
              style={{ minWidth: 220 }}
              placeholder="ค้นหาชื่อ อีเมล หรือ ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form-select"
              style={{ width: 145 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">ทุกสิทธิ์</option>
              <option value="USER">USER</option>
              <option value="IT">IT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สิทธิ์</th>
                <th>จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>

                  <td className="fw-semibold">
                    {user.name}
                    {user.id === adminId && (
                      <span className="badge bg-secondary ms-2">
                        คุณ
                      </span>
                    )}
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span
                      className={`badge bg-${
                        roleColors[user.role] || "secondary"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td>
                    {user.id === adminId ||
                    user.role === "ADMIN" ? (
                      <span className="text-secondary small">
                        ไม่สามารถแก้ไขสิทธิ์
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        disabled={updatingId !== null}
                        onClick={() => handleEditRole(user)}
                      >
                        {updatingId === user.id
                          ? "กำลังบันทึก..."
                          : "แก้ไขสิทธิ์"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-secondary py-4"
                  >
                    ไม่พบผู้ใช้งานที่ตรงกับการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
