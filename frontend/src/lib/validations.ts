import { z } from "zod";

export const LEAD_SOURCES = [
  // Social Media & Messaging
  "LinkedIn",
  "Twitter / X",
  "Instagram",
  "Facebook",
  "YouTube",
  "Reddit",
  "WhatsApp",
  "Telegram",
  "Discord",
  "Threads",
  
  // Job Boards & Freelance Platforms
  "Upwork",
  "Fiverr",
  "Freelancer",
  "Indeed",
  "Naukri",
  "Wellfound (AngelList)",
  "Glassdoor",
  "Internshala",
  "TopTal",
  "Guru",
  "PeoplePerHour",
  
  // Inbound, Directories & Events
  "Website Inbound",
  "Google Search / SEO",
  "Google My Business",
  "Google Business Profile",
  "Just Dial",
  "Local Business",
  "Referral",
  "Cold Outreach",
  "Events / Conferences",
  "Clutch",
  "Dribbble",
  "Behance",
  "Other",
] as const;

export type LeadSourceOption = (typeof LEAD_SOURCES)[number];

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().nullish(),
  phone: z.string().min(6, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").or(z.literal("")).nullish(),
  source: z.string().min(1, "Select a source"),
  status: z.string().min(1, "Select a status"),
  priority: z.enum(["Hot", "Warm", "Cold", "Dead"]),
  ownerId: z.string().min(1, "Select an owner"),
  dealValue: z.union([z.number().min(0, "Deal value cannot be negative"), z.string(), z.nan()]).nullish(),
  createdAt: z.string().nullish(),
  createdAtTime: z.string().nullish(),
  lastContactedAt: z.string().nullish(),
  lastContactedAtTime: z.string().nullish(),
  location: z.string().nullish(),
  nextFollowUpDate: z.string().nullish(),
  nextFollowUpTime: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  sourceLink: z.string().nullish(),
  lostReason: z.string().nullish(),
  lostReasonDetails: z.string().nullish(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
