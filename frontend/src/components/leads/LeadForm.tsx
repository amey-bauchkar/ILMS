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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStatuses, useTeamMembers, useTags } from "@/hooks/use-data";
import { useUser } from "@/components/providers/user-provider";
import { createLead, updateLead } from "@/actions/leads";
import { TagManager } from "./TagManager";
import { SourceCombobox } from "./SourceCombobox";
import { User, FileText, Tag as TagIcon, Banknote, ListTodo, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface LeadFormProps {
  initialData?: Partial<LeadFormData> & { id?: string; createdAt?: string; location?: string };
  onSuccess?: () => void;
}

export function LeadForm({ initialData, onSuccess }: LeadFormProps) {
  const { statuses } = useStatuses();
  const { members } = useTeamMembers();
  const { tags: allTags } = useTags();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

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
      createdAt: initialData?.createdAt ? (initialData.createdAt.includes('T') ? initialData.createdAt.split('T')[0] : initialData.createdAt) : "",
      location: initialData?.location || "",
      nextFollowUpDate: initialData?.nextFollowUpDate || "",
      notes: initialData?.notes || "",
      tags: initialData?.tags || [],
      lostReason: initialData?.lostReason,
      lostReasonDetails: initialData?.lostReasonDetails || "",
      sourceLink: initialData?.sourceLink || "",
    },
  });

  // Sync status and ownerId as soon as async data resolves
  useEffect(() => {
    if (initialData) {
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
        createdAt: initialData.createdAt ? (initialData.createdAt.includes('T') ? initialData.createdAt.split('T')[0] : initialData.createdAt) : "",
        location: initialData.location || "",
        nextFollowUpDate: initialData.nextFollowUpDate || "",
        notes: initialData.notes || "",
        tags: initialData.tags || [],
        lostReason: initialData.lostReason,
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
  }, [initialData, newStatus?.id, user?.id, members, form]);

  // Determine if the selected status is "Lost"
  const watchStatusId = form.watch("status");
  const selectedStatus = statuses.find((s) => s.id === watchStatusId);
  const isLostStatus = selectedStatus?.name === "Lost";

  async function onSubmit(data: LeadFormData) {
    setSaving(true);
    try {
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
          estimated_deal_value: data.dealValue ?? undefined,
          created_at: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
          location: data.location || null,
          next_followup_date: data.nextFollowUpDate || null,
          lost_reason: data.lostReason || null,
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
          estimated_deal_value: data.dealValue ?? undefined,
          created_at: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
          location: data.location || undefined,
          next_followup_date: data.nextFollowUpDate || undefined,
          notes: data.notes || undefined,
          tags: data.tags,
          lost_reason: data.lostReason || undefined,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Contact Info */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-md">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Contact Info</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} />
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
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+91 9876543210" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-md">
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Lead Details</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source *</FormLabel>
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
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1">
                          <SelectValue placeholder="Select status">
                            {currentStatus ? (
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentStatus.color }} />
                                {currentStatus.name}
                              </span>
                            ) : (
                              "Select status"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
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

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
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
                    <FormLabel>Owner *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1">
                          <SelectValue placeholder="Select owner">
                            {currentOwner?.name || (members.length > 0 ? "Select owner" : "Loading...")}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
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

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Creation Date</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Place</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mumbai, India" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Conditional Lost Reason */}
          {isLostStatus && (
            <div className="space-y-4 pt-4 mt-4 border-t border-destructive/20">
              <h4 className="font-medium text-destructive">Lost Details</h4>
              <div className="grid sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="lostReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Loss</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Budget">Budget</SelectItem>
                          <SelectItem value="Timing">Timing</SelectItem>
                          <SelectItem value="Went with competitor">Went with competitor</SelectItem>
                          <SelectItem value="Not a fit">Not a fit</SelectItem>
                          <SelectItem value="No response">No response</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
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
                      <FormLabel>Additional Context</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" 
                          placeholder="Elaborate on why this lead was lost..." 
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

        {/* Deal Info */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-500/10 rounded-md">
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Deal Info</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="dealValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Value (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="50000" 
                      className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1"
                      {...field} 
                      value={field.value || ""} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextFollowUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Follow-up</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Links */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-md">
              <Link2 className="h-4 w-4 text-cyan-500" />
            </div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Links</h3>
          </div>
          
          <FormField
            control={form.control}
            name="sourceLink"
            render={({ field }) => {
              const source = form.watch("source");
              const placeholderMap: Record<string, string> = {
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
              const labelMap: Record<string, string> = {
                "LinkedIn": "LinkedIn Profile Link",
                "Twitter / X": "Twitter / X Profile Link",
                "Instagram": "Instagram Profile Link",
                "Facebook": "Facebook Profile Link",
                "YouTube": "YouTube Channel / Video Link",
                "Reddit": "Reddit Post Link",
                "WhatsApp": "WhatsApp Link",
                "Telegram": "Telegram Link",
                "Discord": "Discord Link",
                "Threads": "Threads Profile Link",
                "Upwork": "Upwork Job / Profile Link",
                "Fiverr": "Fiverr Order / Profile Link",
                "Freelancer": "Freelancer Project Link",
                "Indeed": "Indeed Job Link",
                "Naukri": "Naukri Job / Candidate Link",
                "Wellfound (AngelList)": "Wellfound Profile Link",
                "Glassdoor": "Glassdoor Link",
                "Internshala": "Internshala Applicant Link",
                "TopTal": "TopTal Profile Link",
                "Guru": "Guru Project Link",
                "PeoplePerHour": "PeoplePerHour Link",
                "Website Inbound": "Website URL",
                "Google Search / SEO": "Landing Page URL",
                "Google My Business": "Google My Business (GMB) Link",
                "Google Business Profile": "GMB Profile Link",
                "Just Dial": "Just Dial Listing Link",
                "Local Business": "Business Website / Map Link",
                "Referral": "Referral Link / Reference",
                "Cold Outreach": "Campaign / Reference Link",
                "Events / Conferences": "Event Website / URL",
                "Clutch": "Clutch Review / Profile Link",
                "Dribbble": "Dribbble Portfolio Link",
                "Behance": "Behance Portfolio Link",
                "Other": "Source Link",
              };
              return (
                <FormItem>
                  <FormLabel>
                    {labelMap[source] || "Source Link"}{" "}
                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder={placeholderMap[source] || "e.g. link or reference"} 
                      className="bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1"
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional reference link or URL where this lead was found.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Tags & Notes */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-6 shadow-sm relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-xl" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-md">
                <TagIcon className="h-4 w-4 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Tags</h3>
            </div>
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="bg-background p-3 rounded-md border border-input shadow-sm">
                      <TagManager 
                        tags={field.value || []} 
                        onChange={field.onChange} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add relevant tags to categorize this lead.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-md">
                <FileText className="h-4 w-4 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">Notes</h3>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Any initial notes about this lead..."
                      className="min-h-[100px] resize-y bg-background border-input shadow-sm transition-colors hover:border-foreground/20 focus-visible:ring-1"
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

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
          <Button type="submit" size="lg" className="w-full sm:w-auto min-w-[150px] font-semibold" disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />{initialData?.id ? "Saving..." : "Adding..."}</>
            ) : (
              initialData?.id ? "Save Changes" : "Add Lead"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
