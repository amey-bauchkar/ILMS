"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, LeadFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStatuses, useTeamMembers, useTags } from "@/hooks/use-data";
import { useUser } from "@/components/providers/user-provider";
import { createLead, updateLead, deleteLead } from "@/actions/leads";
import { TagManager } from "./TagManager";
import { SourceCombobox } from "./SourceCombobox";
import { LocationCombobox } from "./LocationCombobox";
import { PhoneInputWithCountry } from "./PhoneInputWithCountry";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Tag as TagIcon, 
  FileText, 
  Link2, 
  Trash2, 
  Loader2, 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  AlertTriangle,
  Flame,
  Sparkles
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

function parseDatePart(isoOrDateStr?: string | null): string {
  if (!isoOrDateStr) return "";
  try {
    if (isoOrDateStr.includes("T")) {
      const d = new Date(isoOrDateStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return isoOrDateStr.split("T")[0];
    }
    return isoOrDateStr.slice(0, 10);
  } catch {
    return "";
  }
}

function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimePart(isoOrDateStr?: string | null): string {
  if (!isoOrDateStr) return "10:00";
  try {
    if (isoOrDateStr.includes("T")) {
      const d = new Date(isoOrDateStr);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      const timePart = isoOrDateStr.split("T")[1];
      return timePart ? timePart.slice(0, 5) : "10:00";
    }
    return "10:00";
  } catch {
    return "10:00";
  }
}

interface LeadFormProps {
  initialData?: Partial<LeadFormData> & { 
    id?: string; 
    createdAt?: string; 
    createdAtTime?: string;
    location?: string; 
    lastContactedAt?: string;
    lastContactedAtTime?: string;
  };
  onSuccess?: () => void;
}

export function LeadForm({ initialData, onSuccess }: LeadFormProps) {
  const { statuses } = useStatuses();
  const { members } = useTeamMembers();
  const { tags: allTags } = useTags();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLead = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    try {
      const res = await deleteLead(initialData.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Lead deleted successfully!");
        setShowDeleteConfirm(false);
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error("Failed to delete lead. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Find the "New" status id for default
  const newStatus = statuses.find((s) => s.name === "New");

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      company: initialData?.company || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      source: initialData?.source || "Website Inbound",
      status: initialData?.status || newStatus?.id || "",
      priority: initialData?.priority || "Warm",
      ownerId: initialData?.ownerId || user?.id || "",
      dealValue: initialData?.dealValue || undefined,
      createdAt: parseDatePart(initialData?.createdAt) || getTodayDateString(),
      createdAtTime: initialData?.createdAtTime || (initialData?.createdAt && initialData.createdAt.includes('T') ? parseTimePart(initialData.createdAt) : getCurrentTimeString()),
      lastContactedAt: parseDatePart(initialData?.lastContactedAt),
      lastContactedAtTime: initialData?.lastContactedAtTime || (initialData?.lastContactedAt && initialData.lastContactedAt.includes('T') ? parseTimePart(initialData.lastContactedAt) : ""),
      location: initialData?.location || "",
      nextFollowUpDate: parseDatePart(initialData?.nextFollowUpDate),
      nextFollowUpTime: initialData?.nextFollowUpTime || (initialData?.nextFollowUpDate ? parseTimePart(initialData.nextFollowUpDate) : "10:00"),
      notes: initialData?.notes || "",
      tags: initialData?.tags || [],
      lostReason: initialData?.lostReason,
      lostReasonDetails: initialData?.lostReasonDetails || "",
      sourceLink: initialData?.sourceLink || "",
    },
  });

  // Sync status and ownerId when opening a lead
  useEffect(() => {
    if (initialData?.id) {
      form.reset({
        name: initialData.name || "",
        company: initialData.company || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        source: initialData.source || "Website Inbound",
        status: initialData.status || newStatus?.id || "",
        priority: initialData.priority || "Warm",
        ownerId: initialData.ownerId || user?.id || "",
        dealValue: initialData.dealValue || undefined,
        createdAt: parseDatePart(initialData.createdAt) || getTodayDateString(),
        createdAtTime: initialData.createdAtTime || (initialData.createdAt && initialData.createdAt.includes('T') ? parseTimePart(initialData.createdAt) : getCurrentTimeString()),
        lastContactedAt: parseDatePart(initialData.lastContactedAt),
        lastContactedAtTime: initialData.lastContactedAtTime || (initialData.lastContactedAt && initialData.lastContactedAt.includes('T') ? parseTimePart(initialData.lastContactedAt) : ""),
        location: initialData.location || "",
        nextFollowUpDate: parseDatePart(initialData.nextFollowUpDate),
        nextFollowUpTime: initialData.nextFollowUpTime || (initialData.nextFollowUpDate ? parseTimePart(initialData.nextFollowUpDate) : "10:00"),
        notes: initialData.notes || "",
        tags: initialData.tags || [],
        lostReason: (initialData.lostReason as any) || undefined,
        lostReasonDetails: initialData.lostReasonDetails || "",
        sourceLink: initialData.sourceLink || "",
      });
    } else {
      if (!form.getValues("status") && newStatus?.id) {
        form.setValue("status", newStatus.id);
      }
      if (!form.getValues("ownerId") && (user?.id || members[0]?.id)) {
        form.setValue("ownerId", user?.id || members[0]?.id);
      }
    }
  }, [initialData?.id, newStatus?.id, user?.id]);

  const watchStatusId = form.watch("status");
  const selectedStatus = statuses.find((s) => s.id === watchStatusId);
  const isLostStatus = selectedStatus?.name === "Lost";

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
    const firstKey = Object.keys(errors)[0];
    const firstErr = errors[firstKey];
    if (firstErr?.message) {
      toast.error(`${firstKey}: ${firstErr.message}`);
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  async function onSubmit(data: LeadFormData) {
    setSaving(true);
    try {
      let combinedFollowUp: string | null = null;
      if (data.nextFollowUpDate && data.nextFollowUpDate.trim() !== "") {
        const time = data.nextFollowUpTime && data.nextFollowUpTime.trim() !== "" ? data.nextFollowUpTime : "10:00";
        try {
          combinedFollowUp = new Date(`${data.nextFollowUpDate}T${time}:00`).toISOString();
        } catch {
          combinedFollowUp = `${data.nextFollowUpDate}T${time}:00`;
        }
      }

      let combinedCreatedAt: string | undefined = undefined;
      if (data.createdAt && data.createdAt.trim() !== "") {
        const time = data.createdAtTime && data.createdAtTime.trim() !== "" ? data.createdAtTime : getCurrentTimeString();
        try {
          combinedCreatedAt = new Date(`${data.createdAt}T${time}:00`).toISOString();
        } catch {
          combinedCreatedAt = `${data.createdAt}T${time}:00`;
        }
      }

      let combinedLastContactedAt: string | null = null;
      if (data.lastContactedAt && data.lastContactedAt.trim() !== "") {
        const time = data.lastContactedAtTime && data.lastContactedAtTime.trim() !== "" ? data.lastContactedAtTime : getCurrentTimeString();
        try {
          combinedLastContactedAt = new Date(`${data.lastContactedAt}T${time}:00`).toISOString();
        } catch {
          combinedLastContactedAt = `${data.lastContactedAt}T${time}:00`;
        }
      }

      const cleanDealValue = typeof data.dealValue === "number" && !isNaN(data.dealValue) ? data.dealValue : undefined;

      if (initialData?.id) {
        // Update existing lead
        const result = await updateLead(initialData.id, {
          name: data.name,
          company_name: data.company || undefined,
          phone: data.phone,
          email: data.email || undefined,
          source: data.source,
          status_id: data.status,
          owner_id: data.ownerId,
          priority: data.priority,
          estimated_deal_value: cleanDealValue,
          created_at: combinedCreatedAt,
          last_contacted_at: combinedLastContactedAt,
          location: data.location || null,
          source_link: data.sourceLink || null,
          notes: data.notes || undefined,
          next_followup_date: combinedFollowUp,
          lost_reason: (data.lostReason as any) || null,
          lost_reason_details: data.lostReasonDetails || null,
          tags: data.tags,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Lead updated successfully!");
          onSuccess?.();
        }
      } else {
        // Create new lead
        const result = await createLead({
          name: data.name,
          company_name: data.company || undefined,
          phone: data.phone,
          email: data.email || undefined,
          source: data.source,
          status_id: data.status,
          owner_id: data.ownerId,
          priority: data.priority,
          estimated_deal_value: cleanDealValue,
          created_at: combinedCreatedAt,
          last_contacted_at: combinedLastContactedAt || undefined,
          location: data.location || undefined,
          next_followup_date: combinedFollowUp || undefined,
          notes: data.notes || undefined,
          tags: data.tags,
          lost_reason: (data.lostReason as any) || undefined,
          lost_reason_details: data.lostReasonDetails || undefined,
          source_link: data.sourceLink || undefined,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Lead added successfully!");
          form.reset();
          onSuccess?.();
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const source = form.watch("source");
  const sourcePlaceholderMap: Record<string, string> = {
    "LinkedIn": "https://linkedin.com/in/...",
    "Twitter / X": "https://x.com/...",
    "Instagram": "https://instagram.com/...",
    "Facebook": "https://facebook.com/...",
    "YouTube": "https://youtube.com/@...",
    "Reddit": "https://reddit.com/r/.../comments/...",
    "WhatsApp": "https://wa.me/...",
    "Telegram": "https://t.me/...",
    "Discord": "https://discord.gg/...",
    "Threads": "https://threads.net/@...",
    "Upwork": "https://upwork.com/...",
    "Fiverr": "https://fiverr.com/...",
    "Freelancer": "https://freelancer.com/...",
    "Indeed": "https://indeed.com/...",
    "Naukri": "https://naukri.com/...",
    "Wellfound (AngelList)": "https://wellfound.com/...",
    "Glassdoor": "https://glassdoor.com/...",
    "Internshala": "https://internshala.com/...",
    "TopTal": "https://toptal.com/...",
    "Guru": "https://guru.com/...",
    "PeoplePerHour": "https://peopleperhour.com/...",
    "Website Inbound": "https://...",
    "Google Search / SEO": "https://...",
    "Google My Business": "https://maps.google.com/...",
    "Google Business Profile": "https://maps.google.com/...",
    "Just Dial": "https://justdial.com/...",
    "Local Business": "https://...",
    "Referral": "https://...",
    "Cold Outreach": "https://...",
    "Events / Conferences": "https://...",
    "Clutch": "https://clutch.co/profile/...",
    "Dribbble": "https://dribbble.com/...",
    "Behance": "https://behance.net/...",
    "Other": "https://...",
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        
        {/* Section 1: Contact Details */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] border border-white/15 text-primary shadow-xs">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Contact Information</h3>
              <p className="text-xs text-zinc-400">Primary contact and company details</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">
                    Name <span className="text-primary font-bold">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. John Doe" 
                      className="h-10 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">Company</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Acme Innovations" 
                      className="h-10 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">
                    Phone <span className="text-primary font-bold">*</span>
                  </FormLabel>
                  <FormControl>
                    <PhoneInputWithCountry
                      value={field.value || ""}
                      onChange={field.onChange}
                      location={form.watch("location")}
                      disabled={saving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      className="h-10 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2: Pipeline & Ownership */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-xs">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Pipeline & Assignment</h3>
              <p className="text-xs text-zinc-400">Source channel, stage, priority & team assignment</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">
                    Lead Source <span className="text-primary font-bold">*</span>
                  </FormLabel>
                  <FormControl>
                    <SourceCombobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={saving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => {
                const currentStatus = statuses.find((s) => s.id === field.value);
                return (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-300">
                      Pipeline Stage <span className="text-primary font-bold">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus:border-primary focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-primary/25 flex items-center justify-between">
                          <SelectValue placeholder="Select stage">
                            {currentStatus ? (
                              <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: currentStatus.color }} />
                                <span className="font-medium">{currentStatus.name}</span>
                              </span>
                            ) : (
                              "Select stage"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border border-white/15 bg-[#121319]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white p-1">
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: s.color }} />
                              <span>{s.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">
                    Priority <span className="text-primary font-bold">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus:border-primary focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-primary/25 flex items-center justify-between">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border border-white/15 bg-[#121319]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white p-1">
                      <SelectItem value="Hot" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-2 font-medium text-red-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
                          <span>Hot 🔥</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="Warm" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-2 font-medium text-orange-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
                          <span>Warm ☀️</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="Cold" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-2 font-medium text-blue-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                          <span>Cold ❄️</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="Dead" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-2 font-medium text-zinc-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 shadow-xs" />
                          <span>Dead ☠️</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => {
                const currentOwner = members.find((m) => m.id === field.value);
                return (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-300">
                      Assigned Owner <span className="text-primary font-bold">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus:border-primary focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-primary/25 flex items-center justify-between">
                          <SelectValue placeholder="Select owner">
                            {currentOwner?.name || (members.length > 0 ? "Select owner" : "Loading...")}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border border-white/15 bg-[#121319]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white p-1">
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] focus:bg-white/[0.1] focus:text-white cursor-pointer px-3 py-2 text-xs sm:text-sm">
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-zinc-300">Location / Geography</FormLabel>
                <FormControl>
                  <LocationCombobox
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select or search station, city, state, country..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional Lost Reason */}
          {isLostStatus && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-md p-4 space-y-3 mt-3 shadow-inner">
              <div className="flex items-center gap-2 text-destructive font-semibold text-xs tracking-wider uppercase">
                <AlertTriangle className="w-4 h-4" />
                Lost Lead Details
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lostReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-300">Reason for Loss</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white shadow-inner">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border border-white/15 bg-[#121319]/95 backdrop-blur-2xl shadow-2xl text-white p-1">
                          <SelectItem value="Budget" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">Budget</SelectItem>
                          <SelectItem value="Timing" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">Timing</SelectItem>
                          <SelectItem value="Went with competitor" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">Went with competitor</SelectItem>
                          <SelectItem value="Not a fit" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">Not a fit</SelectItem>
                          <SelectItem value="No response" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">No response</SelectItem>
                          <SelectItem value="Other" className="rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08]">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lostReasonDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-300">Additional Context</FormLabel>
                      <FormControl>
                        <Input 
                          className="h-10 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner" 
                          placeholder="Why was this lead lost?" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Activity Timelines & Schedule */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Activity & Scheduling</h3>
              <p className="text-xs text-zinc-400">Creation, last contacted & next follow-up dates</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Creation Date & Time */}
            <div className="space-y-2 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] shadow-inner">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Creation Date & Time
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="createdAt"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2.5 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="createdAtTime"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="time" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Last Contacted Date & Time */}
            <div className="space-y-2 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] shadow-inner">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" /> Last Contacted
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="lastContactedAt"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2.5 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="lastContactedAtTime"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="time" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Next Follow-up Date & Time */}
            <div className="space-y-2 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] shadow-inner">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Next Follow-up
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="nextFollowUpDate"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2.5 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="nextFollowUpTime"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="time" 
                            className="h-9.5 rounded-lg border border-white/20 bg-white/[0.05] px-2 py-1 text-xs text-white shadow-inner transition-all hover:border-white/35 focus:border-primary" 
                            {...field} 
                            value={field.value || "10:00"} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Deal Value & Reference Links */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-xs">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Deal Value & Reference Link</h3>
              <p className="text-xs text-zinc-400">Estimated revenue and origin reference URL</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dealValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">Deal Value (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">₹</span>
                      <Input 
                        type="number" 
                        placeholder="50,000" 
                        className="h-10 rounded-xl border border-white/20 bg-white/[0.05] pl-8 pr-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                        {...field} 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-zinc-300">
                    Source Link <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        type="text" 
                        placeholder={sourcePlaceholderMap[source] || "https://..."} 
                        className="h-10 rounded-xl border border-white/20 bg-white/[0.05] pl-9.5 pr-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 5: Categorization & Notes */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-xs">
              <TagIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Tags & Notes</h3>
              <p className="text-xs text-zinc-400">Label categorizations and lead interaction notes</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-zinc-300">Tags</FormLabel>
                <FormControl>
                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/15 backdrop-blur-md shadow-inner">
                    <TagManager 
                      tags={field.value || []} 
                      onChange={field.onChange} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-zinc-300">Notes & Context</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter discussion summary, key requirements, or background context..."
                    className="min-h-[95px] resize-y rounded-xl border border-white/20 bg-white/[0.05] p-3 text-sm text-white placeholder:text-zinc-500 shadow-inner backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/[0.08] focus-visible:border-primary focus-visible:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/15 sticky bottom-0 bg-[#0e1015]/85 backdrop-blur-2xl p-3 sm:p-4 -mx-2 rounded-b-2xl z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {initialData?.id ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 gap-1.5 w-full sm:w-auto h-11 px-4 rounded-xl transition-all"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              Delete Lead
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full sm:w-auto min-w-[170px] font-semibold text-white bg-gradient-to-r from-[#FF5A1F] via-[#FF6D2C] to-[#FF8542] hover:from-[#e04e18] hover:to-[#FF5A1F] border border-white/20 shadow-[0_4px_20px_rgba(255,90,31,0.4)] hover:shadow-[0_6px_28px_rgba(255,90,31,0.6)] transition-all h-11 rounded-xl active:scale-[0.98]" 
              disabled={saving || isDeleting}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{initialData?.id ? "Saving..." : "Adding..."}</>
              ) : (
                initialData?.id ? "Save Changes" : "Create Lead"
              )}
            </Button>
          </div>
        </div>

        {/* Delete Lead Confirmation Modal */}
        {initialData?.id && (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Lead</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <span className="font-semibold text-white">{initialData?.name}</span>? This action cannot be undone and will remove all associated activities and notes.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-xl border-white/20 bg-white/[0.05] hover:bg-white/[0.1] text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteLead}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Lead"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </form>
    </Form>
  );
}
