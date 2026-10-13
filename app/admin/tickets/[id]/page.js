
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

// ===============================
// สถานะ Ticket
// ===============================
const statusLabels = {
  OPEN: "เปิดใหม่",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "รอยืนยันผล",
  CLOSED: "ปิดงานแล้ว",
};

const statusColors = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

// ===============================
// ระดับความสำคัญ
// ===============================
const priorityLabels = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  URGENT: "เร่งด่วน",
};

const priorityColors = {
  LOW: "secondary",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

// ===============================
// แปลงวันที่
// ===============================
function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ===============================
// ป้องกัน HTML Injection ใน Swal
// ===============================
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]
  );
}

// ===============================
// ADMIN Ticket Detail
// ===============================
export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id;

  // Ticket
  const [ticket, setTicket] = useState(null);

  // Chat
  const [messages, setMessages] = useState([]);

  // IT Users
  const [itUsers, setItUsers] = useState([]);
  const [selectedItId, setSelectedItId] = useState("");

  // Loading
  const [loading, setLoading] = useState(true);
  const [loadingIt, setLoadingIt] = useState(true);
  const [saving, setSaving] = useState(false);

  // Error
  const [error, setError] = useState("");
  const [itError, setItError] = useState("");

  // ===============================
  // โหลดรายละเอียด Ticket
  // ===============================
  useEffect(() => {
    if (!ticketId) return;

    let active = true;

    async function loadTicket() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/admin/tickets/${ticketId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "โหลดรายละเอียดไม่สำเร็จ"
          );
        }

        if (!active) return;

        setTicket(data.ticket);
        setMessages(data.messages || []);

        setSelectedItId(
          data.ticket?.assignedToId
            ? String(data.ticket.assignedToId)
            : ""
        );
      } catch (err) {
        if (active) {
          setError(
            err.message || "ไม่สามารถโหลดข้อมูลได้"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      active = false;
    };
  }, [ticketId]);

  // ===============================
  // โหลดรายชื่อเจ้าหน้าที่ IT
  // ===============================
  useEffect(() => {
    let active = true;

    async function loadItUsers() {
      setLoadingIt(true);
      setItError("");

      try {
        const response = await fetch(
          "/api/admin/it-users",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "โหลดรายชื่อ IT ไม่สำเร็จ"
          );
        }

        if (active) {
          setItUsers(data.itUsers || []);
        }
      } catch (err) {
        if (active) {
          setItError(
            err.message || "ไม่สามารถโหลดรายชื่อ IT ได้"
          );
        }
      } finally {
        if (active) {
          setLoadingIt(false);
        }
      }
    }

    loadItUsers();

    return () => {
      active = false;
    };
  }, []);

  // ===============================
  // มอบหมาย Ticket ให้ IT
  // ===============================
  async function handleAssign() {
    if (!ticket || saving) return;

    // ไม่อนุญาตให้มอบหมาย Ticket ที่ปิดแล้ว
    if (ticket.status === "CLOSED") {
      await Swal.fire({
        icon: "warning",
        title: "ไม่สามารถมอบหมายงานได้",
        text: "Ticket นี้ปิดงานแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const itId = Number(selectedItId);

    // ตรวจสอบ IT ID
    if (
      !Number.isSafeInteger(itId) ||
      itId <= 0
    ) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกเจ้าหน้าที่ IT",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ตรวจสอบผู้รับผิดชอบเดิม
    if (itId === Number(ticket.assignedToId)) {
      await Swal.fire({
        icon: "info",
        title: "เจ้าหน้าที่คนนี้รับผิดชอบอยู่แล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ค้นหา IT ที่เลือก
    const selectedUser = itUsers.find(
      (user) => Number(user.id) === itId
    );

    if (!selectedUser) {
      await Swal.fire({
        icon: "error",
        title: "ไม่พบเจ้าหน้าที่ที่เลือก",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ยืนยันการมอบหมาย
    const result = await Swal.fire({
      icon: "question",
      title: ticket.assignedToId
        ? "ยืนยันการเปลี่ยนผู้รับผิดชอบ?"
        : "ยืนยันการมอบหมายงาน?",
      html: `
        <div>Ticket #${escapeHtml(ticket.id)}</div>

        <div class="mt-2">
          มอบหมายให้
          <strong>${escapeHtml(selectedUser.name)}</strong>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#0d6efd",
    });

    if (!result.isConfirmed) return;

    setSaving(true);

    try {
      // ส่งคำขอมอบหมาย Ticket
      const response = await fetch(
        `/api/admin/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedToId: itId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "มอบหมายงานไม่สำเร็จ"
        );
      }

      // โหลดข้อมูล Ticket ล่าสุด
      const updatedResponse = await fetch(
        `/api/admin/tickets/${ticketId}`,
        {
          cache: "no-store",
        }
      );

      const updatedData =
        await updatedResponse.json();

      if (!updatedResponse.ok) {
        throw new Error(
          updatedData.message ||
            "บันทึกสำเร็จ แต่โหลดข้อมูลล่าสุดไม่ได้"
        );
      }

      // อัปเดตข้อมูลบนหน้า
      setTicket(updatedData.ticket);
      setMessages(updatedData.messages || []);

      setSelectedItId(
        String(
          updatedData.ticket.assignedToId || ""
        )
      );

      await Swal.fire({
        icon: "success",
        title: "มอบหมายงานสำเร็จ",
        text: `Ticket #${ticket.id} มอบหมายให้ ${selectedUser.name} แล้ว`,
        confirmButtonText: "ตกลง",
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          err.message ||
          "ไม่สามารถมอบหมายงานได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSaving(false);
    }
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: "#f5f7fb",
        color: "#212529",
      }}
    >
      {/* Navbar */}
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container py-3">
          <Link
            href="/admin/dashboard"
            className="navbar-brand fw-bold text-primary"
          >
            SmartDesk AI
          </Link>

          <span className="badge bg-dark">
            ADMIN
          </span>
        </div>
      </nav>

      <main className="container py-5">
        {/* Back */}
        <Link
          href="/admin/tickets"
          className="text-decoration-none"
        >
          ← กลับไปรายการ Ticket
        </Link>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />

            <p className="mt-3">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mt-4">
            {error}
          </div>
        ) : !ticket ? (
          <div className="alert alert-warning mt-4">
            ไม่พบ Ticket
          </div>
        ) : (
          <>
            {/* Ticket Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 mb-4">
              <div>
                <div className="text-secondary">
                  Ticket #{ticket.id}
                </div>

                <h2 className="fw-bold mb-0">
                  {ticket.title}
                </h2>
              </div>

              <span
                className={`badge bg-${
                  statusColors[ticket.status] ||
                  "secondary"
                } fs-6`}
              >
                {statusLabels[ticket.status] ||
                  ticket.status}
              </span>
            </div>

            <div className="row g-4">
              {/* =========================
                  LEFT COLUMN
              ========================= */}
              <div className="col-lg-8">
                {/* รายละเอียดปัญหา */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3">
                      รายละเอียดปัญหา
                    </h5>

                    <div
                      className="rounded p-3"
                      style={{
                        backgroundColor: "#f8f9fa",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {ticket.description}
                    </div>

                    <hr />

                    <div className="row g-3">
                      {/* Category */}
                      <div className="col-sm-6">
                        <div className="text-secondary small">
                          หมวดหมู่
                        </div>

                        <strong>
                          {ticket.category}
                        </strong>
                      </div>

                      {/* Priority */}
                      <div className="col-sm-6">
                        <div className="text-secondary small">
                          ความสำคัญ
                        </div>

                        <span
                          className={`badge bg-${
                            priorityColors[
                              ticket.priority
                            ] || "secondary"
                          }`}
                        >
                          {priorityLabels[
                            ticket.priority
                          ] || ticket.priority}
                        </span>
                      </div>

                      {/* Created */}
                      <div className="col-sm-6">
                        <div className="text-secondary small">
                          วันที่แจ้ง
                        </div>

                        <strong>
                          {formatDate(
                            ticket.createdAt
                          )}
                        </strong>
                      </div>

                      {/* Updated */}
                      <div className="col-sm-6">
                        <div className="text-secondary small">
                          อัปเดตล่าสุด
                        </div>

                        <strong>
                          {formatDate(
                            ticket.updatedAt
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================
                    SMARTDESK AI ASSISTANT
                ========================= */}
                

                {/* =========================
                    ประวัติการสนทนา
                ========================= */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="fw-bold mb-1">
                          ประวัติการสนทนา
                        </h5>

                        <p className="text-secondary small mb-0">
                          ข้อความระหว่างผู้แจ้งกับเจ้าหน้าที่ IT
                        </p>
                      </div>

                      <span className="badge bg-primary">
                        {messages.length} ข้อความ
                      </span>
                    </div>

                    <div
                      className="border rounded p-3"
                      style={{
                        minHeight: 250,
                        maxHeight: 500,
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {messages.length === 0 ? (
                        <div className="text-center text-secondary py-5">
                          ยังไม่มีข้อความสนทนา
                        </div>
                      ) : (
                        messages.map((chat) => {
                          const isUser =
                            chat.sender?.role ===
                            "USER";

                          return (
                            <div
                              key={chat.id}
                              className={`d-flex mb-3 ${
                                isUser
                                  ? "justify-content-end"
                                  : "justify-content-start"
                              }`}
                            >
                              <div
                                style={{
                                  maxWidth: "85%",
                                  minWidth: 100,
                                }}
                              >
                                {/* Sender */}
                                <div
                                  className={`small fw-semibold mb-1 ${
                                    isUser
                                      ? "text-end"
                                      : ""
                                  }`}
                                >
                                  {chat.sender?.name ||
                                    `ผู้ใช้ #${chat.senderId}`}

                                  <span
                                    className={`badge ms-2 ${
                                      isUser
                                        ? "bg-primary"
                                        : "bg-dark"
                                    }`}
                                  >
                                    {chat.sender?.role ||
                                      "-"}
                                  </span>
                                </div>

                                {/* Message */}
                                <div
                                  className={`rounded p-3 ${
                                    isUser
                                      ? "bg-primary text-white"
                                      : "bg-white border"
                                  }`}
                                  style={{
                                    whiteSpace:
                                      "pre-wrap",
                                    overflowWrap:
                                      "anywhere",
                                  }}
                                >
                                  {chat.message}
                                </div>

                                {/* Date */}
                                <div
                                  className={`small text-secondary mt-1 ${
                                    isUser
                                      ? "text-end"
                                      : ""
                                  }`}
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

                    <div className="alert alert-light border mt-3 mb-0">
                      <strong>ADMIN:</strong>{" "}
                      สามารถตรวจสอบประวัติการสนทนา
                      และมอบหมายงานได้
                      แต่ไม่สามารถส่งข้อความหรือปิด
                      Ticket แทนผู้แจ้ง
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================
                  RIGHT COLUMN
              ========================= */}
              <div className="col-lg-4">
                {/* มอบหมาย Ticket */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3">
                      มอบหมาย Ticket
                    </h5>

                    {ticket.status === "CLOSED" ? (
                      <div className="alert alert-secondary mb-0">
                        Ticket นี้ปิดงานแล้ว
                        ไม่สามารถเปลี่ยนผู้รับผิดชอบได้
                      </div>
                    ) : (
                      <>
                        <p className="text-secondary small">
                          เลือกเจ้าหน้าที่ IT
                          ที่ต้องการให้รับผิดชอบงานนี้
                        </p>

                        {itError && (
                          <div className="alert alert-danger">
                            {itError}
                          </div>
                        )}

                        <label
                          htmlFor="itAssignee"
                          className="form-label fw-semibold"
                        >
                          เจ้าหน้าที่ IT
                        </label>

                        <select
                          id="itAssignee"
                          className="form-select mb-3"
                          value={selectedItId}
                          onChange={(e) =>
                            setSelectedItId(
                              e.target.value
                            )
                          }
                          disabled={
                            loadingIt || saving
                          }
                        >
                          <option value="">
                            -- เลือกเจ้าหน้าที่ --
                          </option>

                          {itUsers.map((user) => (
                            <option
                              key={user.id}
                              value={user.id}
                            >
                              {user.name} (
                              {user.email})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          onClick={handleAssign}
                          disabled={
                            saving ||
                            loadingIt ||
                            !selectedItId ||
                            Number(selectedItId) ===
                              Number(
                                ticket.assignedToId
                              )
                          }
                        >
                          {saving
                            ? "กำลังบันทึก..."
                            : ticket.assignedToId
                            ? "เปลี่ยนผู้รับผิดชอบ"
                            : "มอบหมายงาน"}
                        </button>

                        {loadingIt && (
                          <p className="small text-secondary mt-2 mb-0">
                            กำลังโหลดรายชื่อ IT...
                          </p>
                        )}

                        {!loadingIt &&
                          !itError &&
                          itUsers.length === 0 && (
                            <p className="small text-danger mt-2 mb-0">
                              ยังไม่มีเจ้าหน้าที่ IT
                              ในระบบ
                            </p>
                          )}
                      </>
                    )}
                  </div>
                </div>

                {/* ข้อมูล Ticket */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-4">
                      ข้อมูล Ticket
                    </h5>

                    {/* Reporter */}
                    <div className="mb-3">
                      <div className="text-secondary small">
                        ผู้แจ้ง
                      </div>

                      <div className="fw-bold">
                        {ticket.reporter?.name ||
                          "-"}
                      </div>

                      <div className="small text-secondary">
                        {ticket.reporter?.email ||
                          "-"}
                      </div>
                    </div>

                    <hr />

                    {/* Assignee */}
                    <div className="mb-3">
                      <div className="text-secondary small">
                        เจ้าหน้าที่ IT
                      </div>

                      {ticket.assignee ? (
                        <>
                          <div className="fw-bold">
                            {
                              ticket.assignee
                                .name
                            }
                          </div>

                          <div className="small text-secondary">
                            {
                              ticket.assignee
                                .email
                            }
                          </div>
                        </>
                      ) : (
                        <span className="text-secondary">
                          ยังไม่มีผู้รับงาน
                        </span>
                      )}
                    </div>

                    <hr />

                    {/* Status */}
                    <div className="mb-3">
                      <div className="text-secondary small">
                        สถานะ
                      </div>

                      <span
                        className={`badge bg-${
                          statusColors[
                            ticket.status
                          ] || "secondary"
                        }`}
                      >
                        {statusLabels[
                          ticket.status
                        ] || ticket.status}
                      </span>
                    </div>

                    <hr />

                    {/* Ticket ID */}
                    <div>
                      <div className="text-secondary small">
                        หมายเลข Ticket
                      </div>

                      <strong>
                        #{ticket.id}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
