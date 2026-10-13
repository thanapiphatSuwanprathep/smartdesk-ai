
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./tickets.css";

// ==========================================
// STATUS CONFIGURATION
// ==========================================
const statusConfig = {
  OPEN: {
    label: "เปิดใหม่",
    className: "open",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    className: "progress",
  },
  RESOLVED: {
    label: "รอยืนยันผล",
    className: "resolved",
  },
  CLOSED: {
    label: "ปิดงานแล้ว",
    className: "closed",
  },
};

// ==========================================
// PRIORITY CONFIGURATION
// ==========================================
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

// ==========================================
// FORMAT DATE
// ==========================================
function formatDate(value) {
  if (value == null || value === "") return "-";

  try {
    let dateValue = value;

    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.epochMilliseconds === "number"
    ) {
      dateValue = value.epochMilliseconds;
    } else if (
      typeof value === "object" &&
      !(value instanceof Date)
    ) {
      dateValue = String(value);
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return "-";
  }
}

// ==========================================
// STAT CARD
// ==========================================
function StatCard({ label, value, tone, caption }) {
  return (
    <div className={`ticket-stat-card ticket-stat-${tone}`}>
      <div className="ticket-stat-heading">
        <span className="ticket-stat-indicator" />
        <span>{label}</span>
      </div>

      <div className="ticket-stat-number">
        {Number(value).toLocaleString("th-TH")}
      </div>

      <div className="ticket-stat-caption">
        {caption}
      </div>
    </div>
  );
}

// ==========================================
// ADMIN TICKETS PAGE
// ==========================================
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // ========================================
  // LOAD TICKETS
  // ========================================
  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/tickets", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "โหลด Ticket ไม่สำเร็จ"
          );
        }

        setTickets(data.tickets || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error("LOAD ADMIN TICKETS ERROR:", err);
        setError(err.message || "โหลด Ticket ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  // ========================================
  // SEARCH AND FILTER
  // ========================================
  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        String(ticket.id).includes(keyword) ||
        String(ticket.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.reporter?.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.assignee?.name || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        ticket.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  // ========================================
  // STATISTICS
  // ========================================
  const statCards = [
    {
      label: "Ticket ทั้งหมด",
      value: stats?.total ?? 0,
      tone: "total",
      caption: "รายการทั้งหมดในระบบ",
    },
    {
      label: "เปิดใหม่",
      value: stats?.OPEN ?? 0,
      tone: "open",
      caption: "รอเจ้าหน้าที่รับงาน",
    },
    {
      label: "กำลังดำเนินการ",
      value: stats?.IN_PROGRESS ?? 0,
      tone: "progress",
      caption: "อยู่ระหว่างแก้ไขปัญหา",
    },
    {
      label: "รอยืนยันผล",
      value: stats?.RESOLVED ?? 0,
      tone: "resolved",
      caption: "รอผู้แจ้งยืนยันผล",
    },
    {
      label: "ปิดงานแล้ว",
      value: stats?.CLOSED ?? 0,
      tone: "closed",
      caption: "ดำเนินการเสร็จสมบูรณ์",
    },
  ];

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  }

  return (
    <div className="admin-tickets-page">
      {/* ====================================
          NAVIGATION
      ==================================== */}
      <nav className="admin-tickets-navbar">
        <div className="container admin-tickets-navbar-inner">
          <Link
            href="/admin/dashboard"
            className="admin-tickets-brand"
          >
            <span className="admin-tickets-brand-icon">
              S
            </span>

            <span>
              SmartDesk <strong>AI</strong>
            </span>
          </Link>

          <div className="admin-tickets-nav-right">
            <Link
              href="/admin/dashboard"
              className="admin-tickets-nav-link"
            >
              Dashboard
            </Link>

            <span className="admin-tickets-nav-divider" />

            <span className="admin-tickets-role">
              ADMIN
            </span>
          </div>
        </div>
      </nav>

      {/* ====================================
          MAIN CONTENT
      ==================================== */}
      <main className="container admin-tickets-main">
        {/* BREADCRUMB */}
        <div className="admin-tickets-breadcrumb">
          <Link href="/admin/dashboard">
            Administration
          </Link>

          <span>/</span>

          <strong>Ticket Management</strong>
        </div>

        {/* PAGE HEADER */}
        <div className="admin-tickets-header">
          <div>
            <div className="admin-tickets-eyebrow">
              SERVICE DESK / OPERATIONS
            </div>

            <h1>Ticket Management</h1>

            <p>
              จัดการ ตรวจสอบ และติดตามสถานะการแจ้งปัญหา IT
              ทั้งหมดในระบบ
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="admin-tickets-back-button"
          >
            <span>←</span>
            กลับไป Dashboard
          </Link>
        </div>

        {/* ====================================
            LOADING
        ==================================== */}
        {loading ? (
          <div className="admin-tickets-state">
            <div
              className="spinner-border text-primary"
              role="status"
            />

            <h3>กำลังโหลดข้อมูล Ticket</h3>
            <p>กรุณารอสักครู่...</p>
          </div>
        ) : error ? (
          <div className="admin-tickets-error">
            <strong>ไม่สามารถโหลดข้อมูลได้</strong>
            <p>{error}</p>

            <button
              type="button"
              className="admin-tickets-retry"
              onClick={() => window.location.reload()}
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <>
            {/* ====================================
                STATISTICS
            ==================================== */}
            <section className="admin-tickets-section">
              <div className="admin-tickets-section-header">
                <div>
                  <div className="admin-tickets-eyebrow">
                    OVERVIEW
                  </div>

                  <h2>ภาพรวมรายการแจ้งปัญหา</h2>
                </div>

                <span className="admin-tickets-section-meta">
                  Ticket Statistics
                </span>
              </div>

              <div className="admin-tickets-stats-grid">
                {statCards.map((card) => (
                  <StatCard
                    key={card.label}
                    {...card}
                  />
                ))}
              </div>
            </section>

            {/* ====================================
                TICKET LIST
            ==================================== */}
            <section className="admin-tickets-section">
              <div className="admin-tickets-panel">
                {/* PANEL HEADER */}
                <div className="admin-tickets-panel-header">
                  <div>
                    <div className="admin-tickets-eyebrow">
                      ALL REQUESTS
                    </div>

                    <h2>รายการ Ticket</h2>

                    <p>
                      แสดง {filteredTickets.length} จาก{" "}
                      {tickets.length} รายการ
                    </p>
                  </div>

                  <div className="admin-tickets-count">
                    {filteredTickets.length} Tickets
                  </div>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="admin-tickets-toolbar">
                  <div className="admin-tickets-search">
                    <span
                      className="admin-tickets-search-icon"
                      aria-hidden="true"
                    >
                      ⌕
                    </span>

                    <input
                      type="search"
                      placeholder="ค้นหา ID, หัวข้อ, ผู้แจ้ง หรือเจ้าหน้าที่..."
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      aria-label="ค้นหา Ticket"
                    />
                  </div>

                  <div className="admin-tickets-filters">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value)
                      }
                      aria-label="กรองตามสถานะ"
                    >
                      <option value="ALL">
                        ทุกสถานะ
                      </option>

                      {Object.entries(statusConfig).map(
                        ([value, config]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {config.label}
                          </option>
                        )
                      )}
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) =>
                        setPriorityFilter(e.target.value)
                      }
                      aria-label="กรองตามความสำคัญ"
                    >
                      <option value="ALL">
                        ทุกความสำคัญ
                      </option>

                      {Object.entries(priorityConfig).map(
                        ([value, config]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {config.label}
                          </option>
                        )
                      )}
                    </select>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="admin-tickets-clear"
                        onClick={clearFilters}
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLE */}
                <div className="table-responsive">
                  <table className="table admin-tickets-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>หัวข้อปัญหา</th>
                        <th>ผู้แจ้ง</th>
                        <th>เจ้าหน้าที่ IT</th>
                        <th>ความสำคัญ</th>
                        <th>สถานะ</th>
                        <th>วันที่แจ้ง</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="admin-tickets-empty"
                          >
                            <div className="admin-tickets-empty-icon">
                              ⌕
                            </div>

                            <strong>
                              ไม่พบ Ticket ที่ตรงกับเงื่อนไข
                            </strong>

                            <p>
                              ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                            </p>

                            {hasActiveFilters && (
                              <button
                                type="button"
                                onClick={clearFilters}
                              >
                                ล้างตัวกรองทั้งหมด
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((ticket) => {
                          const status =
                            statusConfig[ticket.status] || {
                              label: ticket.status,
                              className: "closed",
                            };

                          const priority =
                            priorityConfig[ticket.priority] || {
                              label: ticket.priority,
                              className: "low",
                            };

                          return (
                            <tr key={ticket.id}>
                              <td>
                                <span className="admin-tickets-id">
                                  #{ticket.id}
                                </span>
                              </td>

                              <td>
                                <Link
                                  href={`/admin/tickets/${ticket.id}`}
                                  className="admin-tickets-title"
                                >
                                  {ticket.title}
                                </Link>

                                <div className="admin-tickets-category">
                                  {ticket.category || "ไม่ระบุหมวดหมู่"}
                                </div>
                              </td>

                              <td>
                                <span className="admin-tickets-person">
                                  {ticket.reporter?.name || "-"}
                                </span>
                              </td>

                              <td>
                                {ticket.assignee?.name ? (
                                  <span className="admin-tickets-person">
                                    {ticket.assignee.name}
                                  </span>
                                ) : (
                                  <span className="admin-tickets-unassigned">
                                    ยังไม่มีผู้รับงาน
                                  </span>
                                )}
                              </td>

                              <td>
                                <span
                                  className={`admin-tickets-priority priority-${priority.className}`}
                                >
                                  {priority.label}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`admin-tickets-status status-${status.className}`}
                                >
                                  <span className="admin-tickets-status-dot" />
                                  {status.label}
                                </span>
                              </td>

                              <td>
                                <span className="admin-tickets-date">
                                  {formatDate(ticket.createdAt)}
                                </span>
                              </td>

                              <td>
                                <Link
                                  href={`/admin/tickets/${ticket.id}`}
                                  className="admin-tickets-detail-button"
                                >
                                  ดูรายละเอียด
                                  <span>→</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PANEL FOOTER */}
                <div className="admin-tickets-panel-footer">
                  <span>
                    แสดง {filteredTickets.length} รายการ
                    จากทั้งหมด {tickets.length} รายการ
                  </span>

                  <span>
                    SmartDesk AI · Ticket Management
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="admin-tickets-footer">
          <span>
            © SmartDesk AI — Administration Workspace
          </span>

          <span>
            IT Helpdesk Management System
          </span>
        </footer>
      </main>
    </div>
  );
}
