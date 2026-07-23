"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  AlertCircle,
  Voicemail,
  PhoneIncoming,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { logCall, updateLead } from "@/actions/leads";
import { useStatuses } from "@/hooks/use-data";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

type CallOutcome =
  | "Answered"
  | "Not Answered"
  | "Busy"
  | "Wrong Number"
  | "Voicemail"
  | "Call Back Requested";

// ---------------------------------------------------------
// Schema (conditional: notes required only for Answered)
// ---------------------------------------------------------

const callLogSchema = z
  .object({
    outcome: z.enum([
      "Answered",
      "Not Answered",
      "Busy",
      "Wrong Number",
      "Voicemail",
      "Call Back Requested",
    ] as const),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
    newStatusId: z.string().optional(),
    retryDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.outcome === "Answered" && (!data.notes || data.notes.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Notes are required when the call was answered.",
        path: ["notes"],
      });
    }
  });

type CallLogFormData = z.infer<typeof callLogSchema>;

// ---------------------------------------------------------
// Config
// ---------------------------------------------------------

const OUTCOMES: {
  value: CallOutcome;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { value: "Answered", label: "Answered", icon: Phone, color: "#22c55e", bg: "#22c55e15" },
  { value: "Not Answered", label: "Not Answered", icon: PhoneMissed, color: "#ef4444", bg: "#ef444415" },
  { value: "Busy", label: "Busy", icon: PhoneOff, color: "#eab308", bg: "#eab30815" },
  { value: "Wrong Number", label: "Wrong Number", icon: AlertCircle, color: "#737373", bg: "#73737315" },
  { value: "Voicemail", label: "Voicemail", icon: Voicemail, color: "#8b5cf6", bg: "#8b5cf615" },
  {
    value: "Call Back Requested",
    label: "Call Back Requested",
    icon: PhoneIncoming,
    color: "#3b82f6",
    bg: "#3b82f615",
  },
];

// ---------------------------------------------------------
// Inner form component
// ---------------------------------------------------------

function CallLogForm({
  onClose,
  leadName,
  leadId,
}: {
  onClose: () => void;
  leadName?: string;
  leadId: string;
}) {
  const router = useRouter();
  const { statuses } = useStatuses();
  const form = useForm<CallLogFormData>({
    resolver: zodResolver(callLogSchema),
    defaultValues: {
      outcome: undefined,
      notes: "",
      followUpDate: "",
      newStatusId: undefined,
      retryDate: "",
    },
  });

  const outcome = form.watch("outcome");
  const isAnswered = outcome === "Answered";
  const isOther = outcome && outcome !== "Answered";
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: CallLogFormData) {
    setIsSubmitting(true);
    try {
      const callResult = await logCall(leadId, {
        outcome: data.outcome,
        notes: data.notes,
      });

      if (callResult.error) {
        toast.error(callResult.error);
        return;
      }

      // Update lead if status or follow-up changed
      const updateData: any = {};
      let needsUpdate = false;
      
      if (data.newStatusId && data.newStatusId !== "none") {
        updateData.status_id = data.newStatusId;
        needsUpdate = true;
      }
      
      const nextDate = data.followUpDate || data.retryDate;
      if (nextDate) {
        // Assume date string in yyyy-MM-dd is valid for supabase timestamp
        updateData.next_followup_date = new Date(nextDate).toISOString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        const upRes = await updateLead(leadId, updateData);
        if (upRes.error) {
          toast.error("Call logged, but failed to update status/date: " + upRes.error);
        }
      }

      toast.success("Call logged successfully!", {
        description: `Outcome: ${data.outcome}`,
      });
      router.refresh();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Outcome buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Call Outcome *</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OUTCOMES.map(({ value, label, icon: Icon, color, bg }) => {
              const isSelected = outcome === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => form.setValue("outcome", value, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                    isSelected
                      ? "border-current ring-1 ring-current"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  style={
                    isSelected
                      ? { borderColor: color, color, backgroundColor: bg }
                      : {}
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
          {form.formState.errors.outcome && (
            <p className="text-xs text-destructive">{form.formState.errors.outcome.message}</p>
          )}
        </div>

        {/* Answered flow */}
        {isAnswered && (
          <div className="space-y-4 p-4 rounded-lg border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Call Answered</span>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was discussed? Next steps, client sentiment, key points..."
                      className="min-h-[80px] resize-y bg-background border-input"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-background border-input"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newStatusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Status (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input w-full">
                          <SelectValue placeholder="Keep current" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Keep current</SelectItem>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Other outcomes flow */}
        {isOther && (
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-secondary/20">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional context..."
                      className="min-h-[60px] resize-y bg-background border-input"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retry Date (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-background border-input"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!outcome || isSubmitting}>
            {isSubmitting ? "Logging..." : "Log Call"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------
// Public component
// ---------------------------------------------------------

interface CallLogModalProps {
  leadName?: string;
  leadId: string;
  /** Optional trigger element. If not provided, renders a default button. */
  trigger?: React.ReactNode;
}

export function CallLogModal({ leadName, leadId, trigger }: CallLogModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Custom trigger: render as-is inside a click wrapper */}
      {trigger ? (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={() => setOpen(true)} style={{ display: "contents" }}>
          {trigger}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
            <Phone className="h-4 w-4" />
            Log Call
          </DialogTrigger>
        </Dialog>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[540px] w-[95vw] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>
              Log Call{leadName ? ` — ${leadName}` : ""}
            </DialogTitle>
          </DialogHeader>

          {open && <CallLogForm onClose={() => setOpen(false)} leadName={leadName} leadId={leadId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
