# 🖥️ SmartDesk AI

### AI-Powered IT Helpdesk & Ticket Management System

**SmartDesk AI** is a web-based IT helpdesk and ticket management application designed to streamline technical support operations, improve issue tracking, and simplify communication between users, IT staff, and administrators.

The project brings together ticket management, role-based dashboards, and an AI chatbot in a centralized platform.

---

## ✨ Key Features

### 👤 User Features
- User registration and authentication
- Submit IT support tickets
- Track ticket status and progress
- View personal support requests
- Communicate through ticket messages
- Access an AI-powered helpdesk chatbot

### 🛠️ IT Staff Features
- Dedicated IT staff dashboard
- View and manage support tickets
- Update ticket status
- Review ticket details and conversations
- Manage assigned support work

### 🛡️ Administrator Features
- Administrative dashboard
- User management
- IT staff management
- Ticket monitoring and management
- Support workflow oversight

### 🤖 AI Chatbot
- AI-assisted helpdesk interaction
- Support for answering IT-related questions
- Assistance with common technical issues

---

## 🚦 Ticket Workflow

The system organizes support requests through four main statuses:

| Status | Description |
|---|---|
| OPEN | Newly submitted ticket |
| IN_PROGRESS | Ticket being handled |
| RESOLVED | Issue resolved, awaiting confirmation |
| CLOSED | Ticket completed and closed |

---

## 🚀 Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, JavaScript |
| Styling | CSS, Bootstrap 5 |
| Backend | Next.js App Router and API Routes |
| Database | PostgreSQL |
| Database Tools | Prisma |
| Authentication | bcryptjs, jose |
| AI Integration | OpenAI SDK |
| Email Integration | Resend |
| User Interface | SweetAlert2 |
| Version Control | Git, GitHub |

---

## 📸 Project Screenshots

Screenshots of the actual application will be added here.

Recommended screenshots:

- Landing Page
- Login and Registration
- User Dashboard
- Create Ticket
- Ticket Details
- IT Staff Dashboard
- Admin Dashboard
- AI Chatbot

---

## 📁 Project Structure

```text
smartdesk-ai/
├── app/
│   ├── admin/
│   ├── api/
│   ├── dashboard/
│   ├── it/
│   ├── login/
│   ├── register/
│   └── tickets/
├── components/
├── database/
├── public/
├── src/
│   ├── lib/
│   └── prisma/
├── prisma.config.ts
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- Git
- PostgreSQL database
- Required environment variables

### 1. Clone the repository

```bash
git clone https://github.com/thanapiphatSuwanprathep/smartdesk-ai.git
cd smartdesk-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
DATABASE_URL="your_postgresql_connection_string"
```

Configure additional authentication, AI, and email environment variables as required by the application.

Never commit real passwords, database credentials, or API keys.

### 4. Prepare the database

Set up the PostgreSQL database according to the project schema and Prisma configuration.

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Note:** Complete database setup and environment configuration are required before all features can operate correctly.

---

## 🎯 Project Objectives

- Centralize IT support requests in one application
- Improve visibility into ticket progress
- Simplify communication between users and IT personnel
- Support more organized IT service workflows
- Explore AI-assisted technical support

---

## 👨‍💻 Developer

**Thanapiphat Suwannaprathep**

Software Development Portfolio Project

GitHub: [thanapiphatSuwanprathep](https://github.com/thanapiphatSuwanprathep)

---

## 📌 Project Status

Portfolio project — further documentation, testing, and deployment improvements are planned.

---

**SmartDesk AI — Simplifying IT Support with Smarter Workflows.**
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
