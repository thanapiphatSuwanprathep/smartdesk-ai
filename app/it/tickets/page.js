
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "./tickets.css";

const statusConfig = {
  OPEN: { label: "เปิดใหม่", tone: "open" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", tone: "progress" },
  RESOLVED: { label: "แก้ไขแล้ว", tone: "resolved" },
  CLOSED: { label: "ปิดงานแล้ว", tone: "closed" },
};

const priorityConfig = {
  LOW: { label: "ต่ำ", tone: "low" },
  MEDIUM: { label: "ปานกลาง", tone: "medium" },
  HIGH: { label: "สูง", tone: "high" },
  URGENT: { label: "เร่งด่วน", tone: "urgent" },
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

function ITTicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      try {
        const response = await fetch("/api/it/tickets", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          router.replace("/dashboard");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "โหลด Ticket ไม่สำเร็จ");
        }

        if (active) {
          setTickets(data.tickets || []);
          setError("");
        }
      } catch (err) {
        console.error("LOAD IT TICKETS ERROR:", err);

        if (active) {
          setError(err.message || "ไม่สามารถโหลด Ticket ได้");
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

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchSearch =
        !keyword ||
        String(ticket.id).includes(keyword) ||
        String(ticket.title || "").toLowerCase().includes(keyword) ||
        String(ticket.reporterName || "").toLowerCase().includes(keyword);

      const matchStatus =
        !statusFilter || ticket.status === statusFilter;

      const matchPriority =
        !priorityFilter || ticket.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  function handleStatusChange(event) {
    const value = event.target.value;

    router.replace(
      value
        ? `/it/tickets?status=${encodeURIComponent(value)}`
        : "/it/tickets",
      { scroll: false }
    );
  }

  function handleClearFilters() {
    setSearch("");
    setPriorityFilter("");
    router.replace("/it/tickets", { scroll: false });
  }

  const summaryCards = [
    {
      label: "Ticket ทั้งหมด",
      value: stats.total,
      icon: "▤",
      tone: "total",
      href: "/it/tickets",
      caption: "รายการทั้งหมดในระบบ",
    },
    {
      label: "เปิดใหม่",
      value: stats.open,
      icon: "◉",
      tone: "open",
      href: "/it/tickets?status=OPEN",
      caption: "รอการตรวจสอบ",
    },
    {
      label: "กำลังดำเนินการ",
      value: stats.progress,
      icon: "◷",
      tone: "progress",
      href: "/it/tickets?status=IN_PROGRESS",
      caption: "อยู่ระหว่างการแก้ไข",
    },
    {
      label: "แก้ไขแล้ว",
      value: stats.resolved,
      icon: "✓",
      tone: "resolved",
      href: "/it/tickets?status=RESOLVED",
      caption: "รอผู้แจ้งยืนยัน",
    },
  ];

  return (
    <div className="it-tickets-page">
      <nav className="it-tickets-nav">
        <div className="container it-tickets-nav-inner">
          <Link href="/it/dashboard" className="it-tickets-brand">
            <span className="it-tickets-brand-mark">S</span>
            <span>
              SmartDesk <strong>AI</strong>
              <small>IT SERVICE MANAGEMENT</small>
            </span>
          </Link>

          <div className="it-tickets-nav-links">
            <Link href="/it/dashboard" className="it-tickets-nav-link">
              Dashboard
            </Link>
            <Link
              href="/it/tickets"
              className="it-tickets-nav-link active"
            >
              จัดการ Ticket
            </Link>
            <span className="it-tickets-role">IT SUPPORT</span>
          </div>
        </div>
      </nav>

      <main className="container it-tickets-main">
        <div className="it-tickets-hero">
          <div className="it-tickets-hero-content">
            <div className="it-tickets-eyebrow">
              SERVICE DESK / TICKET MANAGEMENT
            </div>

            <h1>จัดการ Ticket</h1>

            <p>
              ศูนย์กลางการตรวจสอบ ติดตาม และบริหารจัดการ
              คำร้องแจ้งปัญหาด้าน IT
            </p>

            <div className="it-tickets-hero-meta">
              <span className="it-tickets-live-dot" />
              IT Support Workspace
            </div>
          </div>

          <div className="it-tickets-hero-art" aria-hidden="true">
            <span>SD</span>
          </div>
        </div>

        {loading ? (
          <div className="it-tickets-loading">
            <div className="spinner-border text-primary" role="status" />
            <p>กำลังโหลดข้อมูล Ticket...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mt-4" role="alert">
            {error}
          </div>
        ) : (
          <>
            <section className="it-tickets-stats" aria-label="ภาพรวม Ticket">
              {summaryCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`it-tickets-stat it-tickets-stat-${card.tone}`}
                >
                  <div className="it-tickets-stat-top">
                    <span className="it-tickets-stat-label">
                      {card.label}
                    </span>
                    <span className="it-tickets-stat-icon">
                      {card.icon}
                    </span>
                  </div>

                  <div className="it-tickets-stat-value">
                    {card.value}
                  </div>

                  <div className="it-tickets-stat-bottom">
                    <span>{card.caption}</span>
                    <span>↗</span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="it-tickets-panel it-tickets-filter-panel">
              <div className="it-tickets-panel-heading">
                <div>
                  <h2>ค้นหาและกรองข้อมูล</h2>
                  <p>ค้นหารายการ Ticket ตามเงื่อนไขที่ต้องการ</p>
                </div>
                <span className="it-tickets-panel-label">
                  FILTER OPTIONS
                </span>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-lg-5">
                  <label htmlFor="ticketSearch" className="form-label">
                    ค้นหา Ticket
                  </label>
                  <div className="it-tickets-search-wrap">
                    <span aria-hidden="true">⌕</span>
                    <input
                      id="ticketSearch"
                      type="search"
                      className="form-control"
                      placeholder="ค้นหา ID, หัวข้อ หรือชื่อผู้แจ้ง..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-4 col-lg-3">
                  <label htmlFor="ticketStatus" className="form-label">
                    สถานะ
                  </label>
                  <select
                    id="ticketStatus"
                    className="form-select"
                    value={statusFilter}
                    onChange={handleStatusChange}
                  >
                    <option value="">ทุกสถานะ</option>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4 col-lg-3">
                  <label htmlFor="ticketPriority" className="form-label">
                    ความสำคัญ
                  </label>
                  <select
                    id="ticketPriority"
                    className="form-select"
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(event.target.value)
                    }
                  >
                    <option value="">ทุกระดับ</option>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4 col-lg-1">
                  <button
                    type="button"
                    className="it-tickets-clear-btn"
                    onClick={handleClearFilters}
                  >
                    ล้าง
                  </button>
                </div>
              </div>
            </section>

            <section className="it-tickets-panel it-tickets-table-panel">
              <div className="it-tickets-table-heading">
                <div>
                  <h2>รายการ Ticket</h2>
                  <p>
                    พบ <strong>{filteredTickets.length}</strong> จาก{" "}
                    {tickets.length} รายการ
                  </p>
                </div>

                <span className="it-tickets-count">
                  {filteredTickets.length} รายการ
                </span>
              </div>

              <div className="table-responsive">
                <table className="table it-tickets-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>รายละเอียดปัญหา</th>
                      <th>ผู้แจ้ง</th>
                      <th>ผู้รับงาน</th>
                      <th>หมวดหมู่</th>
                      <th>ความสำคัญ</th>
                      <th>สถานะ</th>
                      <th>วันที่แจ้ง</th>
                      <th className="text-end">จัดการ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="it-tickets-empty">
                            <div className="it-tickets-empty-icon">⌕</div>
                            <h3>ไม่พบรายการ Ticket</h3>
                            <p>
                              ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                            </p>
                            <button
                              type="button"
                              onClick={handleClearFilters}
                            >
                              ล้างตัวกรองทั้งหมด
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const status =
                          statusConfig[ticket.status] || {
                            label: ticket.status || "-",
                            tone: "closed",
                          };

                        const priority =
                          priorityConfig[ticket.priority] || {
                            label: ticket.priority || "-",
                            tone: "low",
                          };

                        return (
                          <tr key={ticket.id}>
                            <td>
                              <span className="it-tickets-id">
                                #{ticket.id}
                              </span>
                            </td>

                            <td className="it-tickets-title-cell">
                              <div className="it-tickets-title">
                                {ticket.title}
                              </div>
                              <div className="it-tickets-description">
                                {String(ticket.description || "").slice(
                                  0,
                                  65
                                )}
                              </div>
                            </td>

                            <td>
                              <span className="it-tickets-person">
                                {ticket.reporterName ||
                                  `User #${ticket.userId}`}
                              </span>
                            </td>

                            <td>
                              <span
                                className={
                                  ticket.assigneeName
                                    ? "it-tickets-person"
                                    : "it-tickets-unassigned"
                                }
                              >
                                {ticket.assigneeName || "ยังไม่มอบหมาย"}
                              </span>
                            </td>

                            <td>
                              <span className="it-tickets-category">
                                {ticket.category || "-"}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`it-tickets-badge priority-${priority.tone}`}
                              >
                                {priority.label}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`it-tickets-badge status-${status.tone}`}
                              >
                                <span className="it-tickets-badge-dot" />
                                {status.label}
                              </span>
                            </td>

                            <td className="it-tickets-date">
                              {formatDate(ticket.createdAt)}
                            </td>

                            <td className="text-end">
                              <Link
                                href={`/it/tickets/${ticket.id}`}
                                className="it-tickets-detail-btn"
                              >
                                รายละเอียด <span>↗</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="it-tickets-table-footer">
                <span>
                  แสดง {filteredTickets.length} จาก {tickets.length} Ticket
                </span>
                <span>SmartDesk AI · IT Support</span>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function ITTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="it-tickets-loading">
          <div className="spinner-border text-primary" role="status" />
          <p>กำลังโหลด...</p>
        </div>
      }
    >
      <ITTicketsContent />
    </Suspense>
  );
}
