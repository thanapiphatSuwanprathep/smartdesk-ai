
import Link from "next/link";
import "./landing.css";

const features = [
  {
    number: "01",
    icon: "✦",
    label: "AI ASSISTANT",
    title: "AI ช่วยแก้ปัญหา",
    description:
      "รับคำแนะนำและแนวทางแก้ไขปัญหาคอมพิวเตอร์หรือระบบ IT เบื้องต้นผ่านผู้ช่วยอัจฉริยะ",
  },
  {
    number: "02",
    icon: "▤",
    label: "TICKET MANAGEMENT",
    title: "ระบบแจ้งปัญหา IT",
    description:
      "แจ้งปัญหาอย่างเป็นระบบ ระบุรายละเอียด หมวดหมู่ และระดับความสำคัญ เพื่อให้เจ้าหน้าที่ตรวจสอบ",
  },
  {
    number: "03",
    icon: "◷",
    label: "STATUS TRACKING",
    title: "ติดตามสถานะได้ตลอด",
    description:
      "ตรวจสอบความคืบหน้าของ Ticket และดูประวัติการแจ้งปัญหาของคุณได้ในที่เดียว",
  },
];

const steps = [
  {
    number: "01",
    title: "เข้าสู่ระบบ",
    description: "สมัครสมาชิกหรือเข้าสู่ระบบเพื่อเริ่มใช้งาน",
  },
  {
    number: "02",
    title: "แจ้งปัญหา",
    description: "กรอกรายละเอียดปัญหาและส่ง Ticket",
  },
  {
    number: "03",
    title: "ติดตามผล",
    description: "ตรวจสอบสถานะและการดำเนินงานของเจ้าหน้าที่",
  },
];

export default function Home() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <header className="landing-header">
        <nav className="landing-nav">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">✦</span>
            <span>
              SmartDesk <strong>AI</strong>
            </span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features">บริการของเรา</a>
            <a href="#how-it-works">วิธีใช้งาน</a>
          </div>

          <div className="landing-nav-actions">
            <Link href="/login" className="landing-login">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="landing-register">
              สมัครสมาชิก
              <span>↗</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow">
                <span className="landing-online-dot" />
                SMARTDESK AI · IT HELPDESK
              </div>

              <h1>
                ทุกปัญหา IT
                <br />
                <span>จัดการได้ง่ายขึ้น</span>
                <br />
                ในที่เดียว
              </h1>

              <p className="landing-hero-description">
                SmartDesk AI ระบบช่วยเหลือและจัดการปัญหา
                IT ที่รวมการแจ้งปัญหา การติดตามสถานะ
                และผู้ช่วย AI ไว้ในแพลตฟอร์มเดียว
                เพื่อให้การทำงานของคุณสะดวกและรวดเร็วยิ่งขึ้น
              </p>

              <div className="landing-hero-actions">
                <Link
                  href="/register"
                  className="landing-primary-button"
                >
                  เริ่มต้นใช้งานฟรี
                  <span>→</span>
                </Link>

                <a
                  href="#features"
                  className="landing-secondary-button"
                >
                  สำรวจฟีเจอร์
                  <span>↓</span>
                </a>
              </div>

              <div className="landing-hero-footnote">
                <span>✓ ใช้งานผ่านเว็บเบราว์เซอร์</span>
                <span>✓ ระบบติดตาม Ticket</span>
                <span>✓ ผู้ช่วย AI</span>
              </div>
            </div>

            {/* Preview */}
            <div className="landing-preview">
              <div className="landing-preview-window">
                <div className="landing-preview-topbar">
                  <div className="landing-preview-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>SmartDesk Workspace</span>
                  <span className="landing-preview-live">
                    ● LIVE PREVIEW
                  </span>
                </div>

                <div className="landing-preview-content">
                  <div className="landing-preview-heading">
                    <div>
                      <small>OVERVIEW</small>
                      <h3>IT Helpdesk Dashboard</h3>
                      <p>ภาพรวมการจัดการปัญหา IT</p>
                    </div>
                    <div className="landing-preview-avatar">
                      SD
                    </div>
                  </div>

                  <div className="landing-preview-stats">
                    <div>
                      <small>Ticket ทั้งหมด</small>
                      <strong>24</strong>
                      <span>รายการแจ้งปัญหา</span>
                    </div>
                    <div>
                      <small>กำลังดำเนินการ</small>
                      <strong>08</strong>
                      <span>รอการแก้ไข</span>
                    </div>
                    <div>
                      <small>เสร็จสิ้น</small>
                      <strong>16</strong>
                      <span>ดำเนินการแล้ว</span>
                    </div>
                  </div>

                  <div className="landing-preview-list">
                    <div className="landing-preview-list-title">
                      <strong>Recent Tickets</strong>
                      <span>รายการล่าสุด</span>
                    </div>

                    <div className="landing-preview-item">
                      <div className="landing-preview-item-icon">
                        ▣
                      </div>
                      <div>
                        <strong>ไม่สามารถเชื่อมต่อ Wi-Fi</strong>
                        <small>Network · #TK-001</small>
                      </div>
                      <span className="landing-preview-status pending">
                        กำลังดำเนินการ
                      </span>
                    </div>

                    <div className="landing-preview-item">
                      <div className="landing-preview-item-icon">
                        ▤
                      </div>
                      <div>
                        <strong>เข้าสู่ระบบไม่ได้</strong>
                        <small>Account · #TK-002</small>
                      </div>
                      <span className="landing-preview-status done">
                        แก้ไขแล้ว
                      </span>
                    </div>

                    <div className="landing-preview-item">
                      <div className="landing-preview-item-icon">
                        ◈
                      </div>
                      <div>
                        <strong>เครื่องพิมพ์ไม่ตอบสนอง</strong>
                        <small>Printer · #TK-003</small>
                      </div>
                      <span className="landing-preview-status new">
                        เปิดใหม่
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-floating-label">
                <span>✦</span>
                <div>
                  <strong>Smart Support</strong>
                  <small>Help is always close</small>
                </div>
              </div>

              <div className="landing-preview-note">
                * ตัวอย่างหน้าจอเพื่อแนะนำระบบ
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-features">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-tag">
                OUR FEATURES
              </span>

              <h2>
                เครื่องมือที่ช่วยให้
                <br />
                <span>การแก้ปัญหา IT ง่ายกว่าเดิม</span>
              </h2>

              <p>
                รวมฟังก์ชันที่จำเป็นสำหรับการแจ้งปัญหา
                และการให้บริการ IT Support
              </p>
            </div>

            <div className="landing-feature-grid">
              {features.map((feature) => (
                <article
                  key={feature.number}
                  className="landing-feature-card"
                >
                  <div className="landing-feature-top">
                    <span className="landing-feature-icon">
                      {feature.icon}
                    </span>
                    <span className="landing-feature-number">
                      {feature.number} / 03
                    </span>
                  </div>

                  <span className="landing-feature-label">
                    {feature.label}
                  </span>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>

                  <div className="landing-feature-bottom">
                    <span>SmartDesk AI</span>
                    <span>↗</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="landing-how"
        >
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-tag">
                HOW IT WORKS
              </span>

              <h2>
                เริ่มต้นใช้งาน
                <span> เพียง 3 ขั้นตอน</span>
              </h2>

              <p>
                ไม่ต้องมีขั้นตอนซับซ้อน
                ก็สามารถแจ้งปัญหาและติดตามผลได้
              </p>
            </div>

            <div className="landing-steps">
              {steps.map((step) => (
                <div
                  className="landing-step"
                  key={step.number}
                >
                  <div className="landing-step-number">
                    {step.number}
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="landing-cta-section">
          <div className="landing-container">
            <div className="landing-cta">
              <div>
                <span>READY TO GET STARTED?</span>
                <h2>พร้อมเริ่มต้นใช้งานแล้วหรือยัง?</h2>
                <p>
                  เริ่มจัดการปัญหา IT ของคุณด้วย SmartDesk AI
                  ได้เลยวันนี้
                </p>
              </div>

              <Link
                href="/register"
                className="landing-cta-button"
              >
                สมัครสมาชิก
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-footer-logo">✦</span>
            <strong>SmartDesk AI</strong>
            <span>IT Helpdesk Platform</span>
          </div>

          <p>
            © {new Date().getFullYear()} SmartDesk AI.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
