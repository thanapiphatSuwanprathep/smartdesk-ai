
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "../../../src/prisma/db";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";

async function getAdmin() {
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

    const user = await db.orm.public.User.first({
      id: userId,
    });

    return user?.role === "ADMIN" ? user : null;
  } catch {
    return null;
  }
}

export default async function AdminUsersPage() {
  const admin = await getAdmin();

  if (!admin) {
    redirect("/login");
  }

  const users = await db.orm.public.User.all();

  const safeUsers = users
    .map((user) => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    }))
    .sort((a, b) => a.id - b.id);

  const countRole = (role) =>
    safeUsers.filter((user) => user.role === role).length;

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: "#f5f7fb",
        color: "#212529",
      }}
    >
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container py-3">
          <Link
            href="/admin/dashboard"
            className="navbar-brand fw-bold text-primary"
          >
            SmartDesk AI
          </Link>

          <span className="badge bg-dark">ADMIN</span>
        </div>
      </nav>

      <main className="container py-5">
        <Link
          href="/admin/dashboard"
          className="text-decoration-none"
        >
          ← กลับไป Dashboard
        </Link>

        <div className="mt-4 mb-4">
          <h2 className="fw-bold">จัดการผู้ใช้งาน</h2>
          <p className="text-secondary">
            ค้นหาและจัดการสิทธิ์ผู้ใช้งานในระบบ
          </p>
        </div>

        <div className="row g-3 mb-4">
          {["USER", "IT", "ADMIN"].map((role) => (
            <div className="col-md-4" key={role}>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="text-secondary">{role}</div>
                  <h3 className="fw-bold mt-2 mb-0">
                    {countRole(role)}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <UsersTable
          users={safeUsers}
          adminId={Number(admin.id)}
        />
      </main>
    </div>
  );
}
