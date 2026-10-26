"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  ShoppingCart,
  Rocket,
  Zap,
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EnrichedLead } from "@/hooks/use-data";

// -------------------------------------------------------------
// Data Types
// -------------------------------------------------------------

export interface DailyActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  activity: string;
  hours: number;
  status: "Completed" | "In Progress" | "In Review" | "Blocker";
  loggedBy: string;
  nextStep?: string;
  createdAt: string;
}

export interface MilestoneStep {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  assignee?: string;
  notes?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  weight: number; // percentage weight
  description?: string;
  steps?: MilestoneStep[];
}

export interface ProjectTrackerData {
  leadId: string;
  projectName: string;
  projectType?: string;
  websitePreset?: string;
  status: "Planning" | "In Progress" | "On Track" | "At Risk" | "Completed";
  progressPercent: number; // 0 - 100
  kickoffDate: string;
  targetDeliveryDate: string;
  projectManager: string;
  budget?: number;
  notes: string;
  milestones: ProjectMilestone[];
  dailyLogs: DailyActivityLog[];
  lastUpdated: string;
}

// -------------------------------------------------------------
// 1-Click Website Project Presets & Templates
// -------------------------------------------------------------

export interface WebsitePreset {
  id: string;
  label: string;
  description: string;
  projectNameSuffix: string;
  milestones: {
    title: string;
    description: string;
    weight: number;
    targetDaysFromNow: number;
    steps?: { title: string; notes?: string }[];
  }[];
}

export const WEBSITE_PRESETS: Record<string, WebsitePreset> = {
  corporate: {
    id: "corporate",
    label: "Corporate Website",
    description: "5-page responsive corporate website with custom domain, SSL, contact forms, lead alerts, WhatsApp chat, and Google SEO setup.",
    projectNameSuffix: "Corporate Website Project",
    milestones: [
      {
        title: "1. Domain, Brand Assets & Sitemap Structure",
        description: "Connect custom domain DNS, setup SSL security, gather client brand guidelines/logo, and finalize 5-page responsive sitemap.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Website Copywriting & Media Assets Finalized",
        description: "Headline copy, value proposition messaging, and curated high-resolution WebP imagery and icons.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Frontend Development & Lead Capture Integration",
        description: "Pixel-perfect responsive pages, interactive lead capture form with instant email alerts, and floating WhatsApp contact button.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. SEO Optimization, Speed & Mobile QA Audit",
        description: "Technical on-page SEO, meta tags, Google Analytics 4 tracking, 90+ mobile PageSpeed performance, and cross-browser QA.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Go-Live Production Launch & Client Handover",
        description: "Live DNS propagation, live contact form submission verification, CMS client walkthrough, and warranty support handover.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  ecommerce: {
    id: "ecommerce",
    label: "E-Commerce Store",
    description: "Full e-commerce online store with product catalog, cart drawer, Razorpay/Stripe checkout, order confirmation automation, and invoicing.",
    projectNameSuffix: "E-Commerce Store Project",
    milestones: [
      {
        title: "1. Store Setup, Domain & Brand Identity",
        description: "Hosting setup, secure SSL, currency/tax configuration, and homepage announcement banner.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Product Catalog, Inventory & Categories Upload",
        description: "Product variants, pricing, inventory stock counts, SKU mapping, and photography.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Cart, Checkout & Payment Gateway Integration",
        description: "1-page fast checkout, Razorpay / Stripe gateway, automated email invoices, and coupon codes.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Shipping Rules, Tax & Order Notification Tests",
        description: "Shiprocket / courier integration, live test transactions, order confirmation SMS, and abandoned cart recovery.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Store Go-Live, Meta Pixel & Client Admin Handover",
        description: "Live domain switch, Meta Pixel purchase events, Google Tag Manager verification, and admin store training.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  landing: {
    id: "landing",
    label: "Landing Page",
    description: "High-converting single-page landing page optimized for paid ads and lead generation with interactive forms and pixel tracking.",
    projectNameSuffix: "High-Converting Landing Page",
    milestones: [
      {
        title: "1. Offer Strategy & High-Converting Wireframe",
        description: "Target audience hook, core value proposition, irresistible offer breakdown, and mobile-first visual hierarchy.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. High-Impact Visual Design & Copywriting",
        description: "Persuasive sales copywriting, custom 3D/vector graphics, client video testimonials, trust badges, and hero imagery.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Interactive Lead Form & CRM Integration",
        description: "Multi-step interactive lead capture form, instant webhook to Foremark CRM, email notifications, and direct WhatsApp chat.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Tracking Pixels, Speed & A/B Test Readiness",
        description: "Google Tag Manager, GA4 conversion tracking, Meta Pixel, Core Web Vitals optimization, and privacy/terms pages.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Campaign Go-Live & Traffic Readiness",
        description: "Custom subdomain pointing, live test lead submission, notification check, and ad campaign traffic launch.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio / Agency",
    description: "Portfolio and creative agency showcase with dynamic case study grids, project detail sliders, client logos, and inquiry booking.",
    projectNameSuffix: "Agency Portfolio Project",
    milestones: [
      {
        title: "1. Creative Direction, Brand Identity & Sitemap",
        description: "Creative direction, typography hierarchy, dark/light palette, and case study categories.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Case Studies, Media Gallery & Project Showcases",
        description: "Client case studies, before/after sliders, video embeds, client reviews, and metrics.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Inquiry Questionnaire & Booking Flow",
        description: "Interactive client inquiry intake questionnaire, budget select dropdown, and Calendly booking embed.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Motion Design, Mobile Responsiveness & SEO",
        description: "Micro-interactions, smooth scrolling, image optimization for retina screens, and meta tags.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Production Launch & Final Project Handover",
        description: "Production launch, delivery of design files and media kit, and final sign-off.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  saas: {
    id: "saas",
    label: "SaaS Product",
    description: "SaaS product marketing site with interactive feature tours, tiered pricing plans, free trial sign-up, and product docs.",
    projectNameSuffix: "SaaS Product Website",
    milestones: [
      {
        title: "1. Messaging, Feature Matrix & User Journey",
        description: "Value proposition, product screenshots, tiered pricing plans, and competitor comparison table.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Interactive Product Tour & UI Layout",
        description: "Interactive feature walkthrough tabs, customer logo wall, and security badges.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Free Trial & Demo Booking Integrations",
        description: "App sign-up redirects, enterprise demo booking calendar, live chat widget, and changelog.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Technical SEO, Analytics & Compliance",
        description: "SoftwareApplication schema, product event tracking, cookie consent banner, and CDN edge caching.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Product Launch & Marketing Handover",
        description: "Live domain propagation, test sign-up funnel verification, marketing team handover, and launch announcement.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  blog: {
    id: "blog",
    label: "Blog / Editorial",
    description: "Content and editorial publishing platform with article categories, author profiles, SEO schema, newsletter capture, and ad spaces.",
    projectNameSuffix: "Blog & Editorial Platform",
    milestones: [
      {
        title: "1. Content Architecture & Editorial Taxonomy",
        description: "Content categories, tag hierarchy, author bio guidelines, and editorial guidelines.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Article Layout & Typography Styling",
        description: "Editorial reading experience, mobile typography, social sharing, and featured image formatting.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. CMS Publishing Engine & Newsletter Integration",
        description: "Rich text editor, scheduled publishing, media library, and subscriber capture.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. On-Page SEO, Speed & Ad Placements",
        description: "Article JSON-LD schema, Google Publisher tags, RSS feeds, and 95+ mobile PageSpeed pass.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Production Launch & Google News Sitemap",
        description: "Custom domain propagation, Google News sitemap submission, editorial team training, and handover.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  webapp: {
    id: "webapp",
    label: "Web Application",
    description: "Custom web app or client portal with user authentication, dashboard analytics, database integration, and role permissions.",
    projectNameSuffix: "Web Application",
    milestones: [
      {
        title: "1. System Architecture, Schema & UI Wireframes",
        description: "Database models, API specifications, user journeys, and component wireframes.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Authentication, Roles & Security Permissions",
        description: "User sign-up, session auth, password reset, and role-based access control.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Core Dashboard UI & Interactive Workflows",
        description: "Data tables, interactive CRUD workflows, analytics widgets, and notifications.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. API Integrations, Webhooks & Database Sync",
        description: "Third-party API connections, background worker jobs, and automated webhook handling.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. End-to-End QA, Production Deployment & Handover",
        description: "Stress testing, security audit, production deployment on cloud infrastructure, and documentation.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace / Directory",
    description: "Multi-vendor marketplace or directory platform with listings management, search filters, vendor storefronts, and reviews.",
    projectNameSuffix: "Marketplace Platform",
    milestones: [
      {
        title: "1. Marketplace Taxonomy & User Roles Architecture",
        description: "Buyer/seller user journeys, category taxonomies, listing attributes, and wireframes.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Vendor Onboarding & Listings Management",
        description: "Vendor registration, KYC/verification, product/service listing submission, and moderation queue.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Advanced Search, Filtering & Booking Flow",
        description: "Faceted search, geo-location filters, booking calendar, and inquiry messaging.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Escrow / Payment Flow & Review System",
        description: "Payment gateway split payout, transaction fees, buyer protection, and verified reviews.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Production Launch, SSL & Legal Compliance",
        description: "Live launch on production domain, terms of service, marketplace escrow testing, and handover.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  lms: {
    id: "lms",
    label: "LMS / Educational",
    description: "Online learning academy with video lesson player, course modules, student progress tracking, quizzes, and certificates.",
    projectNameSuffix: "Online Course Platform",
    milestones: [
      {
        title: "1. Course Curriculum Structure & Student Journey",
        description: "Lesson module hierarchies, learning outcomes, instructor profiles, and wireframes.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Video Player, Lesson Viewer & Course Content",
        description: "Secure video streaming, downloadable resource attachments, and transcript display.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Student Dashboard, Progress Tracker & Quizzes",
        description: "Interactive quizzes, completion trackers, student notes, and discussion forums.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Payment Gateways, Subscription & Paywalls",
        description: "One-off course purchase, membership subscriptions, coupon codes, and invoices.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Platform Go-Live, Certificate Engine & QA",
        description: "Automated PDF certificate generation, live payment tests, instructor walkthrough, and handover.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  },
  nonprofit: {
    id: "nonprofit",
    label: "Non-Profit / Event",
    description: "Mission-driven non-profit or event website with donation gateway, impact storytelling, event ticket registration, and volunteer sign-ups.",
    projectNameSuffix: "Non-Profit & Event Site",
    milestones: [
      {
        title: "1. Brand Assets, Mission Storytelling & Sitemap",
        description: "Cause narrative, impact statistics, brand guidelines, and responsive site structure.",
        weight: 20,
        targetDaysFromNow: -1
      },
      {
        title: "2. Donation Processing & Recurring Giving Setup",
        description: "Secure one-time and monthly donation processing, 80G/tax receipts, and donor tracking.",
        weight: 20,
        targetDaysFromNow: 0
      },
      {
        title: "3. Event Schedule, Speaker Lineup & RSVP Flow",
        description: "Interactive agenda, speaker cards, venue map, and QR code ticket registration.",
        weight: 20,
        targetDaysFromNow: 7
      },
      {
        title: "4. Transparency Reports & Volunteer Signup",
        description: "Annual reports download, photo gallery, volunteer onboarding form, and sponsor logos.",
        weight: 20,
        targetDaysFromNow: 18
      },
      {
        title: "5. Live Launch, Campaign Tracking & Handover",
        description: "Domain propagation, donation webhook testing, social sharing meta tags, and handover.",
        weight: 20,
        targetDaysFromNow: 30
      }
    ]
  }
};

export const COMMON_PHASE_SUGGESTIONS = [
  "Scope & Wireframing",
  "UI/UX Design",
  "Core Development",
  "API & Integrations",
  "Testing & QA",
  "Go-Live Launch",
  "Post-Launch Support"
];

const STORAGE_PREFIX = "foremark_project_tracker_";

export function buildMilestonesFromPreset(presetId: string, lead: EnrichedLead, preserveInitialCompleted = true): ProjectMilestone[] {
  const preset = WEBSITE_PRESETS[presetId] || WEBSITE_PRESETS.corporate;
  const now = Date.now();

  return preset.milestones.map((m, idx) => {
    const targetDateObj = new Date(now + m.targetDaysFromNow * 86400000);
    const targetDateStr = targetDateObj.toISOString().slice(0, 10);
    const isCompleted = preserveInitialCompleted ? m.targetDaysFromNow <= 0 : false;

    return {
      id: `m-${idx + 1}-${preset.id}`,
      title: m.title,
      targetDate: targetDateStr,
      completed: isCompleted,
      completedAt: isCompleted ? targetDateStr : undefined,
      weight: m.weight,
      description: m.description,
      steps: (m.steps || []).map((s, sIdx) => ({
        id: `step-${idx + 1}-${sIdx + 1}-${preset.id}`,
        title: s.title,
        completed: isCompleted,
        completedAt: isCompleted ? targetDateStr : undefined,
        notes: s.notes || ""
      }))
    };
  });
}

export function getDefaultStepsForMilestone(title: string, parentCompleted: boolean): MilestoneStep[] {
  const t = title.toLowerCase();
  let baseSteps: { title: string; notes?: string }[] = [];

  if (t.includes("domain") || t.includes("brand") || t.includes("kickoff") || t.includes("sitemap")) {
    baseSteps = [
      { title: "Configure custom domain & SSL certificate on production hosting", notes: "Domain DNS & SSL active" },
      { title: "Collect client brand assets (vector logo, color palette & typography)", notes: "Brand guidelines confirmed" },
      { title: "Finalize 5-page sitemap & desktop/mobile layout wireframes", notes: "Sitemap approved by client" },
      { title: "Client design approval & stakeholder sign-off", notes: "Wireframes approved" }
    ];
  } else if (t.includes("copywriting") || t.includes("content") || t.includes("media") || t.includes("catalog")) {
    baseSteps = [
      { title: "Draft headline copy, service blurbs & call-to-action text", notes: "All page copy completed" },
      { title: "Source optimized WebP images, icons & client team photos", notes: "Media assets compressed & optimized" },
      { title: "Review copy & layout structure with client", notes: "Client feedback incorporated" },
      { title: "Sign-off on all page copy & content deliverables", notes: "Content sign-off secured" }
    ];
  } else if (t.includes("frontend") || t.includes("development") || t.includes("cart") || t.includes("lead")) {
    baseSteps = [
      { title: "Develop responsive pages: Home, About, Services & Case Studies", notes: "Desktop & mobile responsive layouts" },
      { title: "Implement interactive Contact Form with instant email alerts", notes: "Instant sales notification verified" },
      { title: "Integrate floating WhatsApp & Click-to-Call CTAs", notes: "WhatsApp direct chat connected" },
      { title: "Setup FAQ accordion, testimonial carousel & Google Map embed", notes: "Interactive components active" }
    ];
  } else if (t.includes("seo") || t.includes("speed") || t.includes("audit") || t.includes("tracking")) {
    baseSteps = [
      { title: "Configure meta titles, descriptions, OpenGraph tags & favicon", notes: "SEO meta tags completed" },
      { title: "Connect Google Search Console & submit XML sitemap", notes: "GSC verified & indexed" },
      { title: "Optimize image compression & caching for sub-2s load time", notes: "Core Web Vitals passed" },
      { title: "Cross-device testing on Chrome, Safari, iOS & Android", notes: "Multi-device QA verified" }
    ];
  } else if (t.includes("launch") || t.includes("go-live") || t.includes("delivery") || t.includes("handover")) {
    baseSteps = [
      { title: "Point live domain to production & verify SSL status", notes: "Live on custom domain" },
      { title: "Test live contact form submission and deliverability", notes: "Form test verified" },
      { title: "Conduct CMS walkthrough & record client training video", notes: "Training video delivered to client" },
      { title: "Formal project completion sign-off & client review request", notes: "Project closure completed" }
    ];
  } else {
    baseSteps = [
      { title: "Review website deliverables with client stakeholders", notes: "Deliverables approved" },
      { title: "Execute quality checklist and responsive verification", notes: "Quality pass completed" },
      { title: "Secure client approval & record progress sign-off", notes: "Client milestone sign-off" }
    ];
  }

  return baseSteps.map((s, idx) => ({
    id: `step-${idx + 1}-${Math.random().toString(36).slice(2, 7)}`,
    title: s.title,
    completed: parentCompleted,
    completedAt: parentCompleted ? new Date().toISOString().slice(0, 10) : undefined,
    notes: s.notes || ""
  }));
}

function getDefaultTrackerData(lead: EnrichedLead): ProjectTrackerData {
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const manager = lead.owner?.name && lead.owner.name !== "Unassigned" 
    ? lead.owner.name 
    : "Project Manager";

  // Default to Corporate Website in 1 click
  const defaultMilestones = buildMilestonesFromPreset("corporate", lead, true);

  // Daily project updates
  const defaultLogs: DailyActivityLog[] = [
    {
      id: "log-1",
      date: yesterdayStr,
      activity: "Deal marked Won. Corporate Website project initialized. Domain, SSL & initial sitemap finalized.",
      hours: 2.5,
      status: "Completed",
      loggedBy: manager,
      nextStep: "Execute frontend UI build and lead capture form",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "log-2",
      date: today,
      activity: "Website development in progress. Copywriting and interactive components reviewed with client.",
      hours: 4.0,
      status: "Completed",
      loggedBy: manager,
      nextStep: "Connect WhatsApp CTAs & submit XML sitemap to Google",
      createdAt: new Date().toISOString()
    }
  ];

  const initialType = (lead as any).service || "Corporate Website";

  return {
    leadId: lead.id,
    projectName: lead.company ? `${lead.company} - ${initialType}` : `${lead.name} - ${initialType}`,
    projectType: initialType,
    websitePreset: "corporate",
    status: "On Track",
    progressPercent: 40, // 2 out of 5 milestones done
    kickoffDate: yesterdayStr,
    targetDeliveryDate: targetDateStr,
    projectManager: manager,
    budget: lead.dealValue || 50000,
    notes: "Active website project delivery tracker running on localhost storage.",
    milestones: defaultMilestones,
    dailyLogs: defaultLogs,
    lastUpdated: new Date().toISOString()
  };
}

export function loadTracker(lead: EnrichedLead): ProjectTrackerData {
  if (typeof window === "undefined") {
    return getDefaultTrackerData(lead);
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${lead.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.leadId === lead.id) {
        // Upgrade legacy generic sprint trackers to 1-Click Website preset automatically
        const hasLegacySprints = parsed.milestones?.some((m: any) =>
          m.steps?.some((s: any) => s.title?.toLowerCase().includes("sprint")) ||
          m.title?.toLowerCase().includes("phase 1: core project")
        );

        const projectType = parsed.projectType || (lead as any).service || "Corporate Website";

        if (hasLegacySprints || !Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
          const freshMilestones = buildMilestonesFromPreset("corporate", lead, true);
          parsed.milestones = freshMilestones;
          parsed.projectType = projectType;
          parsed.websitePreset = "corporate";
          parsed.projectName = lead.company ? `${lead.company} - ${projectType}` : `${lead.name} - ${projectType}`;
          parsed.progressPercent = 40;
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${lead.id}`, JSON.stringify(parsed));
          } catch {}
          return parsed;
        }

        parsed.projectType = projectType;
        parsed.websitePreset = parsed.websitePreset || "corporate";
        if (!Array.isArray(parsed.dailyLogs)) {
          parsed.dailyLogs = [];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load local project tracker data:", e);
  }
  const defaultData = getDefaultTrackerData(lead);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${lead.id}`, JSON.stringify(defaultData));
  } catch {}
  return defaultData;
}

export function saveTracker(data: ProjectTrackerData): void {
  if (typeof window === "undefined") return;
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(`${STORAGE_PREFIX}${data.leadId}`, JSON.stringify(data));
    // Dispatch asynchronously to prevent cross-component setState during render warnings
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("foremark_tracker_saved", { detail: data }));
    }, 0);
  } catch (e) {
    console.error("Failed to save local project tracker data:", e);
  }
}

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------

interface WonProjectTrackerProps {
  lead: EnrichedLead;
  className?: string;
}

export function WonProjectTracker({ lead, className }: WonProjectTrackerProps) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ProjectTrackerData>(() => loadTracker(lead));
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // New Daily Log Form State
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newActivity, setNewActivity] = useState("");
  const [newHours, setNewHours] = useState("3.5");
  const [newStatus, setNewStatus] = useState<DailyActivityLog["status"]>("Completed");
  const [newLoggedBy, setNewLoggedBy] = useState(data.projectManager || "Admin");
  const [newNextStep, setNewNextStep] = useState("");

  // New Milestone Form State
  const [newMilestonePhase, setNewMilestonePhase] = useState("next");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  // Re-read storage on client mount or if lead id changes
  useEffect(() => {
    setMounted(true);
    setData(loadTracker(lead));
  }, [lead.id]);

  // Persist helper
  const updateData = (updater: (prev: ProjectTrackerData) => ProjectTrackerData) => {
    setData((prev) => {
      const updated = updater(prev);
      queueMicrotask(() => {
        saveTracker(updated);
      });
      return updated;
    });
  };

  // 1-Click Make Website Preset Application
  const handleApplyWebsitePreset = (presetId: string) => {
    const preset = WEBSITE_PRESETS[presetId] || WEBSITE_PRESETS.corporate;
    const newMilestones = buildMilestonesFromPreset(presetId, lead, true);

    const totalWeight = newMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
    const completedWeight = newMilestones.reduce((acc, m) => acc + (m.completed ? m.weight || 0 : 0), 0);
    const calculatedPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 40;

    const todayStr = new Date().toISOString().slice(0, 10);
    const newLog: DailyActivityLog = {
      id: `log-${Date.now()}`,
      date: todayStr,
      activity: `Applied "${preset.label}" website template. Deliverables roadmap & scope configured.`,
      hours: 3.5,
      status: "Completed",
      loggedBy: data.projectManager || "Admin",
      nextStep: `Execute Phase: ${newMilestones.find((m) => !m.completed)?.title || "Final Handover"}`,
      createdAt: new Date().toISOString()
    };

    updateData((prev) => ({
      ...prev,
      projectType: preset.label,
      websitePreset: presetId as any,
      projectName: lead.company ? `${lead.company} - ${preset.projectNameSuffix}` : `${lead.name} - ${preset.projectNameSuffix}`,
      milestones: newMilestones,
      progressPercent: calculatedPct,
      status: calculatedPct === 100 ? "Completed" : "On Track",
      dailyLogs: [newLog, ...prev.dailyLogs]
    }));

    toast.success(`Applied "${preset.label}" website preset`);
  };

  // Update Project Type directly (allows writing custom project type)
  const handleUpdateProjectType = (newType: string) => {
    updateData((prev) => ({
      ...prev,
      projectType: newType,
      projectName: lead.company ? `${lead.company} - ${newType}` : `${lead.name} - ${newType}`
    }));
  };

  // 1. Progress Management: Adjust percent directly
  const handleProgressChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newPct)));
    updateData((prev) => ({
      ...prev,
      progressPercent: clamped,
      status: clamped === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
    }));
    toast.success(`Work completed updated to ${clamped}%`);
  };

  // 2. Toggle Milestone completion & automatically sync sub-steps & progress
  const handleToggleMilestone = (milestoneId: string) => {
    updateData((prev) => {
      const newMilestones = prev.milestones.map((m) => {
        if (m.id === milestoneId) {
          const nextCompleted = !m.completed;
          const updatedSteps = (m.steps || []).map((s) => ({
            ...s,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString().slice(0, 10) : undefined
          }));
          return {
            ...m,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString().slice(0, 10) : undefined,
            steps: updatedSteps
          };
        }
        return m;
      });

      // Recalculate progress based on milestone weights
      const totalWeight = newMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
      const completedWeight = newMilestones.reduce((acc, m) => acc + (m.completed ? m.weight || 0 : 0), 0);
      const calculatedPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : prev.progressPercent;

      return {
        ...prev,
        milestones: newMilestones,
        progressPercent: calculatedPct,
        status: calculatedPct === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
      };
    });
  };

  // 3. Add Milestone Phase
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) {
      toast.error("Please enter milestone title");
      return;
    }
    const newId = `m-${Date.now()}`;
    const newM: ProjectMilestone = {
      id: newId,
      title: newMilestoneTitle.trim(),
      targetDate: newMilestoneDate,
      completed: false,
      weight: 20,
      description: "",
      steps: getDefaultStepsForMilestone(newMilestoneTitle.trim(), false)
    };

    updateData((prev) => {
      let updatedMilestones: ProjectMilestone[];
      if (newMilestonePhase === "next" || isNaN(Number(newMilestonePhase))) {
        updatedMilestones = [...prev.milestones, newM];
      } else {
        const insertIdx = Math.max(0, Math.min(prev.milestones.length, Number(newMilestonePhase)));
        updatedMilestones = [
          ...prev.milestones.slice(0, insertIdx),
          newM,
          ...prev.milestones.slice(insertIdx)
        ];
      }

      const totalWeight = updatedMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
      const completedWeight = updatedMilestones.reduce((acc, m) => acc + (m.completed ? m.weight || 0 : 0), 0);
      const calculatedPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : prev.progressPercent;

      return {
        ...prev,
        milestones: updatedMilestones,
        progressPercent: calculatedPct,
        status: calculatedPct === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
      };
    });

    setNewMilestoneTitle("");
    setNewMilestonePhase("next");
    setShowAddMilestone(false);
    toast.success("New project milestone phase added!");
  };

  // Delete Milestone Phase
  const handleDeleteMilestone = (milestoneId: string) => {
    updateData((prev) => {
      const updatedMilestones = prev.milestones.filter((m) => m.id !== milestoneId);
      const totalWeight = updatedMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
      const completedWeight = updatedMilestones.reduce((acc, m) => acc + (m.completed ? m.weight || 0 : 0), 0);
      const calculatedPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

      return {
        ...prev,
        milestones: updatedMilestones,
        progressPercent: calculatedPct,
        status: calculatedPct === 100 ? "Completed" : prev.status === "Completed" ? "On Track" : prev.status
      };
    });
    toast.success("Milestone phase removed");
  };

  // 4. Add Daily Activity Log
  const handleAddDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) {
      toast.error("Please enter activity details");
      return;
    }
    const log: DailyActivityLog = {
      id: `log-${Date.now()}`,
      date: newDate,
      activity: newActivity.trim(),
      hours: parseFloat(newHours) || 0,
      status: newStatus,
      loggedBy: newLoggedBy.trim() || data.projectManager || "Project Lead",
      nextStep: newNextStep.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    updateData((prev) => ({
      ...prev,
      dailyLogs: [log, ...prev.dailyLogs]
    }));

    setNewActivity("");
    setNewNextStep("");
    setShowAddLog(false);
    toast.success("Daily project activity logged!");
  };

  // 5. Delete Daily Log
  const handleDeleteLog = (logId: string) => {
    updateData((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter((l) => l.id !== logId)
    }));
    toast.success("Log entry removed");
  };

  // 6. Export Tracker to CSV (just like a tracker sheet)
  const handleExportCSV = () => {
    const headers = ["Date", "Project Update / Work Done", "Hours Logged", "Status", "Logged By", "Next Action / Deliverable"];
    const rows = data.dailyLogs.map((l) => [
      `"${l.date}"`,
      `"${l.activity.replace(/"/g, '""')}"`,
      `"${l.hours}"`,
      `"${l.status}"`,
      `"${l.loggedBy}"`,
      `"${(l.nextStep || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(lead.company || lead.name).toLowerCase().replace(/\s+/g, "-")}-project-activity-sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Project tracker sheet exported as CSV!");
  };

  // Computed summary metrics
  const totalHours = useMemo(() => {
    return data.dailyLogs.reduce((acc, l) => acc + (l.hours || 0), 0);
  }, [data.dailyLogs]);

  const completedMilestones = useMemo(() => {
    return data.milestones.filter((m) => m.completed).length;
  }, [data.milestones]);

  const healthColor = {
    "On Track": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    "In Progress": "bg-[#c8f237]/25 text-[#111318] dark:text-white border-black/15 dark:border-white/20",
    "Planning": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    "At Risk": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    "Completed": "bg-emerald-600 text-white border-emerald-700"
  }[data.status] || "bg-zinc-100 text-zinc-700";

  return (
    <div className={cn("space-y-5 select-none animate-in fade-in duration-200", className)} data-testid="won-project-tracker">
      
      {/* ------------------------------------------------------- */}
      {/* 1. Main Project Card Header with Live Status & Delivery */}
      {/* ------------------------------------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#121319] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Top Badges & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/10 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8f237] border border-black/10 text-[#111318] flex items-center justify-center shrink-0 shadow-xs font-black">
              <Trophy className="w-5 h-5 text-[#111318]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 suppressHydrationWarning className="text-base sm:text-lg font-extrabold text-[#111318] dark:text-white tracking-tight">
                  {data.projectName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c8f237] text-[#111318] shadow-xs">
                  Won Deal Active
                </span>
                
                {/* Status Switcher Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={data.status}
                    onChange={(e) => {
                      const next = e.target.value as ProjectTrackerData["status"];
                      updateData((prev) => ({ ...prev, status: next }));
                      toast.success(`Project status updated to ${next}`);
                    }}
                    className={cn(
                      "appearance-none text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 pr-5 border cursor-pointer focus:outline-none transition-all shadow-2xs",
                      healthColor
                    )}
                  >
                    <option value="On Track">On Track</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>

              <p suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Client: <strong>{lead.name}</strong></span>
                {lead.company && <span>• Organization: <strong>{lead.company}</strong></span>}
                <span>• Lead Manager: <strong>{data.projectManager}</strong></span>
                <span>• Kickoff: <strong>{data.kickoffDate}</strong></span>
                <span>
                  • Project Type:{" "}
                  <strong className="text-[#15803d] dark:text-[#c8f237] font-black bg-[#c8f237]/20 px-2 py-0.5 rounded-md border border-black/10 dark:border-white/10">
                    {data.projectType || "Corporate Website"}
                  </strong>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#f8fafc] dark:bg-white/[0.05] text-xs font-semibold text-[#111318] dark:text-white hover:bg-black/[0.04] transition-all shadow-2xs active:scale-95"
              title="Download Tracker Sheet as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Export Sheet</span>
            </button>
            <div className="px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5" />Local Storage Active
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- */}
        {/* 2. "How Much the Work is Done" — Completion Progress */}
        {/* ----------------------------------------------------- */}
        <div className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#15803d] dark:text-[#c8f237]" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Work Completed Progress
                </span>
                <span className="text-2xl font-black text-[#111318] dark:text-white tracking-tight ml-1">
                  {data.progressPercent}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {completedMilestones} of {data.milestones.length} major deliverables checked • {totalHours} total hours logged
              </p>
            </div>

            {/* Quick Adjust Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">Quick Set:</span>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleProgressChange(pct)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95",
                    data.progressPercent === pct
                      ? "bg-[#111318] dark:bg-white text-white dark:text-[#111318]"
                      : "bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-black/30"
                  )}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleProgressChange(data.progressPercent - 5)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 active:scale-95"
                title="Decrease 5%"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => handleProgressChange(data.progressPercent + 5)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-[#f8fafc] dark:bg-white/[0.05] border border-black/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 active:scale-95"
                title="Increase 5%"
              >
                +5%
              </button>
            </div>
          </div>

          {/* Interactive Visual Progress Bar */}
          <div className="relative w-full h-3.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-black/[0.06] dark:border-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out shadow-xs flex items-center justify-end pr-1.5"
              style={{
                width: `${data.progressPercent}%`,
                background: data.progressPercent === 100 
                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                  : "linear-gradient(90deg, #c8f237 0%, #10b981 100%)"
              }}
            >
              {data.progressPercent >= 15 && (
                <span className="text-[9px] font-black text-[#111318]">
                  {data.progressPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- */}
        {/* 3. Deliverables & Milestones Checklist                 */}
        {/* ----------------------------------------------------- */}
        <div className="pt-5 border-t border-black/[0.06] dark:border-white/10 mt-5">
          
          {/* Website Type Selector */}
          <div className="p-3.5 mb-4 rounded-xl bg-[#f8fafc] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-white">
                Website Type
              </span>
              {data.websitePreset && WEBSITE_PRESETS[data.websitePreset] && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Active: <strong className="text-[#111318] dark:text-white font-bold">{WEBSITE_PRESETS[data.websitePreset].label}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.values(WEBSITE_PRESETS).map((preset) => {
                const isActive = (data.websitePreset || "corporate") === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyWebsitePreset(preset.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center",
                      isActive
                        ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318] border-[#111318] dark:border-white shadow-2xs font-bold"
                        : "bg-white dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 hover:text-black dark:hover:text-white"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Sub-Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckSquare className="w-4 h-4 text-[#15803d] dark:text-[#c8f237]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-white">
                Project Milestones & Deliverables Roadmap
              </h4>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c8f237]/20 text-[#111318] dark:text-[#c8f237] border border-black/10 dark:border-white/15">
                {completedMilestones} / {data.milestones.length} Milestones Done ({data.milestones.length > 0 ? Math.round((completedMilestones / data.milestones.length) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] dark:text-[#c8f237] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddMilestone ? "Close" : "Add Milestone"}</span>
              </button>
            </div>
          </div>

          {/* Add Milestone Inline Form */}
          {showAddMilestone && (
            <form onSubmit={handleAddMilestone} className="p-3.5 mb-3.5 rounded-xl bg-[#f8fafc] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/10 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                {/* Which Phase Selector */}
                <div className="w-full sm:w-44 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Which Phase
                  </label>
                  <select
                    value={newMilestonePhase}
                    onChange={(e) => setNewMilestonePhase(e.target.value)}
                    className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#111318] dark:text-white focus:outline-none"
                  >
                    <option value="next">
                      Phase {data.milestones.length + 1} (Next Phase)
                    </option>
                    {data.milestones.map((_, i) => (
                      <option key={i} value={String(i)}>
                        Insert as Phase {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Milestone Title */}
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="e.g. Scope Sign-off, Core Deliverables, Client Handover"
                    className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-3 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none focus:border-[#111318]"
                  />
                </div>

                {/* Target Date */}
                <div className="w-full sm:w-40 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-3 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                  />
                </div>

                <Button type="submit" size="sm" className="bg-[#111318] text-white hover:bg-black font-bold text-xs h-8 rounded-lg px-4 shrink-0">
                  Save Milestone
                </Button>
              </div>

              {/* Quick Phase Suggestions Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                  Quick Phase Templates:
                </span>
                {COMMON_PHASE_SUGGESTIONS.map((phase) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setNewMilestoneTitle(phase)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:border-black/25 dark:hover:border-white/25 hover:text-black dark:hover:text-white transition-all"
                  >
                    + {phase}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Clean Compact Milestones Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.milestones.map((m, idx) => (
              <div
                key={m.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all select-none group flex flex-col justify-between shadow-2xs",
                  m.completed
                    ? "bg-emerald-500/[0.04] border-emerald-500/30 hover:border-emerald-500/50"
                    : "bg-[#f8fafc]/80 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(m.id)}
                    className="mt-0.5 shrink-0 focus:outline-none transition-transform active:scale-90"
                    title={m.completed ? "Mark milestone pending" : "Mark milestone completed"}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Phase {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          m.completed 
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        )}>
                          {m.completed ? "Completed" : "In Progress"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 transition-all rounded"
                          title="Delete phase"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <h5 className={cn(
                      "text-xs font-bold mt-1 leading-snug transition-colors",
                      m.completed 
                        ? "text-[#111318] dark:text-white line-through opacity-80" 
                        : "text-[#111318] dark:text-white"
                    )}>
                      {m.title}
                    </h5>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        Target: {m.targetDate}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-400 font-semibold">
                        Weight: {m.weight || 20}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {m.completed ? "✓ Delivered" : "Pending action"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(m.id)}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all active:scale-95 shadow-2xs",
                      m.completed
                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/15 hover:bg-zinc-200"
                        : "bg-[#c8f237] hover:bg-[#b5dc30] text-[#111318] border-black/15 font-black"
                    )}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{m.completed ? "Reopen Phase" : "1-Click Complete"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- */}
      {/* 4. Daily Activity Tracker Sheet ("Tracker Sheet")       */}
      {/* ------------------------------------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#121319] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Table Controls & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c8f237]/20 border border-black/10 flex items-center justify-center text-[#111318] dark:text-[#c8f237] shrink-0 font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#111318] dark:text-white uppercase tracking-wider">
                  Daily Project Activity Tracker Sheet
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#111318] dark:text-white">
                  {data.dailyLogs.length} Entries
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Log and monitor day-to-day deliverables, effort, and blockers
              </p>
            </div>
          </div>

          {/* "+ Log Daily Activity" CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setShowAddLog(!showAddLog)}
              className="bg-[#c8f237] hover:bg-[#b5e028] text-[#111318] font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddLog ? "Cancel Entry" : "Log Daily Activity"}</span>
            </Button>
          </div>
        </div>

        {/* Add Daily Log Inline Form */}
        {showAddLog && (
          <form
            onSubmit={handleAddDailyLog}
            className="p-4 my-4 rounded-xl bg-[#f8fafc] dark:bg-white/[0.03] border border-black/[0.1] dark:border-white/15 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/10 pb-2">
              <span className="text-xs font-bold uppercase text-[#111318] dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#15803d] dark:text-[#c8f237]" />
                Log Daily Project Activity
              </span>
              <span className="text-[10px] text-zinc-400">Saved to localhost session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  placeholder="e.g. 4.0"
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DailyActivityLog["status"])}
                  className="w-full bg-white dark:bg-zinc-800 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocker">Blocker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Logged By</label>
                <input
                  type="text"
                  value={newLoggedBy}
                  onChange={(e) => setNewLoggedBy(e.target.value)}
                  placeholder="e.g. Manish"
                  className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Work Done / Daily Activity Description</label>
              <textarea
                rows={2}
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Describe today's deliverables, tasks done, or client communication..."
                required
                className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg p-2.5 text-xs text-[#111318] dark:text-white focus:outline-none focus:border-[#111318]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Next Step / Blocker (Optional)</label>
              <input
                type="text"
                value={newNextStep}
                onChange={(e) => setNewNextStep(e.target.value)}
                placeholder="e.g. Schedule technical discovery session, follow up with client"
                className="w-full bg-white dark:bg-white/10 border border-black/[0.12] dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#111318] dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddLog(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#111318] text-white hover:bg-black font-bold text-xs h-8 px-4"
              >
                Save Daily Activity
              </Button>
            </div>
          </form>
        )}

        {/* Spreadsheet Table */}
        <div className="rounded-xl border border-black/[0.08] dark:border-white/10 overflow-hidden bg-white dark:bg-[#121319] mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/10 text-zinc-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5 w-28">Date</th>
                <th className="py-2.5 px-3.5">Work Done / Daily Activity</th>
                <th className="py-2.5 px-3.5 w-20 text-center">Hours</th>
                <th className="py-2.5 px-3.5 w-28 text-center">Status</th>
                <th className="py-2.5 px-3.5 w-28">Logged By</th>
                <th className="py-2.5 px-3.5">Next Step</th>
                <th className="py-2.5 px-3.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {data.dailyLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FileSpreadsheet className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-xs font-semibold">No daily activity logged yet.</p>
                      <p className="text-[11px] text-zinc-400">Click &ldquo;+ Log Daily Activity&rdquo; above to record your first daily entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.dailyLogs.map((log) => {
                  const statusBadge = {
                    Completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
                    "In Progress": "bg-[#c8f237]/25 text-[#111318] dark:text-[#c8f237] border-black/10 dark:border-white/20",
                    "In Review": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
                    Blocker: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25"
                  }[log.status] || "bg-zinc-100 text-zinc-700";

                  return (
                    <tr key={log.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                          {log.date}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#111318] dark:text-zinc-200 font-medium">
                        {log.activity}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {log.hours ? `${log.hours}h` : "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block", statusBadge)}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {log.loggedBy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {log.nextStep || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition-all p-1"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-3">
          <span>All entries & progress % are updated and stored locally in this session.</span>
          <span suppressHydrationWarning>
            {mounted && data?.lastUpdated ? `Last modified: ${new Date(data.lastUpdated).toLocaleTimeString()}` : "Local Storage Active"}
          </span>
        </div>
      </div>

    </div>
  );
}
