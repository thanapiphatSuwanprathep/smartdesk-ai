import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "../../../src/prisma/db";
import AdminNavbar from "../../../components/AdminNavbar";
import "./dashboard.css";

export const dynamic = "force-dynamic";

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================
async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartdesk_session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null;
    }

    const user = await db.orm.public.User.first({
      id: userId,
    });

    return user?.role === "ADMIN" ? user : null;
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
    return null;
  }
}

// ==========================================
// CONFIGURATION
// ==========================================
const statusConfig = {
  OPEN: {
    label: "เปิดใหม่",
    className: "open",
    color: "#3b82f6",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    className: "progress",
    color: "#f59e0b",
  },
  RESOLVED: {
    label: "รอยืนยันผล",
    className: "resolved",
    color: "#10b981",
  },
  CLOSED: {
    label: "ปิดงานแล้ว",
    className: "closed",
    color: "#64748b",
  },
};

const priorityConfig = {
  LOW: {
    label: "ต่ำ",
    className: "low",
  },
  MEDIUM: {
    label: "ปานกลาง",
    className: "medium",
  },
  HIGH: {
    label: "สูง",
    className: "high",
  },
  URGENT: {
    label: "เร่งด่วน",
    className: "urgent",
  },
};

const roleConfig = [
  {
    role: "USER",
    label: "ผู้ใช้งานทั่วไป",
    color: "#3b82f6",
  },
  {
    role: "IT",
    label: "เจ้าหน้าที่ IT",
    color: "#06b6d4",
  },
  {
    role: "ADMIN",
    label: "ผู้ดูแลระบบ",
    color: "#334155",
  },
];

function formatDate(value) {
  if (value == null || value === "") {
    return "-";
  }

  try {
    let dateValue = value;

    // รองรับ Temporal.Instant จาก Prisma
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.epochMilliseconds === "number"
    ) {
      dateValue = value.epochMilliseconds;
    }

    // รองรับ Date Object และออบเจ็กต์ที่แปลงเป็น String ได้
    else if (typeof value === "object" && !(value instanceof Date)) {
      dateValue = String(value);
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    });
  } catch (error) {
    console.error("FORMAT DATE ERROR:", error);
    return "-";
  }
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================
function SectionHeader({ eyebrow, title, description, href, linkText }) {
  return (
    <div className="enterprise-section-heading">
      <div>
        {eyebrow && <div className="enterprise-eyebrow">{eyebrow}</div>}

        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>

      {href && (
        <Link href={href} className="enterprise-section-link">
          {linkText || "ดูทั้งหมด"}
          <span aria-hidden="true">↗</span>
        </Link>
      )}
    </div>
  );
}

function MetricCard({ label, value, description, icon, tone = "blue" }) {
  return (
    <div className="enterprise-metric-card">
      <div className="enterprise-metric-top">
        <span className={`enterprise-metric-icon tone-${tone}`}>{icon}</span>

        <span className="enterprise-metric-caption">OVERVIEW</span>
      </div>

      <div className="enterprise-metric-label">{label}</div>

      <div className="enterprise-metric-value">{value}</div>

      <div className="enterprise-metric-description">{description}</div>
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
export default async function AdminDashboardPage() {
  const admin = await getAdmin();

  if (!admin) {
    redirect("/login");
  }

  // ข้อมูลจริงจากฐานข้อมูลเดิม
  const [tickets, users] = await Promise.all([
    db.orm.public.Ticket.all(),
    db.orm.public.User.all(),
  ]);

  const countStatus = (status) =>
    tickets.filter((ticket) => ticket.status === status).length;

  const countRole = (role) => users.filter((user) => user.role === role).length;

  const totalTickets = tickets.length;
  const totalUsers = users.length;

  const openTickets = countStatus("OPEN");
  const inProgressTickets = countStatus("IN_PROGRESS");
  const resolvedTickets = countStatus("RESOLVED");
  const closedTickets = countStatus("CLOSED");

  const completedTickets = resolvedTickets + closedTickets;
  const pendingTickets = openTickets + inProgressTickets;

  const completionRate =
    totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  const recentTickets = [...tickets]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 10);

  const userMap = new Map(users.map((user) => [Number(user.id), user]));

  const summaryCards = [
    {
      label: "Ticket ทั้งหมด",
      value: totalTickets,
      description: "รายการแจ้งปัญหาทั้งหมดในระบบ",
      icon: "▤",
      tone: "blue",
    },
    {
      label: "กำลังดำเนินการ",
      value: inProgressTickets,
      description: "Ticket ที่เจ้าหน้าที่กำลังดูแล",
      icon: "◷",
      tone: "amber",
    },
    {
      label: "แก้ไขแล้ว / ปิดงาน",
      value: completedTickets,
      description: "รายการที่แก้ไขแล้วหรือปิดงาน",
      icon: "✓",
      tone: "green",
    },
    {
      label: "ผู้ใช้งานทั้งหมด",
      value: totalUsers,
      description: "รวมบัญชี USER, IT และ ADMIN",
      icon: "♙",
      tone: "slate",
    },
  ];

  const statusData = Object.entries(statusConfig).map(([status, config]) => ({
    status,
    ...config,
    value: countStatus(status),
    percent: totalTickets > 0 ? (countStatus(status) / totalTickets) * 100 : 0,
  }));

  const roleData = roleConfig.map((item) => ({
    ...item,
    value: countRole(item.role),
    percent: totalUsers > 0 ? (countRole(item.role) / totalUsers) * 100 : 0,
  }));

  // SVG donut chart:
  // ใช้ข้อมูลจริง ไม่ต้องติดตั้ง Chart.js
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const donutSegments = statusData.map((item) => {
    const offset = accumulatedPercent;

    accumulatedPercent += item.percent;

    return {
      ...item,
      dashArray: `${(item.percent / 100) * circumference} ${circumference}`,
      dashOffset: -((offset / 100) * circumference),
    };
  });

  return (
    <div className="enterprise-dashboard">
      <AdminNavbar adminName={admin.name} />

      <main className="container enterprise-container">
        {/* ==================================
            HEADER
        ================================== */}
        <header className="enterprise-page-header">
          <div>
            <div className="enterprise-breadcrumb">
              <span>SmartDesk AI</span>
              <span>/</span>
              <span>Administration</span>
              <span>/</span>
              <strong>Overview</strong>
            </div>

            <div className="enterprise-heading-row">
              <h1>Dashboard Overview</h1>

              <span className="enterprise-header-status">
                <span />
                Admin Workspace
              </span>
            </div>

            <p>ภาพรวมการดำเนินงานและประสิทธิภาพการให้บริการ IT</p>

            <div className="enterprise-admin-meta">
              เข้าสู่ระบบในชื่อ
              <strong>{admin.name}</strong>
            </div>
          </div>

          <div className="enterprise-header-actions">
            <Link
              href="/admin/users"
              className="enterprise-btn enterprise-btn-light"
            >
              จัดการผู้ใช้งาน
            </Link>

            <Link
              href="/admin/tickets"
              className="enterprise-btn enterprise-btn-primary"
            >
              ดู Ticket ทั้งหมด
              <span>↗</span>
            </Link>
          </div>
        </header>

        {/* ==================================
            KEY METRICS
        ================================== */}
        <section className="enterprise-section">
          <SectionHeader
            eyebrow="KEY METRICS"
            title="ภาพรวมระบบ"
            description="สรุปข้อมูลสำคัญจากระบบ SmartDesk AI"
          />

          <div className="row g-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="col-sm-6 col-xl-3">
                <MetricCard {...card} />
              </div>
            ))}
          </div>
        </section>

        {/* ==================================
            ANALYTICS
        ================================== */}
        <section className="enterprise-section">
          <SectionHeader
            eyebrow="OPERATIONS ANALYTICS"
            title="วิเคราะห์การดำเนินงาน"
            description="สถานะ Ticket และสัดส่วนผู้ใช้งาน"
            href="/admin/tickets"
            linkText="จัดการ Ticket"
          />

          <div className="row g-3">
            {/* TICKET DISTRIBUTION */}
            <div className="col-xl-7">
              <div className="enterprise-panel h-100">
                <div className="enterprise-panel-header">
                  <div>
                    <h3>Ticket Distribution</h3>
                    <p>สัดส่วน Ticket จำแนกตามสถานะ</p>
                  </div>

                  <span className="enterprise-panel-label">All Tickets</span>
                </div>

                <div className="enterprise-donut-layout">
                  <div className="enterprise-donut-wrap">
                    <svg
                      viewBox="0 0 200 200"
                      className="enterprise-donut"
                      role="img"
                      aria-label={`กราฟสถานะ Ticket ทั้งหมด ${totalTickets} รายการ`}
                    >
                      <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="#e9eef5"
                        strokeWidth="21"
                      />

                      {donutSegments.map((segment) => (
                        <circle
                          key={segment.status}
                          cx="100"
                          cy="100"
                          r={radius}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="21"
                          strokeDasharray={segment.dashArray}
                          strokeDashoffset={segment.dashOffset}
                          transform="rotate(-90 100 100)"
                        />
                      ))}

                      <text
                        x="100"
                        y="94"
                        textAnchor="middle"
                        className="enterprise-donut-number"
                      >
                        {totalTickets}
                      </text>

                      <text
                        x="100"
                        y="115"
                        textAnchor="middle"
                        className="enterprise-donut-caption"
                      >
                        Total Tickets
                      </text>
                    </svg>
                  </div>

                  <div className="enterprise-chart-legend">
                    {statusData.map((item) => (
                      <div key={item.status} className="enterprise-legend-row">
                        <div className="enterprise-legend-name">
                          <span
                            className="enterprise-legend-dot"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />
                          {item.label}
                        </div>

                        <div className="enterprise-legend-numbers">
                          <strong>{item.value}</strong>
                          <span>{Math.round(item.percent)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="enterprise-panel-footer">
                  <div>
                    <span>Completion Rate</span>
                    <strong>{completionRate}%</strong>
                  </div>

                  <div className="enterprise-completion-track">
                    <div
                      style={{
                        width: `${completionRate}%`,
                      }}
                    />
                  </div>

                  <p>
                    นับ Ticket ที่แก้ไขแล้วและปิดงาน รวม {completedTickets}{" "}
                    รายการ
                  </p>
                </div>
              </div>
            </div>

            {/* USER DISTRIBUTION */}
            <div className="col-xl-5">
              <div className="enterprise-panel h-100">
                <div className="enterprise-panel-header">
                  <div>
                    <h3>User Distribution</h3>
                    <p>จำนวนบัญชีผู้ใช้งานตามบทบาท</p>
                  </div>

                  <Link href="/admin/users" className="enterprise-panel-link">
                    จัดการ ↗
                  </Link>
                </div>

                <div className="enterprise-role-chart">
                  {roleData.map((item) => (
                    <div key={item.role} className="enterprise-role-item">
                      <div className="enterprise-role-heading">
                        <div>
                          <span
                            className="enterprise-legend-dot"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          <strong>{item.role}</strong>
                          <span>{item.label}</span>
                        </div>

                        <b>{item.value}</b>
                      </div>

                      <div className="enterprise-role-track">
                        <div
                          style={{
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>

                      <div className="enterprise-role-percent">
                        {Math.round(item.percent)}% ของผู้ใช้ทั้งหมด
                      </div>
                    </div>
                  ))}
                </div>

                <div className="enterprise-users-total">
                  <div>
                    <span>Total Accounts</span>
                    <strong>{totalUsers}</strong>
                  </div>

                  <span>3 User Roles</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================
            STATUS OVERVIEW
        ================================== */}
        <section className="enterprise-section">
          <SectionHeader
            eyebrow="TICKET MONITORING"
            title="สถานะการให้บริการ"
            description="ติดตามรายการที่รอดำเนินการและงานที่เสร็จแล้ว"
          />

          <div className="row g-3">
            {statusData.map((item) => (
              <div key={item.status} className="col-sm-6 col-xl-3">
                <div className="enterprise-status-card">
                  <div className="enterprise-status-top">
                    <span
                      className="enterprise-status-dot"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span>{item.status.replaceAll("_", " ")}</span>
                  </div>

                  <div className="enterprise-status-title">{item.label}</div>

                  <div className="enterprise-status-number">{item.value}</div>

                  <div className="enterprise-status-bottom">
                    <div className="enterprise-status-track">
                      <div
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <span>{Math.round(item.percent)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================
            RECENT TICKETS
        ================================== */}
        <section className="enterprise-section">
          <SectionHeader
            eyebrow="RECENT ACTIVITY"
            title="Ticket ล่าสุด"
            description="รายการแจ้งปัญหาล่าสุด 10 รายการ"
            href="/admin/tickets"
            linkText="ดู Ticket ทั้งหมด"
          />

          <div className="enterprise-panel enterprise-table-panel">
            <div className="table-responsive">
              <table className="table enterprise-ticket-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>หัวข้อปัญหา</th>
                    <th>ผู้แจ้ง</th>
                    <th>ผู้รับงาน</th>
                    <th>ความสำคัญ</th>
                    <th>สถานะ</th>
                    <th>วันที่แจ้ง</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="enterprise-empty">
                        ยังไม่มีรายการ Ticket ในระบบ
                      </td>
                    </tr>
                  ) : (
                    recentTickets.map((ticket) => {
                      const reporter = userMap.get(Number(ticket.userId));

                      const assignee =
                        ticket.assignedToId == null
                          ? null
                          : userMap.get(Number(ticket.assignedToId));

                      const status = statusConfig[ticket.status] || {
                        label: ticket.status,
                        className: "closed",
                      };

                      const priority = priorityConfig[ticket.priority] || {
                        label: ticket.priority,
                        className: "low",
                      };

                      return (
                        <tr key={ticket.id}>
                          <td>
                            <span className="enterprise-ticket-id">
                              #{ticket.id}
                            </span>
                          </td>

                          <td>
                            <Link
                              href={`/admin/tickets/${ticket.id}`}
                              className="enterprise-ticket-title"
                            >
                              {ticket.title}
                            </Link>
                          </td>

                          <td>{reporter?.name || "-"}</td>

                          <td>{assignee?.name || "ยังไม่มอบหมาย"}</td>

                          <td>
                            <span
                              className={`enterprise-priority priority-${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`enterprise-ticket-status status-${status.className}`}
                            >
                              <span />
                              {status.label}
                            </span>
                          </td>

                          <td>{formatDate(ticket.createdAt)}</td>

                          <td>
                            <Link
                              href={`/admin/tickets/${ticket.id}`}
                              className="enterprise-detail-link"
                            >
                              ดูรายละเอียด →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="enterprise-table-footer">
              <span>
                แสดง {recentTickets.length} จาก {totalTickets} รายการ
              </span>

              <Link href="/admin/tickets">View All Tickets ↗</Link>
            </div>
          </div>
        </section>

        <footer className="enterprise-footer">
          <span>© SmartDesk AI — Administration Workspace</span>

          <span>IT Helpdesk Management System</span>
        </footer>
      </main>
    </div>
  );
}
