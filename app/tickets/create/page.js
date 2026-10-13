
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "./create-ticket.css";

const VALID_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Account",
  "Printer",
  "Other",
];

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const CATEGORY_OPTIONS = [
  { value: "Hardware", label: "Hardware - อุปกรณ์คอมพิวเตอร์" },
  { value: "Software", label: "Software - โปรแกรมและระบบ" },
  { value: "Network", label: "Network - เครือข่าย / อินเทอร์เน็ต" },
  { value: "Account", label: "Account - บัญชีผู้ใช้ / Login" },
  { value: "Printer", label: "Printer - เครื่องพิมพ์" },
  { value: "Other", label: "Other - อื่น ๆ" },
];

function TicketIcon({ name, size = 20 }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    arrowLeft: <path d="m12 19-7-7 7-7M5 12h14" />,
    arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
    ticket: (
      <>
        <path d="M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6V4Z" />
        <path d="M13 4v2M13 9v2M13 14v2M13 19v1" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="M4 17v4M2 19h4" />
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
}

function TicketLoading({ message = "กำลังโหลด..." }) {
  return (
    <div className="ct-loading">
      <div className="ct-spinner" role="status" />
      <p>{message}</p>
    </div>
  );
}

function CreateTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // รับข้อมูลจาก Chatbot
  const chatbotTitle = searchParams.get("title");
  const chatbotCategory = searchParams.get("category");
  const chatbotDescription = searchParams.get("description");

  const fromChatbot =
    chatbotTitle !== null ||
    chatbotCategory !== null ||
    chatbotDescription !== null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState(
    () => (chatbotTitle || "").slice(0, 150)
  );

  const [category, setCategory] = useState(
    () =>
      VALID_CATEGORIES.includes(chatbotCategory)
        ? chatbotCategory
        : ""
  );

  const [priority, setPriority] = useState("MEDIUM");

  const [description, setDescription] = useState(
    () => (chatbotDescription || "").slice(0, 3000)
  );

  const [submitting, setSubmitting] = useState(false);

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
          if (active) router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!data.user) {
          if (active) router.replace("/login");
          return;
        }

        if (active) setUser(data.user);
      } catch (error) {
        console.error("CHECK LOGIN ERROR:", error);
        if (active) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    if (
      !title.trim() ||
      !category ||
      !priority ||
      !description.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูล Ticket ให้ครบ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#6843cf",
      });
      return;
    }

    if (
      !VALID_CATEGORIES.includes(category) ||
      !VALID_PRIORITIES.includes(priority)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ถูกต้อง",
        text: "กรุณาตรวจสอบหมวดหมู่และระดับความสำคัญ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#6843cf",
      });
      return;
    }

    if (
      title.trim().length > 150 ||
      description.trim().length > 3000
    ) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลยาวเกินกำหนด",
        text: "กรุณาตรวจสอบความยาวของหัวข้อและรายละเอียด",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#6843cf",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "สร้าง Ticket ไม่สำเร็จ",
          text:
            data.message ||
            "เกิดข้อผิดพลาดในการสร้าง Ticket",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#6843cf",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "สร้าง Ticket สำเร็จ",
        text: `Ticket #${data.ticket.id} ถูกบันทึกเข้าสู่ระบบแล้ว`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#6843cf",
      });

      router.push("/tickets");
      router.refresh();
    } catch (error) {
      console.error("CREATE TICKET ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้าง Ticket ได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#6843cf",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <TicketLoading />;
  if (!user) return null;

  const firstName = user.name?.trim().split(/\s+/)[0] || "ผู้ใช้";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="ct-page">
      {/* Navbar */}
      <header className="ct-header">
        <div className="ct-container ct-header-inner">
          <Link href="/dashboard" className="ct-brand">
            <span className="ct-brand-icon">
              <TicketIcon name="grid" size={20} />
            </span>
            <span className="ct-brand-name">
              SmartDesk <strong>AI</strong>
            </span>
          </Link>

          <div className="ct-header-right">
            <span className="ct-header-caption">
              IT Helpdesk Platform
            </span>
            <span className="ct-header-divider" />

            <div className="ct-user">
              <span className="ct-avatar">{initial}</span>
              <span className="ct-user-details">
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="ct-container ct-main">
        {/* Breadcrumb */}
        <div className="ct-breadcrumb">
          <Link href="/dashboard">ภาพรวม</Link>
          <span>/</span>
          <Link href="/tickets">Ticket</Link>
          <span>/</span>
          <strong>แจ้งปัญหาใหม่</strong>
        </div>

        <div className="ct-content-grid">
          {/* Main Form */}
          <div className="ct-form-column">
            <div className="ct-page-heading">
              <Link href="/dashboard" className="ct-back-link">
                <TicketIcon name="arrowLeft" size={16} />
                กลับไป Dashboard
              </Link>

              <div className="ct-heading-label">
                SUPPORT REQUEST
              </div>

              <h1>แจ้งปัญหา IT</h1>
              <p>
                แจ้งรายละเอียดปัญหาที่พบ
                เพื่อให้ทีม IT สามารถตรวจสอบและช่วยเหลือคุณได้
              </p>
            </div>

            <div className="ct-form-card">
              <div className="ct-card-header">
                <div className="ct-card-icon">
                  <TicketIcon name="ticket" size={23} />
                </div>

                <div>
                  <h2>รายละเอียดการแจ้งปัญหา</h2>
                  <p>กรอกข้อมูลให้ครบถ้วนก่อนส่งคำร้อง</p>
                </div>

                <span className="ct-card-step">01 / 01</span>
              </div>

              {fromChatbot && (
                <div className="ct-chatbot-notice" role="status">
                  <span className="ct-notice-icon">
                    <TicketIcon name="sparkles" size={21} />
                  </span>
                  <div>
                    <strong>รับข้อมูลจาก SmartDesk Chatbot แล้ว</strong>
                    <p>
                      ระบบกรอกข้อมูลเบื้องต้นให้แล้ว
                      กรุณาตรวจสอบและแก้ไขก่อนส่ง Ticket
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="ct-form">
                <div className="ct-field">
                  <div className="ct-label-row">
                    <label htmlFor="ticketTitle">
                      หัวข้อปัญหา <span>*</span>
                    </label>
                    <small>{title.length}/150</small>
                  </div>

                  <input
                    id="ticketTitle"
                    type="text"
                    className="ct-input"
                    placeholder="เช่น อินเทอร์เน็ตใช้งานไม่ได้"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    maxLength={150}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="ct-field-row">
                  <div className="ct-field">
                    <label htmlFor="ticketCategory">
                      หมวดหมู่ <span>*</span>
                    </label>

                    <select
                      id="ticketCategory"
                      className="ct-input ct-select"
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value)
                      }
                      disabled={submitting}
                      required
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ct-field">
                    <label htmlFor="ticketPriority">
                      ระดับความสำคัญ <span>*</span>
                    </label>

                    <select
                      id="ticketPriority"
                      className="ct-input ct-select"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value)
                      }
                      disabled={submitting}
                      required
                    >
                      <option value="LOW">ต่ำ</option>
                      <option value="MEDIUM">ปานกลาง</option>
                      <option value="HIGH">สูง</option>
                      <option value="URGENT">ด่วนมาก</option>
                    </select>
                  </div>
                </div>

                <div className="ct-field">
                  <div className="ct-label-row">
                    <label htmlFor="ticketDescription">
                      รายละเอียดปัญหา <span>*</span>
                    </label>
                    <small>{description.length}/3000</small>
                  </div>

                  <textarea
                    id="ticketDescription"
                    className="ct-input ct-textarea"
                    rows={7}
                    placeholder="อธิบายอาการ ปัญหาที่พบ หรือข้อความ Error ที่ปรากฏ..."
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    maxLength={3000}
                    disabled={submitting}
                    required
                  />

                  <p className="ct-field-hint">
                    ระบุอาการที่พบและสิ่งที่ลองแก้ไขแล้ว
                    เพื่อให้เจ้าหน้าที่ตรวจสอบได้รวดเร็วขึ้น
                  </p>
                </div>

                <div className="ct-form-footer">
                  <span className="ct-required-note">
                    <span>*</span> จำเป็นต้องกรอก
                  </span>

                  <div className="ct-form-actions">
                    <Link
                      href="/dashboard"
                      className={`ct-cancel-button ${
                        submitting ? "ct-disabled" : ""
                      }`}
                      aria-disabled={submitting}
                      onClick={(event) => {
                        if (submitting) event.preventDefault();
                      }}
                    >
                      ยกเลิก
                    </Link>

                    <button
                      type="submit"
                      className="ct-submit-button"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="ct-button-spinner" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          ส่ง Ticket
                          <TicketIcon name="arrowRight" size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="ct-sidebar">
            <div className="ct-side-card">
              <div className="ct-side-icon">
                <TicketIcon name="info" size={22} />
              </div>
              <h3>คำแนะนำก่อนแจ้งปัญหา</h3>
              <p>
                เพื่อให้เจ้าหน้าที่ IT สามารถช่วยเหลือได้รวดเร็ว
                แนะนำให้ระบุข้อมูลดังนี้
              </p>

              <div className="ct-tip">
                <span>01</span>
                <div>
                  <strong>อธิบายปัญหาให้ชัดเจน</strong>
                  <p>ระบุอาการหรือข้อความแจ้งเตือนที่พบ</p>
                </div>
              </div>

              <div className="ct-tip">
                <span>02</span>
                <div>
                  <strong>เลือกหมวดหมู่ให้ตรง</strong>
                  <p>ช่วยให้ทีม IT จัดการปัญหาได้เหมาะสม</p>
                </div>
              </div>

              <div className="ct-tip">
                <span>03</span>
                <div>
                  <strong>ระบุสิ่งที่ลองแก้ไข</strong>
                  <p>ช่วยลดขั้นตอนการตรวจสอบเบื้องต้น</p>
                </div>
              </div>
            </div>

            <div className="ct-help-card">
              <div className="ct-help-icon">
                <TicketIcon name="shield" size={23} />
              </div>
              <h3>ติดตามสถานะได้ตลอด</h3>
              <p>
                หลังจากส่ง Ticket แล้ว
                คุณสามารถติดตามสถานะและประวัติการแจ้งปัญหาได้
              </p>

              <Link href="/tickets">
                ดู Ticket ของฉัน
                <TicketIcon name="arrowRight" size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="ct-footer">
        <div className="ct-container ct-footer-inner">
          <span>© {new Date().getFullYear()} SmartDesk AI</span>
          <span>Thanapiphat Suwanprathep</span>
        </div>
      </footer>
    </div>
  );
}

export default function CreateTicketPage() {
  return (
    <Suspense
      fallback={
        <TicketLoading message="กำลังเปิดหน้าสร้าง Ticket..." />
      }
    >
      <CreateTicketForm />
    </Suspense>
  );
}
