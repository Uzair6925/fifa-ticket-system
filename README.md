# 🏆 FIFA World Cup 2026 — Distributed Ticketing Platform

> **Course:** Distributed Database Systems  
> **Institution:** Department of Computer Science (UBIT), University of Karachi  
> **Architecture:** Horizontal Sharding (4 Regional Partitions) + Distributed Mutex Locking (Redis) + Orchestrated Saga Pattern  

---

## 📂 Project Structure & Clean Organization

```
fifa-ticket-backend/ (Root Workspace)
│
├── 📂 fifa-ticket-backend/          # [BACKEND] Node.js, Express & Distributed Sharding Engine
│   ├── 📂 src/
│   │   ├── 📂 config/               # ShardRouter (4 Shards) & Redis Lock Client
│   │   ├── 📂 controllers/          # Auth, Matches, Seats, Bookings & Admin Analytics
│   │   ├── 📂 middleware/           # Validator, JWT Auth Guard & Error Handlers
│   │   ├── 📂 models/               # Sharded Relational Data Models
│   │   └── 📂 routes/               # RESTful API Endpoints
│   ├── 📂 database/                 # SQL Schema definitions for all 4 Shards
│   ├── 📄 generate_millions_fake_users.js # High-speed benchmark (150k+ users/sec)
│   ├── 📄 .env                      # Shard connection & security credentials
│   └── 📄 package.json              # Backend dependencies
│
├── 📂 fifa-ticket-frontend/         # [FRONTEND] Vite + React 19 + Tailwind CSS
│   ├── 📂 src/
│   │   ├── 📂 components/           # Navbar, AuthModal, MatchList, SeatSelector, ShardMonitor
│   │   ├── 📂 services/             # Central API client
│   │   └── 📄 App.jsx               # Main application controller
│   ├── 📄 index.html                # Entry HTML
│   └── 📄 package.json              # Frontend dependencies
│
├── 🚀 RUN_PROJECT.bat               # 1-Click Auto Launcher (Auto-frees ports & launches app)
├── 📄 package.json                  # Root Monorepo Orchestrator (`npm run dev`)
└── 📄 README.md                     # Documentation
```

---

## ⚡ How to Run the Entire System with ONE Command

### 🎯 Method 1: The 1-Click Presentation Launcher (Recommended for Viva)
Double-click **`RUN_PROJECT.bat`** in the root folder.
* Automatically terminates any orphan processes on ports 5000 and 5173 (preventing `EADDRINUSE`).
* Launches Backend and Frontend concurrently.
* Automatically opens your default web browser to **`http://localhost:5000`**.

### 💻 Method 2: Single Command via Terminal
From the root directory (`C:\Users\USER\Documents\fifa-ticket-backend`):
```bash
npm run dev
```
Both Backend (`localhost:5000`) and Frontend (`localhost:5173`) will run together inside the same terminal with color-coded live logs:
* 🟦 **`[BACKEND]`** Port 5000
* 🟨 **`[FRONTEND]`** Port 5173

---

## 🌍 Distributed Database Features

1. **Horizontal Fragmentation (4 Shards):**
   * 🇪🇺 `fifa_europe` (Wembley Stadium, London)
   * 🇦ジア `fifa_asia` (Lusail Iconic Stadium, Qatar)
   * 🇺🇸 `fifa_north_am` (MetLife Stadium, New York)
   * 🇧🇷 `fifa_south_am` (Maracanã Stadium, Rio de Janeiro)
   * **Partitioning Key:** `stadium_region` (Zero cross-shard joins).

2. **Concurrency Control & Seat Locking:**
   * Atomic Redis `SETNX` mutex locks with 10-minute (600s) TTL.
   * Guarantees zero double-booking during flash-sale surges.

3. **Millions Fake Users Benchmark:**
   Run from root or backend:
   ```bash
   node fifa-ticket-backend/generate_millions_fake_users.js 1000000
   ```
   Generates 1,000,000 users distributed horizontally with exactly 25% balance across each regional shard at over 150,000 users/second!
