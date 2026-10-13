
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const welcomeMessage = {
  role: "bot",
  text: "สวัสดีครับ 👋 ผมคือ SmartDesk IT Chatbot\n\nมีปัญหาเกี่ยวกับคอมพิวเตอร์ อินเทอร์เน็ต เครื่องพิมพ์ หรือการเข้าสู่ระบบ สามารถสอบถามได้เลยครับ",
};

const quickQuestions = [
  "อินเทอร์เน็ตใช้ไม่ได้",
  "คอมพิวเตอร์ช้า",
  "เครื่องพิมพ์ไม่ทำงาน",
  "ลืมรหัสผ่าน",
];

const knowledgeBase = [
  {
    keywords: [
      "อินเทอร์เน็ต",
      "เน็ต",
      "wifi",
      "wi-fi",
      "ไวไฟ",
      "network",
      "lan",
    ],
    answer:
      "🌐 วิธีแก้ปัญหาอินเทอร์เน็ต\n\n" +
      "1. ตรวจสอบการเชื่อมต่อ Wi-Fi หรือสาย LAN\n" +
      "2. ทดลองเปิดเว็บไซต์อื่น\n" +
      "3. ปิดและเปิด Wi-Fi ใหม่\n" +
      "4. ทดลองเชื่อมต่อจากอุปกรณ์อื่น\n" +
      "5. หากยังใช้ไม่ได้ ให้เปิด Ticket แจ้งเจ้าหน้าที่ IT",
    category: "Network",
  },
  {
    keywords: [
      "คอมช้า",
      "คอมพิวเตอร์ช้า",
      "เครื่องช้า",
      "คอมค้าง",
      "เครื่องค้าง",
      "โน้ตบุ๊กช้า",
      "โน๊ตบุ๊คช้า",
      "ช้า",
      "ค้าง",
    ],
    answer:
      "💻 วิธีแก้ปัญหาคอมพิวเตอร์ช้า\n\n" +
      "1. ปิดโปรแกรมที่ไม่ใช้งาน\n" +
      "2. เปิด Task Manager ตรวจสอบ CPU และ RAM\n" +
      "3. ตรวจสอบพื้นที่ว่างในไดรฟ์ C\n" +
      "4. รีสตาร์ตคอมพิวเตอร์\n" +
      "5. สแกนไวรัสด้วย Windows Security\n" +
      "6. หากยังช้า ให้เปิด Ticket",
    category: "Hardware",
  },
  {
    keywords: [
      "เครื่องพิมพ์",
      "ปริ้น",
      "พรินเตอร์",
      "printer",
      "พิมพ์ไม่ได้",
    ],
    answer:
      "🖨️ วิธีแก้ปัญหาเครื่องพิมพ์\n\n" +
      "1. ตรวจสอบว่าเครื่องพิมพ์เปิดอยู่\n" +
      "2. ตรวจสอบสาย USB หรือการเชื่อมต่อเครือข่าย\n" +
      "3. ตรวจสอบกระดาษและหมึก\n" +
      "4. ตรวจสอบว่าเลือกเครื่องพิมพ์ถูกเครื่อง\n" +
      "5. ตรวจสอบคิวการพิมพ์\n" +
      "6. หากยังพิมพ์ไม่ได้ ให้เปิด Ticket",
    category: "Printer",
  },
  {
    keywords: [
      "รหัสผ่าน",
      "password",
      "ล็อกอิน",
      "login",
      "เข้าสู่ระบบ",
      "เข้าระบบไม่ได้",
      "ลืมพาส",
    ],
    answer:
      "🔐 วิธีแก้ปัญหาการเข้าสู่ระบบ\n\n" +
      "1. ตรวจสอบชื่อผู้ใช้หรืออีเมล\n" +
      "2. ตรวจสอบภาษาแป้นพิมพ์และ Caps Lock\n" +
      "3. ใช้เมนูลืมรหัสผ่านของระบบ\n" +
      "4. หากบัญชีถูกล็อก ให้ติดต่อเจ้าหน้าที่ IT\n\n" +
      "⚠️ ห้ามส่งรหัสผ่านหรือ OTP ให้ผู้อื่น",
    category: "Account",
  },
  {
    keywords: [
      "จอฟ้า",
      "blue screen",
      "bsod",
      "รีสตาร์ตเอง",
    ],
    answer:
      "🛠️ วิธีตรวจสอบปัญหาจอฟ้า\n\n" +
      "1. จดหรือถ่ายภาพรหัสข้อผิดพลาด\n" +
      "2. ตรวจสอบว่าเกิดหลังติดตั้งโปรแกรมอะไร\n" +
      "3. ถอดอุปกรณ์ USB ที่ไม่จำเป็น\n" +
      "4. ตรวจสอบ Windows Update\n" +
      "5. หากเกิดซ้ำ ให้เจ้าหน้าที่ IT ตรวจสอบ",
    category: "Hardware",
  },
  {
    keywords: [
      "โปรแกรมเปิดไม่ได้",
      "แอปเปิดไม่ได้",
      "software",
      "ติดตั้งโปรแกรม",
      "โปรแกรมเด้ง",
    ],
    answer:
      "📦 วิธีแก้ปัญหาโปรแกรม\n\n" +
      "1. ปิดและเปิดโปรแกรมใหม่\n" +
      "2. รีสตาร์ตคอมพิวเตอร์\n" +
      "3. ตรวจสอบข้อความ Error\n" +
      "4. ตรวจสอบความเข้ากันได้กับ Windows\n" +
      "5. หากยังใช้งานไม่ได้ ให้เปิด Ticket",
    category: "Software",
  },
];

function findAnswer(question) {
  const text = question.toLowerCase().trim();

  const matched = knowledgeBase.find((item) =>
    item.keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    )
  );

  if (matched) {
    return {
      text: matched.answer,
      category: matched.category,
    };
  }

  return {
    text:
      "ขออภัยครับ ผมยังไม่มีคำแนะนำสำหรับปัญหานี้\n\n" +
      "คุณสามารถอธิบายปัญหาเพิ่มเติม หรือกดสร้าง Ticket เพื่อให้เจ้าหน้าที่ IT ตรวจสอบได้ครับ",
    category: "Other",
  };
}

// สร้าง URL สำหรับส่งข้อมูลไปฟอร์ม Ticket
function buildTicketUrl(messages, suggestedCategory) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  const question = lastUserMessage?.text?.trim() || "";

  const validCategories = [
    "Hardware",
    "Software",
    "Network",
    "Account",
    "Printer",
    "Other",
  ];

  const category = validCategories.includes(suggestedCategory)
    ? suggestedCategory
    : "Other";

  const params = new URLSearchParams();

  if (question) {
    params.set("title", question.slice(0, 150));

    params.set(
      "description",
      `ปัญหาที่แจ้งผ่าน SmartDesk Chatbot:\n${question}\n\nวิธีที่ได้ลองแก้ไขแล้ว:\n`
    );
  }

  params.set("category", category);

  return `/tickets/create?${params.toString()}`;
}

export default function ITChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([
    welcomeMessage,
  ]);

  const [suggestedCategory, setSuggestedCategory] =
    useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, open]);

  function sendMessage(value = input) {
    const question = value.trim();

    if (!question) return;

    const result = findAnswer(question);

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: question,
      },
      {
        role: "bot",
        text: result.text,
      },
    ]);

    setSuggestedCategory(result.category);
    setInput("");
  }

  function resetChat() {
    setMessages([welcomeMessage]);
    setSuggestedCategory(null);
    setInput("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <>
      {open && (
        <section
          className="smartdesk-chatbot-window"
          aria-label="SmartDesk IT Chatbot"
        >
          {/* Header */}
          <div className="smartdesk-chatbot-header">
            <div>
              <div className="fw-bold">
                🤖 SmartDesk Chatbot
              </div>
              <small>
                ผู้ช่วยแก้ปัญหา IT เบื้องต้น
              </small>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="smartdesk-chatbot-icon-btn"
                onClick={resetChat}
                title="เริ่มการสนทนาใหม่"
                aria-label="เริ่มการสนทนาใหม่"
              >
                ↻
              </button>

              <button
                type="button"
                className="smartdesk-chatbot-icon-btn"
                onClick={() => setOpen(false)}
                title="ปิดหน้าต่าง"
                aria-label="ปิดหน้าต่าง"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="smartdesk-chatbot-messages"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`smartdesk-chatbot-message ${
                  message.role === "user"
                    ? "smartdesk-chatbot-user"
                    : "smartdesk-chatbot-bot"
                }`}
              >
                {message.text}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          <div className="smartdesk-chatbot-quick">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Ticket Link */}
          <div className="smartdesk-chatbot-ticket">
            <div className="small text-secondary mb-2">
              ยังแก้ปัญหาไม่ได้?
              {suggestedCategory &&
                ` หมวดหมู่ที่แนะนำ: ${suggestedCategory}`}
            </div>

            <Link
              href={buildTicketUrl(
                messages,
                suggestedCategory
              )}
              className="btn btn-outline-primary btn-sm w-100"
              onClick={() => setOpen(false)}
            >
              + สร้าง Ticket แจ้งปัญหา
            </Link>
          </div>

          {/* Input */}
          <form
            className="smartdesk-chatbot-input"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="พิมพ์ปัญหาของคุณ..."
              aria-label="ข้อความถึง Chatbot"
              maxLength={500}
            />

            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="ส่งข้อความ"
            >
              ส่ง
            </button>
          </form>
        </section>
      )}

      {/* Floating Button */}
      <button
        type="button"
        className="smartdesk-chatbot-floating"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        aria-label={
          open ? "ปิด Chatbot" : "เปิด Chatbot"
        }
        aria-expanded={open}
      >
        {open ? "✕" : "🤖"}
      </button>
    </>
  );
}
