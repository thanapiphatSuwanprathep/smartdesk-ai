"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function ITTicketDetailPage() {
  const params = useParams();
  const router = useRouter();

  // =====================================================
  // Ticket
  // =====================================================
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // Chat
  // =====================================================
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] =
    useState(true);
  const [sendingMessage, setSendingMessage] =
    useState(false);

  // =====================================================
  // โหลด Ticket
  // =====================================================
  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/it/tickets/${params.id}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

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
          throw new Error(
            data.message || "ไม่สามารถโหลด Ticket ได้"
          );
        }

        setTicket(data.ticket);
      } catch (error) {
        console.error(
          "LOAD IT TICKET ERROR:",
          error
        );

        setError(
          error.message || "ไม่สามารถโหลด Ticket ได้"
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadTicket();
    }
  }, [params.id, router]);

  // =====================================================
  // โหลดข้อความ Chat
  // =====================================================
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoadingMessages(true);

        const response = await fetch(
          `/api/tickets/${params.id}/messages`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดข้อความได้"
          );
        }

        setMessages(data.messages || []);
      } catch (error) {
        console.error(
          "LOAD MESSAGES ERROR:",
          error
        );
      } finally {
        setLoadingMessages(false);
      }
    }

    if (params.id) {
      loadMessages();
    }
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

      const response = await fetch(
        `/api/tickets/${params.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "ไม่สามารถส่งข้อความได้"
        );
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        data.chatMessage,
      ]);

      setMessageText("");
    } catch (error) {
      console.error(
        "SEND MESSAGE ERROR:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "ส่งข้อความไม่สำเร็จ",
        text:
          error.message ||
          "ไม่สามารถส่งข้อความได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  // =====================================================
  // เปลี่ยนสถานะ Ticket
  // =====================================================
  async function updateTicketStatus(newStatus) {
    try {
      setUpdating(true);

      const response = await fetch(
        `/api/it/tickets/${params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return null;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "ไม่สามารถอัปเดตสถานะ Ticket ได้"
        );
      }

      // โหลดข้อมูลใหม่หลังอัปเดต
      const detailResponse = await fetch(
        `/api/it/tickets/${params.id}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (detailResponse.ok) {
        const detailData =
          await detailResponse.json();

        setTicket(detailData.ticket);

        return detailData.ticket;
      }

      setTicket(data.ticket);

      return data.ticket;
    } catch (error) {
      console.error(
        "UPDATE TICKET STATUS ERROR:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error.message ||
          "ไม่สามารถอัปเดตสถานะ Ticket ได้",
        confirmButtonText: "ตกลง",
      });

      return null;
    } finally {
      setUpdating(false);
    }
  }

  // =====================================================
  // รับงาน
  // =====================================================
  async function handleAcceptTicket() {
    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันการรับงาน?",
      text: `คุณต้องการรับ Ticket #${ticket.id} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "รับงาน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#0d6efd",
    });

    if (!result.isConfirmed) {
      return;
    }

    const updatedTicket =
      await updateTicketStatus("IN_PROGRESS");

    if (!updatedTicket) {
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "รับงานสำเร็จ",
      text:
        "Ticket อยู่ในสถานะกำลังดำเนินการแล้ว",
      confirmButtonText: "ตกลง",
    });
  }

  // =====================================================
  // แก้ไขเสร็จแล้ว
  // =====================================================
  async function handleResolveTicket() {
    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันว่าแก้ไขเสร็จแล้ว?",
      text: `Ticket #${ticket.id} จะถูกเปลี่ยนเป็นสถานะแก้ไขแล้ว`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#198754",
    });

    if (!result.isConfirmed) {
      return;
    }

    const updatedTicket =
      await updateTicketStatus("RESOLVED");

    if (!updatedTicket) {
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "อัปเดตสำเร็จ",
      text:
        "Ticket ถูกเปลี่ยนเป็นสถานะแก้ไขแล้ว",
      confirmButtonText: "ตกลง",
    });
  }

  // =====================================================
  // Status Text
  // =====================================================
  function getStatusText(status) {
    switch (status) {
      case "OPEN":
        return "เปิดใหม่";

      case "IN_PROGRESS":
        return "กำลังดำเนินการ";

      case "RESOLVED":
        return "แก้ไขแล้ว";

      case "CLOSED":
        return "ปิดงาน";

      default:
        return status;
    }
  }

  // =====================================================
  // Status Badge
  // =====================================================
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
  // Priority Text
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

  // =====================================================
  // Priority Badge
  // =====================================================
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
  // Format Date
  // =====================================================
  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "th-TH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  // =====================================================
  // Loading
  // =====================================================
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
        />

        <p className="text-muted mt-3">
          กำลังโหลด Ticket...
        </p>
      </div>
    );
  }

  // =====================================================
  // Error
  // =====================================================
  if (error || !ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error || "ไม่พบ Ticket"}
        </div>

        <Link
          href="/it/tickets"
          className="btn btn-outline-primary"
        >
          ← กลับไป Ticket ทั้งหมด
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
          <Link
            href="/it/dashboard"
            className="navbar-brand fw-bold text-primary"
          >
            SmartDesk AI
          </Link>

          <div className="d-flex gap-2">
            <Link
              href="/it/dashboard"
              className="btn btn-outline-secondary"
            >
              IT Dashboard
            </Link>

            <Link
              href="/it/tickets"
              className="btn btn-primary"
            >
              Ticket ทั้งหมด
            </Link>
          </div>
        </div>
      </nav>

      {/* =================================================
          CONTENT
      ================================================= */}
      <main className="container py-5">

        {/* Back */}
        <div className="mb-4">
          <Link
            href="/it/tickets"
            className="text-decoration-none fw-semibold"
            style={{
              color: "#0b3d91",
            }}
          >
            ← กลับไป Ticket ทั้งหมด
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
                    <div className="text-muted mb-1">
                      Ticket #{ticket.id}
                    </div>

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
                    className={
                      "badge fs-6 " +
                      getStatusBadge(
                        ticket.status
                      )
                    }
                  >
                    {getStatusText(
                      ticket.status
                    )}
                  </span>

                </div>

                <hr />

                <h5 className="fw-bold mt-4">
                  รายละเอียดปัญหา
                </h5>

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
                MANAGE TICKET
            ================================================= */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">

                <h5 className="fw-bold">
                  จัดการ Ticket
                </h5>

                <p className="text-muted">
                  เจ้าหน้าที่ IT สามารถรับงานและอัปเดตสถานะ
                  Ticket ได้จากส่วนนี้
                </p>

                {/* OPEN */}
                {ticket.status === "OPEN" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                      handleAcceptTicket
                    }
                    disabled={updating}
                  >
                    {updating
                      ? "กำลังรับงาน..."
                      : "รับงาน"}
                  </button>
                )}

                {/* IN_PROGRESS */}
                {ticket.status ===
                  "IN_PROGRESS" && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={
                      handleResolveTicket
                    }
                    disabled={updating}
                  >
                    {updating
                      ? "กำลังอัปเดต..."
                      : "แก้ไขเสร็จแล้ว"}
                  </button>
                )}

                {/* RESOLVED */}
                {ticket.status ===
                  "RESOLVED" && (
                  <div>
                    <span className="badge bg-success fs-6">
                      ดำเนินการแก้ไขแล้ว
                    </span>
                  </div>
                )}

                {/* CLOSED */}
                {ticket.status ===
                  "CLOSED" && (
                  <div>
                    <span className="badge bg-secondary fs-6">
                      Ticket นี้ถูกปิดแล้ว
                    </span>
                  </div>
                )}

              </div>
            </div>

            {/* =================================================
                CHAT
            ================================================= */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">

                {/* Chat Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">

                  <div>
                    <h5 className="fw-bold mb-1">
                      การสนทนา
                    </h5>

                    <div className="text-muted small">
                      สนทนากับผู้แจ้งปัญหาเกี่ยวกับ
                      Ticket นี้
                    </div>
                  </div>

                  <span className="badge bg-primary">
                    {messages.length} ข้อความ
                  </span>

                </div>

                {/* =================================================
                    CHAT MESSAGES
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

                  {/* Loading Messages */}
                  {loadingMessages ? (
                    <div className="text-center py-5">

                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      />

                      <div className="text-muted mt-2">
                        กำลังโหลดข้อความ...
                      </div>

                    </div>
                  ) : messages.length === 0 ? (

                    /* No Message */
                    <div className="text-center text-muted py-5">

                      <div
                        style={{
                          fontSize: "40px",
                        }}
                      >
                        💬
                      </div>

                      <div className="fw-semibold mt-2">
                        ยังไม่มีข้อความ
                      </div>

                      <div className="small mt-1">
                        เริ่มการสนทนากับผู้แจ้งปัญหาได้เลย
                      </div>

                    </div>

                  ) : (

                    /* Messages */
                    messages.map((chat) => {
                      const isIT =
                        chat.sender?.role ===
                        "IT";

                      return (
                        <div
                          key={chat.id}
                          className={
                            "d-flex mb-3 " +
                            (isIT
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
                                (isIT
                                  ? "text-end"
                                  : "text-start")
                              }
                            >
                              {chat.sender?.name ||
                                `User #${chat.senderId}`}

                              {isIT && (
                                <span className="badge bg-dark ms-2">
                                  IT
                                </span>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={
                                "rounded-3 px-3 py-2 " +
                                (isIT
                                  ? "bg-primary text-white"
                                  : "bg-white border text-dark")
                              }
                              style={{
                                whiteSpace:
                                  "pre-wrap",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {chat.message}
                            </div>

                            {/* Time */}
                            <div
                              className={
                                "text-muted small mt-1 " +
                                (isIT
                                  ? "text-end"
                                  : "text-start")
                              }
                            >
                              {formatDate(
                                chat.createdAt
                              )}
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
                <form
                  onSubmit={handleSendMessage}
                >

                  <div className="input-group">

                    <textarea
                      className="form-control"
                      placeholder="พิมพ์ข้อความถึงผู้แจ้งปัญหา..."
                      value={messageText}
                      onChange={(e) =>
                        setMessageText(
                          e.target.value
                        )
                      }
                      rows={2}
                      maxLength={2000}
                      disabled={sendingMessage}
                      style={{
                        resize: "none",
                      }}
                    />

                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      disabled={
                        sendingMessage ||
                        !messageText.trim()
                      }
                    >
                      {sendingMessage
                        ? "กำลังส่ง..."
                        : "ส่ง"}
                    </button>

                  </div>

                  <div className="d-flex justify-content-between mt-2">

                    <div className="text-muted small">
                      ข้อความจะถูกส่งถึงผู้แจ้งปัญหา
                    </div>

                    <div className="text-muted small">
                      {messageText.length}/2000
                    </div>

                  </div>

                </form>

              </div>
            </div>

          </div>

          {/* =================================================
              RIGHT
          ================================================= */}
          <div className="col-lg-4">

            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">

                <h5 className="fw-bold mb-4">
                  ข้อมูล Ticket
                </h5>

                {/* =================================================
                    REPORTER
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small mb-1">
                    ผู้แจ้ง
                  </div>

                  <div className="fw-bold">
                    {ticket.reporter?.name ||
                      `User #${ticket.userId}`}
                  </div>

                  {ticket.reporter?.email && (
                    <div className="text-muted small mt-1">
                      {ticket.reporter.email}
                    </div>
                  )}

                  {ticket.reporter?.role && (
                    <span className="badge bg-primary mt-2">
                      {ticket.reporter.role}
                    </span>
                  )}

                </div>

                <hr />

                {/* =================================================
                    ASSIGNEE
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small mb-1">
                    ผู้รับงาน
                  </div>

                  {ticket.assignee ? (
                    <>
                      <div className="fw-bold">
                        {ticket.assignee.name}
                      </div>

                      {ticket.assignee.email && (
                        <div className="text-muted small mt-1">
                          {ticket.assignee.email}
                        </div>
                      )}

                      <span className="badge bg-dark mt-2">
                        IT
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="text-muted">
                        ยังไม่มีเจ้าหน้าที่รับงาน
                      </div>

                      <span className="badge bg-secondary mt-2">
                        รอรับงาน
                      </span>
                    </>
                  )}

                </div>

                <hr />

                {/* =================================================
                    CATEGORY
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small">
                    หมวดหมู่
                  </div>

                  <div className="fw-semibold">
                    {ticket.category}
                  </div>

                </div>

                <hr />

                {/* =================================================
                    PRIORITY
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small mb-1">
                    ความสำคัญ
                  </div>

                  <span
                    className={
                      "badge " +
                      getPriorityBadge(
                        ticket.priority
                      )
                    }
                  >
                    {getPriorityText(
                      ticket.priority
                    )}
                  </span>

                </div>

                <hr />

                {/* =================================================
                    STATUS
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small mb-1">
                    สถานะ
                  </div>

                  <span
                    className={
                      "badge " +
                      getStatusBadge(
                        ticket.status
                      )
                    }
                  >
                    {getStatusText(
                      ticket.status
                    )}
                  </span>

                </div>

                <hr />

                {/* =================================================
                    CREATED AT
                ================================================= */}
                <div className="mb-3">

                  <div className="text-muted small">
                    วันที่แจ้ง
                  </div>

                  <div className="fw-semibold">
                    {formatDate(
                      ticket.createdAt
                    )}
                  </div>

                </div>

                <hr />

                {/* =================================================
                    UPDATED AT
                ================================================= */}
                <div>

                  <div className="text-muted small">
                    อัปเดตล่าสุด
                  </div>

                  <div className="fw-semibold">
                    {formatDate(
                      ticket.updatedAt
                    )}
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