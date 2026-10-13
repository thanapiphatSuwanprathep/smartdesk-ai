
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "./dashboard.css";

const Icon = ({ name, size = 22 }) => {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z" />
        <path d="M3 3v4M1 5h4" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6V4Z" />
        <path d="M13 4v2M13 9v2M13 14v2M13 19v1" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="5" width="14" height="16" rx="2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

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
      {paths[name]}
    </svg>
  );
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!data.user) {
          router.replace("/login");
          return;
        }

        if (active) setUser(data.user);
      } catch (error) {
        console.error("CHECK LOGIN ERROR:", error);
        router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณต้องการออกจากระบบหรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#6d46d9",
    });

    if (!result.isConfirmed) return;

    try {
      setLoggingOut(true);

      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ออกจากระบบไม่สำเร็จ");
      }

      await Swal.fire({
        icon: "success",
        title: "ออกจากระบบสำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถออกจากระบบได้",
      });
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleAI() {
    await Swal.fire({
      icon: "info",
      title: "AI Assistant",
      text: "คุณสามารถใช้งานผู้ช่วย AI ผ่านปุ่มแชตที่มุมขวาล่าง",
      confirmButtonColor: "#6d46d9",
      confirmButtonText: "ตกลง",
    });
  }

  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner" />
        <p>กำลังเตรียมพื้นที่ทำงาน...</p>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name?.trim().split(/\s+/)[0] || "ผู้ใช้งาน";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="sd-dashboard">
      <header className="sd-header">
        <div className="sd-container sd-header-inner">
          <div className="sd-brand">
            <div className="sd-brand-icon">
              <Icon name="grid" size={20} />
            </div>
            <div className="sd-brand-name">
              SmartDesk <span>AI</span>
            </div>
          </div>

          <div className="sd-header-right">
            <span className="sd-header-caption">IT Helpdesk Platform</span>

            <div className="sd-header-divider" />

            <div className="sd-user">
              <div className="sd-avatar">{initial}</div>
              <div className="sd-user-info">
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
            </div>

            <button
              type="button"
              className="sd-logout"
              onClick={handleLogout}
              disabled={loggingOut}
              title="ออกจากระบบ"
            >
              <Icon name="logout" size={18} />
              <span>{loggingOut ? "กำลังออก..." : "ออกจากระบบ"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="sd-container sd-main">
        <div className="sd-breadcrumb">
          <Icon name="grid" size={15} />
          <span>ภาพรวม</span>
          <span className="sd-breadcrumb-separator">/</span>
          <strong>แดชบอร์ด</strong>
        </div>

        <section className="sd-hero">
          <div className="sd-hero-content">
            <div className="sd-eyebrow">
              <span className="sd-eyebrow-dot" />
              SMARTDESK WORKSPACE
            </div>

            <h1>สวัสดี, {firstName} <span className="sd-wave">✳</span></h1>
            <p>
              ยินดีต้อนรับสู่พื้นที่จัดการปัญหาด้าน IT
              เราพร้อมช่วยให้ทุกการทำงานของคุณราบรื่นยิ่งขึ้น
            </p>

            <button
              type="button"
              className="sd-hero-button"
              onClick={() => router.push("/tickets/create")}
            >
              <Icon name="ticket" size={18} />
              แจ้งปัญหาใหม่
              <Icon name="arrow" size={17} />
            </button>
          </div>

          <div className="sd-hero-art" aria-hidden="true">
            <div className="sd-orbit sd-orbit-one" />
            <div className="sd-orbit sd-orbit-two" />
            <div className="sd-art-center">
              <Icon name="shield" size={58} />
            </div>
            <div className="sd-art-small sd-art-small-one">
              <Icon name="check" size={22} />
            </div>
            <div className="sd-art-small sd-art-small-two">
              <Icon name="sparkles" size={22} />
            </div>
          </div>
        </section>

        <section className="sd-services">
          <div className="sd-section-heading">
            <div>
              <span className="sd-section-label">QUICK ACCESS</span>
              <h2>บริการของเรา</h2>
              <p>เลือกบริการที่ต้องการเพื่อเริ่มต้นใช้งาน</p>
            </div>
          </div>

          <div className="sd-card-grid">
            <article className="sd-service-card">
              <div className="sd-service-icon sd-icon-ai">
                <Icon name="sparkles" size={25} />
              </div>

              <span className="sd-card-number">01 / ASSISTANT</span>
              <h3>AI ช่วยแก้ปัญหา</h3>
              <p>
                ปรึกษาปัญหาด้านเทคนิคเบื้องต้น
                พร้อมรับคำแนะนำเพื่อแก้ไขปัญหาได้รวดเร็ว
              </p>

              <button
                type="button"
                className="sd-card-action"
                onClick={handleAI}
              >
                เริ่มใช้งาน AI
                <Icon name="arrow" size={18} />
              </button>
            </article>

            <article className="sd-service-card">
              <div className="sd-service-icon sd-icon-ticket">
                <Icon name="ticket" size={25} />
              </div>

              <span className="sd-card-number">02 / SUPPORT</span>
              <h3>แจ้งปัญหา IT</h3>
              <p>
                ส่งรายละเอียดปัญหาที่พบให้ทีม IT
                เพื่อดำเนินการตรวจสอบและช่วยเหลือ
              </p>

              <button
                type="button"
                className="sd-card-action"
                onClick={() => router.push("/tickets/create")}
              >
                สร้าง Ticket
                <Icon name="arrow" size={18} />
              </button>
            </article>

            <article className="sd-service-card">
              <div className="sd-service-icon sd-icon-history">
                <Icon name="clipboard" size={25} />
              </div>

              <span className="sd-card-number">03 / TRACKING</span>
              <h3>Ticket ของฉัน</h3>
              <p>
                ติดตามสถานะการดำเนินงาน
                และตรวจสอบประวัติการแจ้งปัญหาของคุณ
              </p>

              <button
                type="button"
                className="sd-card-action"
                onClick={() => router.push("/tickets")}
              >
                ดูรายการ Ticket
                <Icon name="arrow" size={18} />
              </button>
            </article>
          </div>
        </section>

        <section className="sd-info-strip">
          <div className="sd-info-icon">
            <Icon name="shield" size={22} />
          </div>
          <div className="sd-info-text">
            <strong>ศูนย์ช่วยเหลือด้าน IT</strong>
            <span>
              หากพบปัญหาในการใช้งานระบบ สามารถสร้าง Ticket
              เพื่อแจ้งให้เจ้าหน้าที่ตรวจสอบได้
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/tickets/create")}
          >
            ติดต่อฝ่าย IT
            <Icon name="arrow" size={16} />
          </button>
        </section>
      </main>

      <footer className="sd-footer">
        <div className="sd-container sd-footer-inner">
          <span>© {new Date().getFullYear()} SmartDesk AI</span>
          <span>Thanapiphat Suwanprathep</span>
        </div>
      </footer>
    </div>
  );
}
