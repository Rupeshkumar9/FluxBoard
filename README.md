# FluxBoard ⚡

> A modern, real-time collaborative Kanban & engineering project management platform built with the MERN stack, Socket.io, and Tailwind CSS.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Overview

**FluxBoard** is a full-stack project management application engineered for high-velocity software, networking, and DevOps teams. It combines an **obsidian dark glassmorphic interface** with **instant WebSocket synchronization**, allowing distributed teams to organize sprints, prioritize backlogs, manage checklists, and conduct technical discussions without page reloads.

---

## ✨ Key Features

### 1. 🔄 Real-Time Collaboration (Socket.io)
* **Zero-Refresh Synchronization**: Board modifications, task movements, column reordering, and discussions sync instantly across all active collaborators in real time.
* **Smart Room Isolation**: Clients join designated WebSocket rooms (`board:<id>`) on mount to ensure private, efficient real-time broadcasting.

### 2. 📋 Interactive Kanban Boards & Workflows
* **Custom Columns**: Dynamically create new workflow columns (`+ Add column`), rename existing columns inline, or remove them with a single click.
* **Column Drag-and-Drop**: Reorder workflow stages horizontally with real-time drag-and-drop feedback and order persistence.
* **Fluid Card Movement**: Drag tasks effortlessly between columns with instant optimistic UI updates and backend reorder synchronization.
* **Board Customization**: Pick custom gradient covers, edit titles/descriptions, and manage board settings from dedicated modals.

### 3. 💬 Contextual Task Discussions
* **Per-Task Discussion Feed**: Technical discussions, debugging notes, and code review feedback live directly inside each task card's detail modal.
* **Instant Submission**: Comments appear immediately without page refreshes, complete with member avatars, author attribution, and date stamps.
* **Live Counter Badges**: Cards on the Kanban board display real-time comment badges (`💬 X`) reflecting active conversation threads.

### 4. ✅ Checklist Tracker with Visual Progress
* **Granular Sub-tasks**: Add checklist items to break down complex tickets into actionable steps.
* **Dynamic Progress Indicator**: Interactive progress bar and completion tracker (`X of Y (Z%)`) updates in real time.
* **Card Face Pill**: Cards display a concise checklist badge (`1/2`) directly on the board canvas.

### 5. 👥 Team & Multi-Assignee Management
* **In-App Collaborator Invites**: Search and invite registered team members by email directly from the board header.
* **Multi-Assignee Selector**: Assign multiple team members to a task with one-click toggles and checkmark confirmation.
* **Avatar Stacks**: Visual assignee avatar chips render directly on the card face and board header.
* **Role Permissions**: Board creators are designated as **Owner** with exclusive management and deletion privileges.

### 6. 🎨 Obsidian Glassmorphism Design & Mobile Responsiveness
* **Deep Obsidian Theme**: Refined dark palette with subtle radial ambient glow, glassmorphic panels, and backdrop blurs.
* **Visual Priority & Color Labels**: Mark tasks with priority badges (`Low`, `Medium`, `High`, `Urgent`) and color swatches for instant scanning.
* **Fully Responsive**: Verified layout that wraps seamlessly and supports touch swiping on mobile devices (e.g. iPhone, Android) as well as wide desktop displays.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
* **Core**: React 19, React Router v7
* **Build Tool**: Vite 6 (featuring ESM hot reloading & fast production bundling)
* **Styling**: Tailwind CSS v4, Plus Jakarta Sans typography, custom glassmorphism utilities
* **Icons**: Lucide React
* **Networking**: Axios (with JWT interceptors & token refresh logic)
* **Real-time Client**: `socket.io-client`

### Backend (`/server`)
* **Runtime**: Node.js & Express.js
* **Database**: MongoDB with Mongoose ODM
* **Real-time Server**: Socket.io (WebSocket engine)
* **Authentication**: JWT (JSON Web Tokens) with dual Access & Refresh token rotation + bcryptjs password hashing
* **CORS & Security**: Configured CORS middleware for local development and production environments

---

## 📂 Project Structure

```text
FluxBoard/
├── client/                     # Frontend Application (React + Vite + Tailwind)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext & global state providers
│   │   ├── pages/              # Main view pages (Dashboard, BoardView, Login, Register)
│   │   ├── services/           # Axios API services & Socket.io client layer
│   │   ├── index.css           # Design tokens, glassmorphism, obsidian palette
│   │   ├── App.jsx             # Router and route guards
│   │   └── main.jsx            # React root entrypoint
│   ├── index.html              # HTML document template
│   ├── vite.config.js          # Vite config with API and WebSocket proxies
│   └── package.json
│
├── server/                     # Backend API & WebSocket Server (Node + Express)
│   ├── config/                 # Database connection (Mongoose)
│   ├── controllers/            # Request handlers (auth, board, column, task)
│   ├── middleware/             # JWT auth validation & error handlers
│   ├── models/                 # Mongoose schemas (User, Board, Column, Task)
│   ├── routes/                 # RESTful API route definitions
│   ├── server.js               # Express & Socket.io server bootstrap
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── .gitignore                  # Monorepo gitignore rules
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: A running local instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/FluxBoard.git
cd FluxBoard
```

---

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Adjust `.env` with your MongoDB connection string and JWT secrets:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/fluxboard
   JWT_SECRET=your_jwt_access_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   CLIENT_URL=http://localhost:5173
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173`.*

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive access + refresh tokens | No |
| `POST` | `/api/auth/refresh` | Obtain a new access token using refresh token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |

### Boards (`/api/boards`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/boards` | Get all boards accessible by the user | Yes |
| `POST` | `/api/boards` | Create a new project board | Yes |
| `GET` | `/api/boards/:id` | Get board details, populated columns, and tasks | Yes |
| `PUT` | `/api/boards/:id` | Update board title, description, or background | Yes |
| `DELETE` | `/api/boards/:id` | Delete board and associated columns/tasks (Owner only) | Yes |
| `POST` | `/api/boards/:id/members` | Invite a collaborator by email | Yes |
| `DELETE` | `/api/boards/:id/members/:userId` | Remove collaborator from board (Owner only) | Yes |

### Columns (`/api/columns`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/boards/:boardId/columns` | Create a new column in board | Yes |
| `PUT` | `/api/columns/:id` | Rename a column | Yes |
| `DELETE` | `/api/columns/:id` | Delete a column and its tasks | Yes |
| `PUT` | `/api/columns/reorder` | Persist new column order array | Yes |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/columns/:columnId/tasks` | Create a new task in a column | Yes |
| `PUT` | `/api/tasks/:id` | Update title, description, priority, assignees, checklist, labels | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a task | Yes |
| `PUT` | `/api/tasks/reorder` | Move tasks between columns or reorder within column | Yes |
| `POST` | `/api/tasks/:id/comments` | Post a discussion comment to a task | Yes |

---

## ⚡ WebSocket Real-Time Events

| Event Name | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `join-board` | Client → Server | `boardId` | Joins private Socket.io room `board:<id>` |
| `leave-board` | Client → Server | `boardId` | Leaves board room |
| `board-updated` | Client ⇄ Server | `boardId` | Broadcasts title, cover, or member changes |
| `column-updated` | Client ⇄ Server | `boardId` | Broadcasts column rename, creation, or reorder |
| `task-updated` | Client ⇄ Server | `boardId` | Broadcasts task moves, checklist changes, or new comments |

---

## 🔒 Security & Best Practices

* **Password Security**: Passwords are salted and hashed using `bcryptjs` before storage.
* **Token Rotation**: Short-lived JWT access tokens paired with secure refresh tokens prevent session hijacking.
* **Input Sanitization & Schema Validation**: Strict Mongoose schema constraints validate inputs before persisting to MongoDB.
* **Secret Protection**: Comprehensive `.gitignore` guards all environment files (`.env`), credentials, build directories, and logs from Git commits.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
