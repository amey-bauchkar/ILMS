# 🚀 Foremark CRM (Internal Lead Management System)

Welcome to the **Foremark CRM** project repository. This is an internal lead management tool designed exclusively for the Foremark Technologies team. 

## 📖 Overview
Currently, Foremark manages inbound leads and outreach informally (chats, memory, scattered notes). As the team grows, this creates a risk of missed follow-ups, lost context, and lack of visibility. 

This CRM centralizes lead capturing, tracking, and pipeline management. It is designed to be **simple, fast, and genuinely useful**, with every action taking under 10 seconds.

## 🛠️ Tech Stack & Architecture
- **Framework:** Next.js (React) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons & Visualization:** `lucide-react` & `recharts`
- **Forms:** React Hook Form + Zod validation
- **Design System:** Deep Dark (`#0d0d0d` background) with Foremark Orange (`#e87811`) accents.

## 👨‍💻 Frontend Team MVP Workflow
The Phase 1 (MVP) of this CRM is being built rapidly by the frontend team using heavily typed **Mock Data**. This allows parallel development while the backend is being configured.

### Team Focus Areas:
- **Amey:** Project foundation, Next.js architecture, `shadcn/ui` setup, mock data schema, Auth UI, Saved Views, and Settings.
- **Tanmay:** Complex UI components including the Recharts-powered Analytics Dashboard, the Optimistic Call Logging Modal, and the Visual Status Pipeline.
- **Janhavi:** Data-heavy views including the primary Leads Data Table, the Lead Detail view with Activity Timeline, and all strict Zod-validated Forms.

## 🚀 Getting Started
```bash
cd frontend
npm install
npm run dev
```

The application will start on `http://localhost:3000`.

## 📦 Mock Data & Types
The `src/lib/mock-data.ts` file acts as the single source of truth for the frontend team. It rigidly adheres to the BRD requirements, providing type-safe definitions for `Lead`, `TeamMember`, `Activity`, and `DashboardStats`.

## 🔒 Phase 2 Integration
In the next phase, the mock data layer will be replaced with real data fetched from a Supabase PostgreSQL backend with Row Level Security (RLS) and strict authenticated endpoints.
