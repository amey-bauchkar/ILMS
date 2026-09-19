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
  company: z.string().nullable().optional(),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).nullable().optional(),
  source: z.string().min(1, "Select a source"),
  status: z.string(),
  priority: z.enum(["Hot", "Warm", "Cold"]),
  ownerId: z.string(),
  dealValue: z.number().min(0).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  nextFollowUpDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  sourceLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  
  // Conditional fields for "Lost" status
  lostReason: z.enum([
    "Budget", "Timing", "Went with competitor", 
    "Not a fit", "No response", "Other"
  ]).optional(),
  lostReasonDetails: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
