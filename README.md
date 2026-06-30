# PROJECT SUBMISSION DOSSIER: CIVIC DISPATCH

**Project Title:** Civic Dispatch: Cybernetic Civil Infrastructure Intelligence Network  
**Deployed Production Link:** [https://community-hero-647485381289.asia-southeast1.run.app](https://community-hero-647485381289.asia-southeast1.run.app)  
**Sandbox Development Link:** [https://ais-dev-5pu2qv2wlswbpexpqfyqxe-284340187009.asia-southeast1.run.app](https://ais-dev-5pu2qv2wlswbpexpqfyqxe-284340187009.asia-southeast1.run.app)  

---

## 1. Problem Statement Selected

### The Challenge of Civic Reporting and Municipal Prioritization
Modern cities suffer from structural bottlenecks that slow down community civic management, leaving critical issues unaddressed:

1. **High Friction & Barrier to Entry:** Traditional municipal reporting interfaces are slow, over-engineered, and force citizens to go through extensive registration procedures before submitting minor reports (such as potholes, broken traffic signals, or localized power outages). This discourages public engagement.
2. **Lack of Democratic Prioritization:** Municipal dispatchers are inundated with unstructured, unprioritized tickets. There is no simple way to gauge how many local citizens are actively affected by a particular hazard, leading to arbitrary scheduling rather than democratic, impact-driven task queues.
3. **Authentication & Spam Trade-offs:** Open reporting systems that skip registration suffer from spam, fake logs, and location spoofing. Conversely, overly restrictive login systems keep valuable crowdsourced data locked away.
4. **Unstructured Data Ingestion:** Citizens submit reports with varying levels of detail, confusing descriptions, or incorrect categorization. Municipal dispatchers must spend precious time manually reading, sorting, and identifying the exact severity of incoming requests.

---

## 2. Solution Overview

### Civic Dispatch: Tactical Citizen Incident Console
**Civic Dispatch** is a high-fidelity, military-command-style citizen reporting application designed to completely eliminate these bottlenecks while keeping the system secure and democratic. It strikes a perfect balance between speed and authenticity:

* **Frictionless Case Intake:** Anyone can upload an infrastructure concern instantly in a few clicks without forcing signup. Every incident report is parsed, automatically categorized on the backend, and written to a secure municipal database for dispatch.
* **Democratic Prioritization via Community Vouching:** To determine task priority without complex bureaucracy, Civic Dispatch features an integrated community **Vouching System**. Active cases can be "vouched for" by registered citizens, increasing their prioritisation rank and flagging them on dispatcher dashboards.
* **Identity Protocol with Anti-Spam Safeguards:** To protect the system against gaming or vote-rigging, users can sign up or log in via a secure local database ledger. Once authenticated, a user's unique identity is tied to their vouches. The system enforces a strict **one vouch per case per user** policy, preventing vote-inflation.
* **AI-Powered Diagnostics:** Using the modern Gemini API on the server, incoming raw text and evidence are analyzed dynamically. The system automatically categorizes the issue, scores its potential severity index, and structures the data into professional digital dossiers.

---

## 3. Key Features

* **Tactical Command Center Dashboard:** An immersive, high-contrast user interface displaying active municipal feeds, live sector metrics, real-time ticket statuses, and priority coordinate listings.
* **Seamless intake wizard:** Supports quick hazard reports featuring automatic server-side AI parsing and severity classification.
* **Dossier & History Logs:** Every report generates a pristine digital dossier with a chronological log of events, status upgrades, and community-verified viles. Users can download complete PDF dossiers using built-in high-fidelity exports.
* **Integrated Authentication Modal:** A responsive custom-designed modal for signup and sign-in. It includes a toggleable **Show/Hide Passphrase** option to enhance on-site accessibility and credentials verification.
* **Secure Community Vouching:** Allows verified citizens to highlight critical infrastructure issues, instantly creating an active community-driven prioritization map for dispatchers.

---

## 4. Technologies Used

* **Frontend UI Framework:** React (v18+) powered by Vite.
* **Styling & Layout:** Tailwind CSS using full-screen custom-designed responsive grids and tactical off-white/crimson palettes.
* **Motion & Transitions:** Framer Motion for highly detailed screen transitions and slide-out dashboard drawers.
* **Icons:** Google Material Symbols and Lucide-React vector graphics.
* **Document Generation:** `jspdf` for high-fidelity client-side PDF downloads.
* **Backend Runtime:** Express.js running on Node.js with TypeScript support.
* **Production Build Bundler:** `esbuild` for bundling TypeScript files into a single optimized CommonJS backend executable, maximizing cold-start container performance.

---

## 5. Google Technologies Utilized

Civic Dispatch is built from the ground up to integrate Google’s industry-leading cloud and artificial intelligence infrastructure:

### 🚀 Google AI Studio & Gemini API
The backend incorporates the official `@google/genai` SDK on the server, ensuring your Gemini API keys remain completely safe and hidden from the browser.
* **Structured AI Outputs:** The app utilizes Gemini models to analyze community reports, automatically extracting structure (JSON) for classification, estimating incident severity (Low, Medium, High, Critical), and generating descriptive dispatch logs.
* **Intelligent Summarization:** Raw citizen text is converted into concise municipal-grade titles and descriptions.

### 🗄️ Google Firebase (Firestore Database)
* **Real-Time Synchronized State:** Uses Cloud Firestore to handle real-time active incident logs, user accounts, and status feeds.
* **Hardened Security Rules:** Configured with robust Firestore rules that ensure secure database access and complete protection of user collection records.

### 🌐 Google Cloud Platform (GCP)
* **Cloud Run Containers:** The entire full-stack application (Vite assets + Express server) is containerized and hosted on Google Cloud Run, offering seamless autoscaling, low latency, and production-grade stability.
