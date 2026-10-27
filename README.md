# SolarReady — Solar EPC Project Readiness & Delay-Prevention Web App

A modern, high-credibility SaaS web application built for Solar EPC (Engineering, Procurement, and Construction) companies to identify material shortages, coordinate procurement, forecast project schedule impacts, and safeguard delivery dates before installers arrive on site.

Built as an AI Product Management portfolio project showcasing product-market problem framing, deterministic heuristic modeling, and enterprise SaaS UI/UX.

---

## 🌟 Key Product Features

### 1. Solar EPC Project Portfolio Dashboard
- **Executive Summary Cards**: Total active projects, projects at risk, open material shortages, and aggregated critical-path delay days.
- **Dynamic Projects Table**: Displays real-time status (`On track`, `At risk`, `Delayed`, `Completed`), project managers, planned target dates, and projected completion dates.
- **Critical Risk Highlights**: Surfaces the top critical component shortages causing immediate project completion slip.
- **Status Filtering**: Instant filtering by On Track, At Risk, Delayed, or Completed.

### 2. Material Shortage Reporting Engine
- **Field Reporting Form**: Site Engineers and PMs report missing solar components (modules, string inverters, racking clamps, DC UV cable, step-up transformers, etc.).
- **Automatic Shortage Calculation**: `Missing quantity = Quantity required - Quantity available`.
- **Validation**: Strict boundary checks (prevents negative values or reporting when available $\ge$ required).
- **Live Delay Preview**: Calculates the immediate schedule impact while typing.

### 3. Transparent Delay Forecasting Heuristic
- **Transparent Formula**:
  $$\text{Estimated Delay Days} = \max(0, \text{Expected Delivery Days} + \text{Remaining Installation Work Days} - \text{Available Schedule Buffer Days})$$
- **Critical Path Schedule Aggregation**: Prevents double-counting overlapping delays across multiple parts on the same project by evaluating the critical path.
- **Clear Disclaimers**: Clarifies that this deterministic model prevents blind contractor dispatch, while real-world EPC schedules also consider crane schedules, weather, and labor.

### 4. ETA Revision & Audit Log
- **Supplier ETA Updates**: Purchasing agents or PMs adjust expected delivery days as carrier transit updates arrive.
- **Instant Reactive Recalculation**: Immediately updates project risk levels, projected completion dates, and KPI cards across the entire application.
- **Audit History**: Maintains a timestamped history of previous ETAs, new ETAs, author identity, and logged business reasons.

### 5. Material Receipt & Resolution
- **Partial or Full Deliveries**: Record incoming shipments on site; shortages automatically update available inventory and clear project schedule delays when fulfilled.

### 6. In-App Notification Center
- Simulated real-time alerts for delivery ETA pushbacks, newly reported shortages, buffer compression warnings, and resolution confirmations.
- Direct drill-down links to specific projects and shortage items.

### 7. Historical Performance & Benchmarking
- **Recharts Analytics**: Interactive stacked visual breakdown of **Net Execution Days** vs **Shortage Days Lost**.
- **Cohort Comparison Tool**: Direct head-to-head comparison between similar capacity installations (e.g., 250 kW vs 250 kW or 1 MW vs 1 MW).
- **CRUD Operations**: Add, edit, or remove completed historical projects with lessons learned.
- **Clear Methodology**: Factual descriptive comparisons without claiming unproven causality.

### 8. Persistence & Demo Data
- **LocalStorage Persistence**: Full client-side persistence—user modifications, new projects, reported shortages, and ETA changes survive page refreshes.
- **One-Click Reset**: Restore original realistic seed data anytime via the Settings page.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Storage**: React Context + LocalStorage with SSR/prerender safety

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18.x or 20.x+
- npm 9+

### Installation & Run

1. Clone or navigate to the directory:
   ```bash
   cd solarready
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser:
   Navigate to [http://localhost:3000](http://localhost:3000).

5. To create an optimized production build:
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Deploying to Vercel

SolarReady is configured out-of-the-box for seamless Vercel deployment:

### Deploying via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Deploying via GitHub & Vercel Dashboard
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of SolarReady EPC app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com).
3. Click **Add New Project** and select your GitHub repository.
4. If SolarReady is inside a subfolder, specify the Root Directory as `solarready` (or leave as `./` if in root).
5. Framework preset will automatically detect **Next.js**.
6. Click **Deploy**. No environment variables or database setup required!

---

## 📋 Product Metrics Definitions

1. **Total Project Completion Time**: Calendar days elapsed between site mobilization and final grid synchronization/commissioning.
2. **Days Lost to Material Shortages**: Schedule delay days caused directly by installer standby or stoppage due to missing critical BOM components.
3. **Schedule Buffer Compression**: Reduction in project contingency margin as delivery delivery ETAs slip closer to the installation window.
4. **Estimated Delay Days**: Non-overlapping schedule extension past the planned completion target calculated via the critical path shortage.

---

## ⚠️ Portfolio Prototype Disclaimers

- All project names, supplier details, locations, and statistics are fictional demo data created for portfolio demonstration.
- This application uses a transparent deterministic heuristic model rather than an opaque black-box machine learning model.
- Notifications are simulated within the in-app notification center; no external SMS, email, or WhatsApp APIs are required.
