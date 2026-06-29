# Civic Dispatch: Cybernetic Civil Infrastructure Intelligence Network

<p align="center">
  <img src="https://raw.githubusercontent.com/google-gemini/gemini-api-quickstart/main/images/gemini-api.png" alt="Google AI Studio" width="100%" />
</p>

**Civic Dispatch** is a high-fidelity, tactical-style civic reporting application designed to streamline community infrastructure management and bridge the gap between citizens and municipal authorities. Styled after a cybernetic command center interface, it empowers citizens to report local hazards, track response efforts, and leverage advanced intelligence networks to verify and prioritize issues.

---

## 🌐 Live Application URLs

*   **Production Deployment:** [Civic Dispatch Live App](https://community-hero-647485381289.asia-southeast1.run.app)
*   **Sandbox Development URL:** [Civic Dispatch Dev Environment](https://ais-dev-5pu2qv2wlswbpexpqfyqxe-284340187009.asia-southeast1.run.app)

---

## 🛑 The Problem

Modern civic infrastructure management often suffers from **three key bottlenecks**:
1.  **High reporting friction:** Reporting local concerns (like potholes, broken streetlights, or electrical hazards) requires navigating complex government portals or waiting on hold.
2.  **Lack of democratic prioritization:** When everything is treated with equal priority, critical local issues get buried. Authorities struggle to assess which issues are genuinely impacting the most citizens.
3.  **Authentication and spam vulnerabilities:** Open reporting systems suffer from spam and fake reports, while overly restrictive authenticated systems discourage casual citizen participation.

## ⚡ The Solution: Civic Dispatch

Civic Dispatch redefines community engagement through a single, elegant platform that removes compulsory reporting hurdles while retaining absolute security:

*   **Open and Immediate Reporting:** Anyone can upload an infrastructure concern instantly without forced signup. Every report is forwarded straight to municipal databases and queued for dispatch.
*   **Democratic Prioritization via Vouching:** A community-led **Vouching System** allows registered citizens to support active cases. An issue with high vouch counts gains dynamic prioritization metrics, signaling to dispatch teams that immediate attention is required in that area.
*   **Secure Identity Protocol:** Users can seamlessly **Sign Up/Log In** via a stateful, secure ledger backed by **Firebase Firestore**. Once authenticated, citizens are restricted to exactly **one vouch per case**, preventing vote-gaming and ensuring system integrity.
*   **AI-Enhanced Classification:** Powered by the state-of-the-art **Gemini API**, uploaded evidence and metadata are automatically processed, categorized, and structured into official case files.
*   **Geospatial Grounding:** Reports are integrated with real-time geographic queries to provide exact coordination validation, preventing false locations and enabling efficient route dispatch.

---

## 🛠️ The Tech Stack & Architecture

Civic Dispatch is built with a **production-ready full-stack architecture**:

*   **Frontend UI:**
    *   **React (v18+)** with **Vite** as the high-performance build tool.
    *   **Tailwind CSS** utilizing custom-crafted utility layouts and tactical off-white/crimson palettes.
    *   **Lucide-React** and **Google Material Symbols** for precise vector iconography.
    *   **Motion (Framer Motion)** for fluid screen transitions, micro-interactions, and slide-out drawers.
*   **Backend Server:**
    *   **Express.js** running on **Node.js** with **TypeScript** type stripping.
    *   Unified production bundler utilizing **esbuild** to compile `server.ts` to `dist/server.cjs` for high-speed container cold-starts.
*   **Database & Security:**
    *   **Firebase Firestore** for persistent real-time global state (cases, logs, statistics, and user account ledgers).
    *   **Local Memory Fallback** mechanisms ensuring graceful performance even during database reconnections.
    *   **Firestore Security Rules** hardened to allow secure reads and writes for authorized collections.

---

## 🪐 Google Technologies Powering Civic Dispatch

Civic Dispatch leverages the best of Google’s advanced cloud and artificial intelligence systems to offer a next-generation civic experience:

### 1. Google AI Studio & Gemini API
Civic Dispatch incorporates the modern `@google/genai` SDK on the backend to execute server-side analysis of citizen-provided reports. 
*   **Automated Categorization:** The **Gemini** model parses descriptive text and uploaded evidence (images/text) to classify reports instantly into official categories (e.g., *Structural Breakdown*, *Power & Utilities*, *Hazardous Materials*, *Transit & Paving*).
*   **Intelligent Severity Indexing:** The AI calculates emergency indexes and formats raw metadata into cleanly structured dispatch logs.

### 2. Google Maps Platform & Geospatial Grounding
*   **Location Integrity:** Incorporates location data grounding, extracting precise coordinates and checking geographic consistency.
*   **Verified Map References:** Grounded geospatial interfaces generate clickable coordinates and verify municipal sectors instantly.

### 3. Google Cloud Platform (GCP)
*   **Cloud Run:** Deployed as a secure, containerized full-stack application on Cloud Run. It scales dynamically based on local community traffic patterns, minimizing resource usage and latency.
*   **Firestore NoSQL Database:** Handles fast document reads and writes for real-time community dashboards, active incident reports, case logs, and secure user ledgers.

---

## 🎨 Key Features

1.  **Tactical Command Console:** A visually stunning, highly interactive cyberpunk-themed dashboard presenting active incident feeds, live sector metrics, and priority maps.
2.  **New Case Intake:** Streamlined drag-and-drop report filing featuring automatic AI categorizations.
3.  **Priority Vouching:** Immediate dispatch to authorities, with community-sourced prioritization meters that lock in securely once a user signs in.
4.  **Integrated Authentication Portal:** A responsive modal for seamless sign-ups and sign-ins featuring a toggleable **Show/Hide Passphrase** option to enhance on-site usability.
5.  **Dossier & History Logs:** Complete immutable audit logs tracking actions, timestamps, and community vouches.

---

## 🚀 Local Setup & Installation

Follow these steps to get the Civic Dispatch console running on your workstation:

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/civic-dispatch.git
cd civic-dispatch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory based on the provided `.env.example` file:
```env
# Server Secrets (Do not commit to public repositories)
GEMINI_API_KEY=your_google_ai_studio_api_key
```

### 4. Running the Development Server
This boots up the integrated Vite and Express.js dev environment concurrently on port `3000`:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to access the console.

### 5. Production Compilation
Build both frontend static assets and server bundles:
```bash
npm run build
```
And launch the standalone production bundle:
```bash
npm start
```

---

## 📜 License
This project is licensed under the Apache License 2.0. Built for Google AI Studio developers.
