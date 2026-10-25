# FIFA World Cup 2026 - Official Ticketing Platform

A distributed ticketing and seat reservation platform engineered for high-concurrency tournament operations across four regional zones (Europe, Asia, North America, and South America).

---

## Project Structure

```text
fifa-ticket-system/
├── fifa-ticket-backend/          # Node.js & Express API Server
│   ├── src/
│   │   ├── config/               # Regional database routing & reservation locking
│   │   ├── controllers/          # Request handlers (Auth, Matches, Seats, Bookings, Admin)
│   │   ├── middleware/           # Input validation, JWT guard, error handling
│   │   ├── models/               # Data access models
│   │   └── routes/               # REST API route definitions
│   ├── database/                 # SQL schema scripts for regional nodes
│   ├── generate_millions_fake_users.js
│   ├── test_5m_traffic.js
│   └── package.json
│
├── fifa-ticket-frontend/         # React + Vite Web Application
│   ├── src/
│   │   ├── components/           # UI components (Navbar, MatchList, SeatSelectorModal, etc.)
│   │   ├── services/             # API client
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
├── RUN_PROJECT.bat               # Windows local startup script
├── render.yaml                   # Render cloud deployment configuration
├── package.json                  # Root workspace scripts
└── README.md
```

---

## Running Locally

### Option 1: Windows Startup Script
Double-click `RUN_PROJECT.bat` in the root folder. It frees ports `5000` and `5173`, starts both backend and frontend services, and opens `http://localhost:5000`.

### Option 2: Terminal
From the root directory, run:

```bash
npm run dev
```

To build the production frontend bundle and run the unified server on port `5000`:

```bash
npm run build
npm start
```

---

## Cloud Deployment (Render)

1. Push the repository root (`fifa-ticket-system`) to GitHub.
2. Create a new **Web Service** on Render connected to the repository.
3. Configure the service settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. Set the following Environment Variables:
   - `NODE_ENV` = `production`
   - `USE_FAKE_DB` = `true`
   - `JWT_SECRET` = `fifa_world_cup_2026_secret_key`
   - `RATE_LIMIT_MAX_REQUESTS` = `50000`

---

## High-Volume Traffic & Concurrency Testing (5,000,000 Load)

### Web Dashboard
Open the application, navigate to **Operations & Traffic**, and click **Run 5,000,000 Traffic Load Test** to execute a 5-million traffic distribution test and verify concurrent seat reservation protection.

### Command Line Stress Suite
Run against a local or remote deployment URL:

```bash
node fifa-ticket-backend/test_5m_traffic.js http://localhost:5000
```
