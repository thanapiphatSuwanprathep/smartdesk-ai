
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "./dashboard.css";

const icons = {
  dashboard: "▦",
  ticket: "▤",
  progress: "◷",
  resolved: "✓",
  closed: "▣",
  arrow: "↗",
};

export default function ITDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (meResponse.status === 401) {
          router.replace("/login");
          return;
        }

        if (!meResponse.ok) {
          throw new Error("ไม่สามารถตรวจสอบบัญชีผู้ใช้ได้");
        }

        const meData = await meResponse.json();

        if (meData.user?.role !== "IT") {
          router.replace("/dashboard");
          return;
        }

        if (active) setUser(meData.user);

        const response = await fetch("/api/it/tickets", {
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

        if (active) setTickets(data.tickets || []);
      } catch (err) {
        console.error("IT DASHBOARD ERROR:", err);
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันการออกจากระบบ",
      text: "คุณต้องการออกจากระบบ SmartDesk AI หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("ออกจากระบบไม่สำเร็จ");
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
      });
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="it-loading-screen">
        <div className="it-loading-spinner" />
        <h3>SmartDesk AI</h3>
        <p>กำลังเตรียมข้อมูล IT Dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const count = (status) =>
    tickets.filter((ticket) => ticket.status === status).length;

  const total = tickets.length;
  const inProgress = count("IN_PROGRESS");
  const resolved = count("RESOLVED");
  const closed = count("CLOSED");
  const other = Math.max(0, total - inProgress - resolved - closed);

  const cards = [
    {
      title: "Ticket ทั้งหมด",
      value: total,
      icon: icons.ticket,
      tone: "blue",
      href: "/it/tickets",
      description: "คำร้องทั้งหมดในระบบ",
      label: "TOTAL TICKETS",
    },
    {
      title: "กำลังดำเนินการ",
      value: inProgress,
      icon: icons.progress,
      tone: "cyan",
      href: "/it/tickets?status=IN_PROGRESS",
      description: "งานที่อยู่ระหว่างแก้ไข",
      label: "IN PROGRESS",
    },
    {
      title: "แก้ไขแล้ว",
      value: resolved,
      icon: icons.resolved,
      tone: "teal",
      href: "/it/tickets?status=RESOLVED",
      description: "รอผู้แจ้งยืนยันผล",
      label: "RESOLVED",
    },
    {
      title: "ปิดงานแล้ว",
      value: closed,
      icon: icons.closed,
      tone: "slate",
      href: "/it/tickets?status=CLOSED",
      description: "งานที่ดำเนินการเสร็จสิ้น",
      label: "CLOSED",
    },
  ];

  const breakdown = [
    {
      name: "กำลังดำเนินการ",
      value: inProgress,
      tone: "cyan",
    },
    {
      name: "แก้ไขแล้ว",
      value: resolved,
      tone: "teal",
    },
    {
      name: "ปิดงานแล้ว",
      value: closed,
      tone: "slate",
    },
    {
      name: "สถานะอื่น ๆ",
      value: other,
      tone: "blue",
    },
  ];

  const recentTickets = [...tickets]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const statusLabels = {
    OPEN: "เปิดคำร้อง",
    PENDING: "รอดำเนินการ",
    IN_PROGRESS: "กำลังดำเนินการ",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดงานแล้ว",
  };

  const statusTones = {
    OPEN: "blue",
    PENDING: "blue",
    IN_PROGRESS: "cyan",
    RESOLVED: "teal",
    CLOSED: "slate",
  };

  return (
    <div className="it-dashboard">
      {/* HEADER */}
      <header className="it-topbar">
        <div className="it-topbar-inner">
          <Link href="/it/dashboard" className="it-brand">
            <span className="it-brand-icon">S</span>
            <span className="it-brand-text">
              <strong>SmartDesk AI</strong>
              <small>IT SERVICE MANAGEMENT</small>
            </span>
          </Link>

          <nav className="it-navigation">
            <Link href="/it/dashboard" className="it-nav-link active">
              {icons.dashboard} Dashboard
            </Link>
            <Link href="/it/tickets" className="it-nav-link">
              {icons.ticket} จัดการ Ticket
            </Link>
          </nav>

          <div className="it-account">
            <div className="it-avatar">
              {(user.name || "IT").charAt(0).toUpperCase()}
            </div>
            <div className="it-account-info">
              <strong>{user.name}</strong>
              <small>IT Support</small>
            </div>
            <button
              className="it-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
            </button>
          </div>
        </div>
      </header>

      <main className="it-main">
        {/* PAGE HEADING */}
        <div className="it-page-heading">
          <div>
            <div className="it-breadcrumb">
              Workspace <span>/</span> IT Support <span>/</span> Dashboard
            </div>
            <h1>IT Support Dashboard</h1>
            <p>ภาพรวมการให้บริการและติดตามสถานะคำร้อง IT</p>
          </div>

          <span className="it-role-tag">
            <span className="it-online-dot" />
            IT Support Workspace
          </span>
        </div>

        {error && (
          <div className="it-error">
            <strong>ไม่สามารถโหลดข้อมูลได้</strong>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* HERO */}
        <section className="it-hero">
          <div className="it-hero-content">
            <span className="it-hero-eyebrow">
              SMARTDESK AI · SERVICE OPERATIONS
            </span>
            <h2>ยินดีต้อนรับ, {user.name}</h2>
            <p>
              จัดการคำร้องแจ้งปัญหา ติดตามงานที่กำลังดำเนินการ
              และประสานงานกับผู้ใช้งานได้จากศูนย์กลางเดียว
            </p>

            <div className="it-hero-actions">
              <Link href="/it/tickets" className="it-primary-action">
                จัดการ Ticket ทั้งหมด <span>↗</span>
              </Link>
              <span className="it-hero-status">
                <span className="it-online-dot" />
                พร้อมให้บริการ
              </span>
            </div>
          </div>

          <div className="it-hero-visual" aria-hidden="true">
            <div className="it-visual-circle outer" />
            <div className="it-visual-circle inner" />
            <div className="it-visual-center">
              <span>IT</span>
              <small>SUPPORT</small>
            </div>
            <div className="it-visual-chip chip-one">● SYSTEM ONLINE</div>
            <div className="it-visual-chip chip-two">✓ SERVICE DESK</div>
          </div>
        </section>

        {/* METRICS */}
        <div className="it-section-heading">
          <div>
            <h3>ภาพรวมคำร้อง</h3>
            <p>สถิติ Ticket ตามสถานะปัจจุบัน</p>
          </div>
          <span className="it-section-caption">OVERVIEW</span>
        </div>

        <section className="it-stats-grid">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`it-stat-card tone-${card.tone}`}
            >
              <div className="it-stat-top">
                <span className="it-stat-icon">{card.icon}</span>
                <span className="it-stat-arrow">↗</span>
              </div>

              <span className="it-stat-label">{card.label}</span>
              <div className="it-stat-value">{card.value}</div>
              <strong className="it-stat-title">{card.title}</strong>
              <p>{card.description}</p>

              <div className="it-stat-bottom">
                <span>ดูรายละเอียด</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </section>

        {/* ANALYTICS */}
        <section className="it-analytics-grid">
          <div className="it-panel">
            <div className="it-panel-header">
              <div>
                <h3>ภาพรวมสถานะงาน</h3>
                <p>สัดส่วนคำร้องในแต่ละสถานะ</p>
              </div>
              <span className="it-panel-tag">LIVE DATA</span>
            </div>

            <div className="it-distribution-summary">
              <div>
                <span>คำร้องทั้งหมด</span>
                <strong>{total}</strong>
              </div>
              <span>100% ของรายการที่โหลด</span>
            </div>

            <div className="it-distribution-bar">
              {total > 0 ? (
                breakdown
                  .filter((item) => item.value > 0)
                  .map((item) => (
                    <div
                      key={item.name}
                      className={`it-distribution-segment tone-${item.tone}`}
                      style={{
                        width: `${(item.value / total) * 100}%`,
                      }}
                      title={`${item.name}: ${item.value}`}
                    />
                  ))
              ) : (
                <div className="it-distribution-empty" />
              )}
            </div>

            <div className="it-legend">
              {breakdown.map((item) => (
                <div className="it-legend-row" key={item.name}>
                  <div className="it-legend-name">
                    <span className={`it-legend-dot tone-${item.tone}`} />
                    {item.name}
                  </div>
                  <div className="it-legend-value">
                    <strong>{item.value}</strong>
                    <span>
                      {total
                        ? `${Math.round((item.value / total) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="it-panel it-quick-panel">
            <div className="it-panel-header">
              <div>
                <h3>Quick Actions</h3>
                <p>เข้าถึงงานที่ต้องดำเนินการได้ทันที</p>
              </div>
            </div>

            <Link href="/it/tickets" className="it-quick-action">
              <span className="it-quick-icon blue">▤</span>
              <span>
                <strong>รายการ Ticket ทั้งหมด</strong>
                <small>ดูและจัดการคำร้องในระบบ</small>
              </span>
              <span className="it-quick-arrow">↗</span>
            </Link>

            <Link
              href="/it/tickets?status=IN_PROGRESS"
              className="it-quick-action"
            >
              <span className="it-quick-icon cyan">◷</span>
              <span>
                <strong>งานที่กำลังดำเนินการ</strong>
                <small>ติดตามงานที่อยู่ระหว่างแก้ไข</small>
              </span>
              <span className="it-quick-arrow">↗</span>
            </Link>

            <Link
              href="/it/tickets?status=RESOLVED"
              className="it-quick-action"
            >
              <span className="it-quick-icon teal">✓</span>
              <span>
                <strong>งานที่แก้ไขแล้ว</strong>
                <small>ตรวจสอบคำร้องที่รอยืนยันผล</small>
              </span>
              <span className="it-quick-arrow">↗</span>
            </Link>

            <div className="it-quick-footer">
              <span className="it-online-dot" />
              เชื่อมต่อระบบ SmartDesk AI
            </div>
          </div>
        </section>

        {/* RECENT TICKETS */}
        <section className="it-panel it-recent-panel">
          <div className="it-panel-header">
            <div>
              <h3>Ticket ล่าสุด</h3>
              <p>รายการคำร้องล่าสุดจากระบบ</p>
            </div>
            <Link href="/it/tickets" className="it-view-all">
              ดูทั้งหมด →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="it-empty-state">
              <div>▤</div>
              <strong>ยังไม่มีรายการ Ticket</strong>
              <p>คำร้องที่มีในระบบจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="it-table-scroll">
              <table className="it-ticket-table">
                <thead>
                  <tr>
                    <th>หมายเลข</th>
                    <th>หัวข้อปัญหา</th>
                    <th>สถานะ</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket, index) => (
                    <tr key={ticket.id ?? index}>
                      <td>
                        <span className="it-ticket-id">
                          #{ticket.id ?? "-"}
                        </span>
                      </td>
                      <td className="it-ticket-title">
                        {ticket.title || "ไม่ระบุหัวข้อ"}
                      </td>
                      <td>
                        <span
                          className={`it-ticket-status tone-${
                            statusTones[ticket.status] || "blue"
                          }`}
                        >
                          {statusLabels[ticket.status] ||
                            ticket.status ||
                            "ไม่ระบุ"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href="/it/tickets"
                          className="it-table-link"
                        >
                          ดูรายการ ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* WORKFLOW */}
        <section className="it-panel it-workflow-panel">
          <div className="it-panel-header">
            <div>
              <h3>กระบวนการให้บริการ IT</h3>
              <p>IT Service Workflow</p>
            </div>
            <span className="it-panel-tag">3 STEPS</span>
          </div>

          <div className="it-workflow-grid">
            {[
              {
                number: "01",
                title: "ตรวจสอบ Ticket",
                description:
                  "ตรวจสอบรายละเอียดปัญหาและคำร้องที่ได้รับมอบหมาย",
              },
              {
                number: "02",
                title: "ดำเนินการแก้ไข",
                description:
                  "ประสานงานกับผู้แจ้งและดำเนินการแก้ไขปัญหา",
              },
              {
                number: "03",
                title: "แจ้งผลการแก้ไข",
                description:
                  "อัปเดตสถานะและแจ้งผู้ใช้งานเพื่อยืนยันผล",
              },
            ].map((step) => (
              <div className="it-workflow-step" key={step.number}>
                <span className="it-step-number">{step.number}</span>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="it-footer">
          <span>© SmartDesk AI · Thanapiphat Suwanprathep</span>
          <span>IT Support Dashboard</span>
        </footer>
      </main>
    </div>
  );
}
