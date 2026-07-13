export type LeadSource =
  | "Reddit" | "Google Business Profile" | "Referral"
  | "Website Inbound" | "LinkedIn" | "Cold Outreach"
  | "WhatsApp" | "Upwork" | "Events" | "Other";

export type LeadStatus =
  | "New" | "Attempted Contact" | "Contacted" | "Qualified"
  | "Proposal Sent" | "Negotiation" | "Won" | "Lost"
  | "On Hold" | "Junk";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Client Manager" | "Sales";
  avatar?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  owner: TeamMember;
  priority: "Hot" | "Warm" | "Cold";
  tags: string[];
  dealValue: number | null;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowUpDate: string | null;
  lostReason: string | null;
}

export interface Activity {
  id: string;
  leadId: string;
  type: "call" | "note" | "status_change" | "tag_change" | "reassignment";
  outcome?: "Answered" | "Not Answered" | "Busy" | "Wrong Number" | "Voicemail" | "Call Back Requested";
  notes: string | null;
  createdBy: TeamMember;
  createdAt: string;
  fromStatus?: LeadStatus;
  toStatus?: LeadStatus;
}

// ----------------------------------------------------
// Mock Data Variables
// ----------------------------------------------------

export const mockTeamMembers: TeamMember[] = [
  { id: "TM-1", name: "Amey", email: "amey@foremark.in", role: "Admin" },
  { id: "TM-2", name: "Janhavi", email: "janhavi@foremark.in", role: "Client Manager" },
  { id: "TM-3", name: "Tanmay", email: "tanmay@foremark.in", role: "Client Manager" },
  { id: "TM-4", name: "Manish", email: "manish@foremark.in", role: "Sales" },
];

export const mockLeads: Lead[] = [
  {
    id: "L-1001",
    name: "Rahul Sharma",
    company: "TechInnovate Solutions",
    phone: "+91 98765 43210",
    email: "rahul.s@techinnovate.in",
    source: "Website Inbound",
    status: "New",
    owner: mockTeamMembers[0], // Amey
    priority: "Hot",
    tags: ["IT Services", "High Intent"],
    dealValue: 150000,
    createdAt: "2026-07-10T10:30:00Z",
    lastContactedAt: null,
    nextFollowUpDate: "2026-07-14",
    lostReason: null,
  },
  {
    id: "L-1002",
    name: "Priya Desai",
    company: "GlobalReach Logistics",
    phone: "+91 87654 32109",
    email: "p.desai@globalreach.co.in",
    source: "Referral",
    status: "Contacted",
    owner: mockTeamMembers[1], // Janhavi
    priority: "Warm",
    tags: ["Logistics", "Website Rebuild"],
    dealValue: 320000,
    createdAt: "2026-07-08T14:15:00Z",
    lastContactedAt: "2026-07-09T10:00:00Z",
    nextFollowUpDate: "2026-07-15",
    lostReason: null,
  },
  {
    id: "L-1003",
    name: "Vikram Malhotra",
    company: "Malhotra Industries",
    phone: "+91 76543 21098",
    email: "vikram@malhotragroup.in",
    source: "Events",
    status: "Qualified",
    owner: mockTeamMembers[2], // Tanmay
    priority: "Hot",
    tags: ["Manufacturing", "CRM Setup"],
    dealValue: 850000,
    createdAt: "2026-07-01T09:00:00Z",
    lastContactedAt: "2026-07-10T16:45:00Z",
    nextFollowUpDate: "2026-07-16",
    lostReason: null,
  },
  {
    id: "L-1004",
    name: "Ananya Iyer",
    company: "FinServe Capital",
    phone: "+91 99887 76655",
    email: "ananya.iyer@finserve.com",
    source: "Cold Outreach",
    status: "Proposal Sent",
    owner: mockTeamMembers[0], // Amey
    priority: "Hot",
    tags: ["FinTech", "Automation"],
    dealValue: 1200000,
    createdAt: "2026-06-25T11:20:00Z",
    lastContactedAt: "2026-07-12T13:30:00Z",
    nextFollowUpDate: "2026-07-18",
    lostReason: null,
  },
  {
    id: "L-1005",
    name: "Siddharth Verma",
    company: "NextGen Retail",
    phone: "+91 91234 56789",
    email: "s.verma@nextgenretail.in",
    source: "Website Inbound",
    status: "Won",
    owner: mockTeamMembers[1], // Janhavi
    priority: "Warm",
    tags: ["E-commerce", "Retainer"],
    dealValue: 450000,
    createdAt: "2026-06-10T10:00:00Z",
    lastContactedAt: "2026-06-28T15:00:00Z",
    nextFollowUpDate: null,
    lostReason: null,
  },
  {
    id: "L-1006",
    name: "Neha Gupta",
    company: "CloudFusion Tech",
    phone: "+91 98712 34567",
    email: "neha.g@cloudfusion.in",
    source: "LinkedIn",
    status: "Attempted Contact",
    owner: mockTeamMembers[2], // Tanmay
    priority: "Cold",
    tags: ["SaaS"],
    dealValue: 200000,
    createdAt: "2026-07-12T09:30:00Z",
    lastContactedAt: "2026-07-12T10:00:00Z",
    nextFollowUpDate: "2026-07-14",
    lostReason: null,
  },
  {
    id: "L-1007",
    name: "Arjun Reddy",
    company: "Reddy Estates",
    phone: "+91 90001 22334",
    email: "arjun@reddyestates.com",
    source: "Referral",
    status: "Lost",
    owner: mockTeamMembers[0],
    priority: "Hot",
    tags: ["Real Estate", "Large Deal"],
    dealValue: 5000000,
    createdAt: "2026-05-15T10:00:00Z",
    lastContactedAt: "2026-06-15T11:00:00Z",
    nextFollowUpDate: null,
    lostReason: "Budget too low",
  },
  {
    id: "L-1008",
    name: "Kavya Menon",
    company: "Kerala Spices Export",
    phone: "+91 88899 77766",
    email: "kavya@keralaspices.in",
    source: "Google Business Profile",
    status: "Contacted",
    owner: mockTeamMembers[1],
    priority: "Warm",
    tags: ["Export", "B2B"],
    dealValue: 75000,
    createdAt: "2026-07-05T14:20:00Z",
    lastContactedAt: "2026-07-07T11:00:00Z",
    nextFollowUpDate: "2026-07-15",
    lostReason: null,
  },
  {
    id: "L-1009",
    name: "Rohan Kapoor",
    company: "Kapoor Fashions",
    phone: "+91 93456 78901",
    email: "rohan.k@kapoorfashions.com",
    source: "Reddit",
    status: "Qualified",
    owner: mockTeamMembers[2],
    priority: "Hot",
    tags: ["Retail", "D2C"],
    dealValue: 180000,
    createdAt: "2026-07-02T16:00:00Z",
    lastContactedAt: "2026-07-06T15:30:00Z",
    nextFollowUpDate: "2026-07-16",
    lostReason: null,
  },
  {
    id: "L-1010",
    name: "Sneha Patel",
    company: "Gujarat Agri Corp",
    phone: "+91 95555 44433",
    email: "sneha.patel@gujaratagri.in",
    source: "WhatsApp",
    status: "Proposal Sent",
    owner: mockTeamMembers[0],
    priority: "Hot",
    tags: ["Agriculture", "Enterprise"],
    dealValue: 2500000,
    createdAt: "2026-06-20T11:00:00Z",
    lastContactedAt: "2026-07-10T14:00:00Z",
    nextFollowUpDate: "2026-07-14",
    lostReason: null,
  },
  {
    id: "L-1011",
    name: "Aditya Singh",
    company: "Singh Builders",
    phone: "+91 97777 88899",
    email: "aditya@singhbuilders.co.in",
    source: "Cold Outreach",
    status: "New",
    owner: mockTeamMembers[1],
    priority: "Cold",
    tags: ["Construction"],
    dealValue: 3500000,
    createdAt: "2026-07-12T17:00:00Z",
    lastContactedAt: null,
    nextFollowUpDate: "2026-07-14",
    lostReason: null,
  },
  {
    id: "L-1012",
    name: "Meera Nair",
    company: "Wellness Care Hospitals",
    phone: "+91 92222 33344",
    email: "meera.n@wellnesshospital.in",
    source: "Referral",
    status: "Won",
    owner: mockTeamMembers[2],
    priority: "Hot",
    tags: ["Healthcare"],
    dealValue: 950000,
    createdAt: "2026-05-10T09:00:00Z",
    lastContactedAt: "2026-06-15T10:00:00Z",
    nextFollowUpDate: null,
    lostReason: null,
  },
];
// pretend this is the logged-in user for now
export const currentUser: TeamMember = mockTeamMembers[1]; // Janhavi

// Status colors — used consistently in badges, timeline, filters
export const statusColors: Record<LeadStatus, string> = {
  "New": "#737373",
  "Attempted Contact": "#3b82f6",
  "Contacted": "#06b6d4",
  "Qualified": "#8b5cf6",
  "Proposal Sent": "#6366f1",
  "Negotiation": "#e87811",
  "Won": "#22c55e",
  "Lost": "#ef4444",
  "On Hold": "#eab308",
  "Junk": "#525252",
};

// Priority colors — used for priority pills
export const priorityColors: Record<Lead["priority"], string> = {
  Hot: "#ef4444",
  Warm: "#e87811",
  Cold: "#3b82f6",
};