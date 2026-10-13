"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();

  // =====================================================
  // Ticket
  // =====================================================
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // Chat
  // =====================================================
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // =====================================================
  // โหลดรายละเอียด Ticket
  // =====================================================
  useEffect(() => {
    if (!params.id) {
      return;
    }

    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/tickets/${params.id}`, {
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
          throw new Error(data.message || "ไม่สามารถโหลด Ticket ได้");
        }

        setTicket(data.ticket);
      } catch (error) {
        console.error("LOAD TICKET DETAIL ERROR:", error);

        setError(error.message || "ไม่สามารถโหลด Ticket ได้");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [params.id, router]);

  // =====================================================
  // โหลดข้อความ
  // =====================================================
  useEffect(() => {
    if (!params.id) {
      return;
    }

    async function loadMessages() {
      try {
        setLoadingMessages(true);

        const response = await fetch(`/api/tickets/${params.id}/messages`, {
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
          throw new Error(data.message || "ไม่สามารถโหลดข้อความได้");
        }

        setMessages(data.messages || []);
      } catch (error) {
        console.error("LOAD MESSAGES ERROR:", error);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [params.id, router]);

  // =====================================================
  // ส่งข้อความ
  // =====================================================
  async function handleSendMessage(e) {
    e.preventDefault();

    const text = messageText.trim();

    if (!text) {
      return;
    }

    try {
      setSendingMessage(true);

      const response = await fetch(`/api/tickets/${params.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: text,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถส่งข้อความได้");
      }

      // เพิ่มข้อความใหม่เข้า Chat ทันที
      setMessages((currentMessages) => [...currentMessages, data.chatMessage]);

      setMessageText("");
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "ส่งข้อความไม่สำเร็จ",
        text: error.message || "ไม่สามารถส่งข้อความได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  // =====================================================
  // USER ยืนยันผลการแก้ไข
  // =====================================================
  async function handleConfirmResolution(nextStatus) {
    if (updatingStatus || ticket?.status !== "RESOLVED") {
      return;
    }

    const isResolved = nextStatus === "CLOSED";

    const confirmResult = await Swal.fire({
      icon: isResolved ? "question" : "warning",
      title: isResolved ? "ยืนยันว่าแก้ไขสำเร็จแล้ว?" : "ยังแก้ไขปัญหาไม่ได้?",
      text: isResolved
        ? "Ticket นี้จะถูกปิดงาน"
        : "Ticket จะกลับไปอยู่ในสถานะกำลังดำเนินการ",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isResolved ? "#198754" : "#dc3545",
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถยืนยันผลการแก้ไขได้");
      }

      setTicket(data.ticket);

      await Swal.fire({
        icon: "success",
        title: "ดำเนินการสำเร็จ",
        text: data.message,
        confirmButtonText: "ตกลง",
      });

      router.refresh();
    } catch (error) {
      console.error("CONFIRM RESOLUTION ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "ดำเนินการไม่สำเร็จ",
        text: error.message || "ไม่สามารถยืนยันผลการแก้ไขได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  // =====================================================
  // Status
  // =====================================================
  function getStatusText(status) {
    switch (status) {
      case "OPEN":
        return "เปิดใหม่";
      case "IN_PROGRESS":
        return "กำลังดำเนินการ";
      case "RESOLVED":
        return "รอยืนยันผลการแก้ไข";
      case "CLOSED":
        return "ปิดงาน";
      default:
        return status;
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "OPEN":
        return "bg-primary";
      case "IN_PROGRESS":
        return "bg-warning text-dark";
      case "RESOLVED":
        return "bg-success";
      case "CLOSED":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  }

  // =====================================================
  // Priority
  // =====================================================
  function getPriorityText(priority) {
    switch (priority) {
      case "LOW":
        return "ต่ำ";
      case "MEDIUM":
        return "ปานกลาง";
      case "HIGH":
        return "สูง";
      case "URGENT":
        return "เร่งด่วน";
      default:
        return priority;
    }
  }

  function getPriorityBadge(priority) {
    switch (priority) {
      case "LOW":
        return "bg-success";
      case "MEDIUM":
        return "bg-info text-dark";
      case "HIGH":
        return "bg-warning text-dark";
      case "URGENT":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  // =====================================================
  // วันที่
  // =====================================================
  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // =====================================================
  // Loading
  // =====================================================
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-3">กำลังโหลด Ticket...</p>
      </div>
    );
  }

  // =====================================================
  // Error
  // =====================================================
  if (error || !ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "ไม่พบ Ticket"}</div>

        <Link
          href="/tickets"
          className="text-decoration-none fw-bold"
          style={{ color: "#111111" }}
        >
          ← กลับไป Ticket ของฉัน
        </Link>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: "#f5f7fb",
      }}
    >
      {/* =================================================
          NAVBAR
      ================================================= */}
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container py-2">
          <Link href="/dashboard" className="navbar-brand fw-bold text-primary">
            SmartDesk AI
          </Link>

          <div className="d-flex gap-2">
            <Link href="/tickets" className="btn btn-outline-secondary">
              Ticket ของฉัน
            </Link>

            <Link href="/tickets/create" className="btn btn-primary">
              + แจ้งปัญหา
            </Link>
          </div>
        </div>
      </nav>

      {/* =================================================
          CONTENT
      ================================================= */}
      <main className="container py-5">
        <div className="mb-4">
          <Link
            href="/tickets"
            className="text-decoration-none fw-bold"
            style={{
              color: "#0b3d91",
            }}
          >
            ← กลับไป Ticket ของฉัน
          </Link>
        </div>

        <div className="row g-4">
          {/* =================================================
              LEFT
          ================================================= */}
          <div className="col-lg-8">
            {/* =================================================
                TICKET DETAIL
            ================================================= */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                  <div>
                    <div className="text-muted mb-1">Ticket #{ticket.id}</div>

                    <h2
                      className="fw-bold mb-0"
                      style={{
                        color: "#111111",
                      }}
                    >
                      {ticket.title}
                    </h2>
                  </div>

                  <span
                    className={"badge fs-6 " + getStatusBadge(ticket.status)}
                  >
                    {getStatusText(ticket.status)}
                  </span>
                </div>

                <hr />

                <h5 className="fw-bold mt-4">รายละเอียดปัญหา</h5>

                <div
                  className="p-3 rounded mt-3"
                  style={{
                    backgroundColor: "#f8f9fa",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {ticket.description}
                </div>
              </div>
            </div>

            {/* =================================================
                STATUS INFO
            ================================================= */}
            {ticket.status === "IN_PROGRESS" && (
              <div className="alert alert-warning mt-4 mb-0">
                <div className="fw-bold">เจ้าหน้าที่กำลังดำเนินการ</div>

                <div className="small mt-1">
                  เจ้าหน้าที่ IT กำลังตรวจสอบปัญหาของคุณ
                  คุณสามารถสนทนากับเจ้าหน้าที่ได้ด้านล่าง
                </div>
              </div>
            )}

            {ticket.status === "RESOLVED" && (
              <div className="alert alert-success mt-4 mb-0">
                <div className="fw-bold">ปัญหานี้ได้รับการแก้ไขแล้ว</div>

                <div className="small mt-1">
                  เจ้าหน้าที่ IT ได้ดำเนินการแก้ไข Ticket นี้แล้ว
                </div>
              </div>
            )}

            {/* =================================================
                USER ยืนยันผลการแก้ไข
            ================================================= */}
            {ticket.status === "RESOLVED" && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-2">ยืนยันผลการแก้ไข</h5>

                  <p className="text-secondary">
                    เจ้าหน้าที่แจ้งว่าแก้ไขเสร็จแล้ว กรุณาตรวจสอบปัญหา
                    และเลือกผลการแก้ไขด้านล่าง
                  </p>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={updatingStatus}
                      onClick={() => handleConfirmResolution("CLOSED")}
                    >
                      {updatingStatus ? "กำลังดำเนินการ..." : "แก้ไขสำเร็จแล้ว"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      disabled={updatingStatus}
                      onClick={() => handleConfirmResolution("IN_PROGRESS")}
                    >
                      ยังแก้ไขไม่ได้
                    </button>
                  </div>
                </div>
              </div>
            )}

            {ticket.status === "CLOSED" && (
              <div className="alert alert-secondary mt-4 mb-0">
                <div className="fw-bold">Ticket นี้ถูกปิดแล้ว</div>
              </div>
            )}

            {/* =================================================
                CHAT
            ================================================= */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold mb-1">การสนทนากับเจ้าหน้าที่ IT</h5>

                    <div className="text-muted small">
                      ใช้สำหรับสอบถามหรือให้ข้อมูลเพิ่มเติมเกี่ยวกับปัญหานี้
                    </div>
                  </div>

                  <span className="badge bg-primary">
                    {messages.length} ข้อความ
                  </span>
                </div>

                {/* =================================================
                    MESSAGE BOX
                ================================================= */}
                <div
                  className="border rounded p-3 mb-3"
                  style={{
                    minHeight: "320px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  {loadingMessages ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      />

                      <div className="text-muted mt-2">กำลังโหลดข้อความ...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <div
                        style={{
                          fontSize: "40px",
                        }}
                      >
                        💬
                      </div>

                      <div className="fw-semibold mt-2">ยังไม่มีข้อความ</div>

                      <div className="small mt-1">
                        เมื่อเจ้าหน้าที่ส่งข้อความ ข้อความจะแสดงที่นี่
                      </div>
                    </div>
                  ) : (
                    messages.map((chat) => {
                      // USER = ตัวเรา
                      const isUser = chat.sender?.role === "USER";

                      return (
                        <div
                          key={chat.id}
                          className={
                            "d-flex mb-3 " +
                            (isUser
                              ? "justify-content-end"
                              : "justify-content-start")
                          }
                        >
                          <div
                            style={{
                              maxWidth: "75%",
                              minWidth: "120px",
                            }}
                          >
                            {/* Sender */}
                            <div
                              className={
                                "small fw-semibold mb-1 " +
                                (isUser ? "text-end" : "text-start")
                              }
                            >
                              {chat.sender?.name || `User #${chat.senderId}`}

                              {chat.sender?.role === "IT" && (
                                <span className="badge bg-dark ms-2">IT</span>
                              )}
                            </div>

                            {/* Bubble */}
                            <div
                              className={
                                "rounded-3 px-3 py-2 " +
                                (isUser
                                  ? "bg-primary text-white"
                                  : "bg-white border text-dark")
                              }
                              style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {chat.message}
                            </div>

                            {/* Time */}
                            <div
                              className={
                                "text-muted small mt-1 " +
                                (isUser ? "text-end" : "text-start")
                              }
                            >
                              {formatDate(chat.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* =================================================
                    SEND MESSAGE
                ================================================= */}
                <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <textarea
                      className="form-control"
                      placeholder="พิมพ์ข้อความถึงเจ้าหน้าที่ IT..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      disabled={sendingMessage || ticket.status === "CLOSED"}
                      style={{
                        resize: "none",
                      }}
                    />

                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      disabled={
                        sendingMessage ||
                        !messageText.trim() ||
                        ticket.status === "CLOSED"
                      }
                    >
                      {sendingMessage ? "กำลังส่ง..." : "ส่ง"}
                    </button>
                  </div>

                  <div className="d-flex justify-content-between mt-2">
                    <div className="text-muted small">
                      ข้อความจะถูกส่งถึงเจ้าหน้าที่ IT
                    </div>

                    <div className="text-muted small">
                      {messageText.length}/2000
                    </div>
                  </div>
                </form>
                {ticket.status === "CLOSED" && (
                  <div className="alert alert-secondary mt-3 mb-0">
                    Ticket นี้ปิดงานแล้ว ไม่สามารถส่งข้อความเพิ่มเติมได้
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">ข้อมูล Ticket</h5>

                {/* Category */}
                <div className="mb-3">
                  <div className="text-muted small">หมวดหมู่</div>

                  <div className="fw-semibold">{ticket.category}</div>
                </div>

                <hr />

                {/* Priority */}
                <div className="mb-3">
                  <div className="text-muted small mb-1">ความสำคัญ</div>

                  <span
                    className={"badge " + getPriorityBadge(ticket.priority)}
                  >
                    {getPriorityText(ticket.priority)}
                  </span>
                </div>

                <hr />

                {/* Status */}
                <div className="mb-3">
                  <div className="text-muted small mb-1">สถานะ</div>

                  <span className={"badge " + getStatusBadge(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </span>
                </div>

                <hr />

                {/* Assignee */}
                <div className="mb-3">
                  <div className="text-muted small">เจ้าหน้าที่ผู้รับงาน</div>

                  {ticket.assignee ? (
                    <>
                      <div className="fw-bold mt-1">{ticket.assignee.name}</div>

                      {ticket.assignee.email && (
                        <div className="text-muted small">
                          {ticket.assignee.email}
                        </div>
                      )}

                      <span className="badge bg-dark mt-2">IT</span>
                    </>
                  ) : (
                    <div className="text-muted mt-1">
                      ยังไม่มีเจ้าหน้าที่รับงาน
                    </div>
                  )}
                </div>

                <hr />

                {/* Created */}
                <div className="mb-3">
                  <div className="text-muted small">วันที่แจ้ง</div>

                  <div className="fw-semibold">
                    {formatDate(ticket.createdAt)}
                  </div>
                </div>

                <hr />

                {/* Updated */}
                <div>
                  <div className="text-muted small">อัปเดตล่าสุด</div>

                  <div className="fw-semibold">
                    {formatDate(ticket.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
