
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./tickets.css";

const STATUS = {
  OPEN: { label: "เปิดใหม่", color: "open" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", color: "progress" },
  RESOLVED: { label: "แก้ไขแล้ว", color: "resolved" },
  CLOSED: { label: "ปิดงาน", color: "closed" },
};

const PRIORITY = {
  LOW: { label: "ต่ำ", color: "low" },
  MEDIUM: { label: "ปานกลาง", color: "medium" },
  HIGH: { label: "สูง", color: "high" },
  URGENT: { label: "เร่งด่วน", color: "urgent" },
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TicketIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" />
      <path d="M12 5v2m0 3v4m0 3v2" strokeDasharray="2 2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function MyTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "ไม่สามารถโหลด Ticket ได้"
          );
        }

        if (active) {
          setTickets(
            Array.isArray(data.tickets) ? data.tickets : []
          );
        }
      } catch (err) {
        console.error("LOAD TICKETS ERROR:", err);

        if (active) {
          setError(
            err.message || "ไม่สามารถโหลด Ticket ได้"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, [router]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      progress: tickets.filter(
        (t) => t.status === "IN_PROGRESS"
      ).length,
      completed: tickets.filter(
        (t) =>
          t.status === "RESOLVED" ||
          t.status === "CLOSED"
      ).length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const searchable = [
        ticket.id,
        ticket.title,
        ticket.description,
        ticket.category,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchable.includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "COMPLETED"
          ? ["RESOLVED", "CLOSED"].includes(ticket.status)
          : ticket.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  return (
    <div className="mytickets-page">
      {/* Navbar */}
      <nav className="mytickets-navbar">
        <div className="container mytickets-nav-inner">
          <Link href="/dashboard" className="mytickets-brand">
            <span className="mytickets-brand-icon">
              <TicketIcon size={20} />
            </span>
            <span>
              SmartDesk <strong>AI</strong>
            </span>
          </Link>

          <div className="mytickets-nav-actions">
            <Link
              href="/dashboard"
              className="mytickets-btn mytickets-btn-outline"
            >
              Dashboard
            </Link>

            <Link
              href="/tickets/create"
              className="mytickets-btn mytickets-btn-primary"
            >
              <span>+</span> แจ้งปัญหา
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mytickets-main">
        {/* Breadcrumb */}
        <div className="mytickets-breadcrumb">
          <Link href="/dashboard">ภาพรวม</Link>
          <span>/</span>
          <strong>Ticket ของฉัน</strong>
        </div>

        {/* Header */}
        <section className="mytickets-hero">
          <div className="mytickets-hero-content">
            <span className="mytickets-eyebrow">
              SUPPORT CENTER
            </span>

            <h1>Ticket ของฉัน</h1>

            <p>
              ติดตามสถานะและความคืบหน้าของปัญหา IT
              ที่คุณแจ้งไว้ได้ในที่เดียว
            </p>

            <Link
              href="/tickets/create"
              className="mytickets-hero-button"
            >
              + สร้าง Ticket ใหม่
              <ArrowIcon />
            </Link>
          </div>

          <div className="mytickets-hero-art" aria-hidden="true">
            <div className="mytickets-art-ring ring-one" />
            <div className="mytickets-art-ring ring-two" />
            <div className="mytickets-art-center">
              <TicketIcon size={56} />
            </div>
            <span className="mytickets-art-dot dot-one" />
            <span className="mytickets-art-dot dot-two" />
          </div>
        </section>

        {/* Summary */}
        <section className="mytickets-summary">
          <div className="mytickets-section-heading">
            <div>
              <span className="mytickets-section-label">
                OVERVIEW
              </span>
              <h2>ภาพรวมการแจ้งปัญหา</h2>
            </div>
            <p>สรุปสถานะ Ticket ทั้งหมดของคุณ</p>
          </div>

          <div className="mytickets-stats">
            {[
              {
                title: "Ticket ทั้งหมด",
                value: summary.total,
                icon: "▤",
                tone: "purple",
              },
              {
                title: "เปิดใหม่",
                value: summary.open,
                icon: "○",
                tone: "blue",
              },
              {
                title: "กำลังดำเนินการ",
                value: summary.progress,
                icon: "◷",
                tone: "orange",
              },
              {
                title: "แก้ไข / ปิดงาน",
                value: summary.completed,
                icon: "✓",
                tone: "green",
              },
            ].map((item) => (
              <div
                className="mytickets-stat-card"
                key={item.title}
              >
                <div
                  className={`mytickets-stat-icon ${item.tone}`}
                >
                  {item.icon}
                </div>

                <div className="mytickets-stat-title">
                  {item.title}
                </div>

                <div className="mytickets-stat-value">
                  {loading ? "—" : item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ticket List */}
        <section className="mytickets-list-section">
          <div className="mytickets-section-heading">
            <div>
              <span className="mytickets-section-label">
                MY REQUESTS
              </span>
              <h2>รายการแจ้งปัญหา</h2>
            </div>
            <p>ตรวจสอบและค้นหารายการของคุณ</p>
          </div>

          <div className="mytickets-panel">
            <div className="mytickets-panel-header">
              <div className="mytickets-panel-title">
                <h3>รายการ Ticket</h3>
                <span className="mytickets-count">
                  {loading ? "..." : filteredTickets.length}
                </span>
              </div>

              <div className="mytickets-filters">
                <div className="mytickets-search">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>

                  <input
                    type="search"
                    placeholder="ค้นหา Ticket..."
                    aria-label="ค้นหา Ticket"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  aria-label="กรองสถานะ Ticket"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="OPEN">เปิดใหม่</option>
                  <option value="IN_PROGRESS">
                    กำลังดำเนินการ
                  </option>
                  <option value="RESOLVED">แก้ไขแล้ว</option>
                  <option value="CLOSED">ปิดงาน</option>
                  <option value="COMPLETED">
                    แก้ไขแล้ว / ปิดงาน
                  </option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="mytickets-empty">
                <div
                  className="spinner-border"
                  role="status"
                  style={{ color: "#6d43d5" }}
                />
                <p className="mt-3">กำลังโหลด Ticket...</p>
              </div>
            ) : error ? (
              <div className="mytickets-empty">
                <div className="mytickets-empty-icon">!</div>
                <h3>ไม่สามารถโหลดข้อมูลได้</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="mytickets-btn mytickets-btn-primary"
                  onClick={() => window.location.reload()}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            ) : tickets.length === 0 ? (
              <div className="mytickets-empty">
                <div className="mytickets-empty-icon">
                  <TicketIcon size={32} />
                </div>
                <h3>ยังไม่มี Ticket</h3>
                <p>
                  เมื่อคุณแจ้งปัญหา IT รายการจะปรากฏที่นี่
                </p>
                <Link
                  href="/tickets/create"
                  className="mytickets-btn mytickets-btn-primary"
                >
                  + แจ้งปัญหา IT
                </Link>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="mytickets-empty">
                <div className="mytickets-empty-icon">⌕</div>
                <h3>ไม่พบรายการที่ค้นหา</h3>
                <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
                <button
                  type="button"
                  className="mytickets-btn mytickets-btn-outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <div className="mytickets-table-wrap">
                <table className="mytickets-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>รายละเอียดปัญหา</th>
                      <th>หมวดหมู่</th>
                      <th>ความสำคัญ</th>
                      <th>สถานะ</th>
                      <th>วันที่แจ้ง</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const status =
                        STATUS[ticket.status] || {
                          label: ticket.status,
                          color: "closed",
                        };

                      const priority =
                        PRIORITY[ticket.priority] || {
                          label: ticket.priority,
                          color: "low",
                        };

                      return (
                        <tr key={ticket.id}>
                          <td>
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="mytickets-id"
                            >
                              #{ticket.id}
                            </Link>
                          </td>

                          <td>
                            <div className="mytickets-ticket-title">
                              {ticket.title}
                            </div>
                            <div className="mytickets-ticket-desc">
                              {ticket.description?.length > 65
                                ? `${ticket.description.slice(0, 65)}...`
                                : ticket.description || "-"}
                            </div>
                          </td>

                          <td>
                            <span className="mytickets-category">
                              {ticket.category}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`mytickets-pill priority-${priority.color}`}
                            >
                              <span className="mytickets-pill-dot" />
                              {priority.label}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`mytickets-pill status-${status.color}`}
                            >
                              <span className="mytickets-pill-dot" />
                              {status.label}
                            </span>
                          </td>

                          <td className="mytickets-date">
                            {formatDate(ticket.createdAt)}
                          </td>

                          <td>
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="mytickets-view-link"
                            >
                              ดูรายละเอียด
                              <ArrowIcon />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && tickets.length > 0 && (
              <div className="mytickets-panel-footer">
                แสดง {filteredTickets.length} จาก {tickets.length} รายการ
              </div>
            )}
          </div>
        </section>

        <footer className="mytickets-footer">
          © {new Date().getFullYear()} SmartDesk AI · Thanapiphat Suwanprathep · IT Helpdesk Management System
        </footer>
      </main>
    </div>
  );
}
