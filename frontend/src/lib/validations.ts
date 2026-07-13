import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().nullable().optional(),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").nullable().optional(),
  source: z.enum([
    "Reddit", "Google Business Profile", "Referral",
    "Website Inbound", "LinkedIn", "Cold Outreach",
    "WhatsApp", "Upwork", "Events", "Other"
  ]),
  status: z.enum([
    "New", "Attempted Contact", "Contacted", "Qualified",
    "Proposal Sent", "Negotiation", "Won", "Lost",
    "On Hold", "Junk"
  ]),
  priority: z.enum(["Hot", "Warm", "Cold"]),
  ownerId: z.string(),
  dealValue: z.number().min(0).nullable().optional(),
  nextFollowUpDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  
  // Conditional fields for "Lost" status
  lostReason: z.enum([
    "Budget", "Timing", "Went with competitor", 
    "Not a fit", "No response", "Other"
  ]).optional(),
  lostReasonDetails: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
