"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLeads, useReminders } from "@/hooks/use-data";
import { useUser } from "@/components/providers/user-provider";
import { format, isBefore, startOfDay, addMinutes, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { playNotificationSound, sendBrowserNotification } from "@/lib/notification-sound";
import { completeReminder } from "@/actions/reminders";
import { updateLead } from "@/actions/leads";

export type FollowUpUrgency = "due_now" | "upcoming_30" | "overdue" | "scheduled";

export interface FollowUpNotificationItem {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  ownerName: string;
  ownerId: string;
  priority: "Hot" | "Warm" | "Cold";
  dealValue: number | null;
  status: string;
  statusColor: string;
  dueDate: Date;
  dueDateStr: string;
  formattedDateTime: string;
  urgency: FollowUpUrgency;
  urgencyLabel: string;
  urgencyColor: string;
  minutesDiff: number; // positive = future, negative = past
  reminderId?: string;
}

export function useFollowUpNotifications() {
  const { leads, refresh: refreshLeads } = useLeads();
  const { reminders, refresh: refreshReminders } = useReminders();
  const { user } = useUser();

  // Convert leads & reminders into standardized notification items
  const notifications = useMemo(() => {
    const now = new Date();
    const items: FollowUpNotificationItem[] = [];

    leads.forEach((lead) => {
      if (!lead.nextFollowUpDate) return;
      if (["Won", "Lost", "Junk"].includes(lead.status)) return;

      // Filter by user role (admins see all, sales see assigned)
      if (user?.role !== "admin" && user?.role !== "client_manager" && lead.owner.id !== user?.id) {
        return;
      }

      let d: Date;
      try {
        if (lead.nextFollowUpDate.length === 10 && !lead.nextFollowUpDate.includes("T")) {
          d = new Date(`${lead.nextFollowUpDate}T10:00:00`);
        } else {
          d = new Date(lead.nextFollowUpDate);
        }
        if (isNaN(d.getTime())) return;
      } catch {
        return;
      }

      const diffMinutes = differenceInMinutes(d, now);
      let urgency: FollowUpUrgency = "scheduled";
      let urgencyLabel = "Scheduled";
      let urgencyColor = "#3b82f6";

      if (diffMinutes < -15) {
        urgency = "overdue";
        urgencyLabel = `Overdue by ${Math.abs(diffMinutes) > 60 ? `${Math.floor(Math.abs(diffMinutes)/60)}h` : `${Math.abs(diffMinutes)}m`}`;
        urgencyColor = "#ef4444";
      } else if (diffMinutes >= -15 && diffMinutes <= 5) {
        urgency = "due_now";
        urgencyLabel = "Due Right Now";
        urgencyColor = "#f43f5e";
      } else if (diffMinutes > 5 && diffMinutes <= 30) {
        urgency = "upcoming_30";
        urgencyLabel = `In ${diffMinutes} mins`;
        urgencyColor = "#e87811";
      } else {
        urgency = "scheduled";
        urgencyLabel = format(d, "MMM d, h:mm a");
        urgencyColor = "#64748b";
      }

      items.push({
        id: `lead-${lead.id}`,
        leadId: lead.id,
        leadName: lead.name,
        companyName: lead.company,
        phone: lead.phone,
        email: lead.email,
        ownerName: lead.owner.name,
        ownerId: lead.owner.id,
        priority: lead.priority,
        dealValue: lead.dealValue,
        status: lead.status,
        statusColor: lead.statusColor,
        dueDate: d,
        dueDateStr: lead.nextFollowUpDate,
        formattedDateTime: format(d, "MMM d, yyyy · h:mm a"),
        urgency,
        urgencyLabel,
        urgencyColor,
        minutesDiff: diffMinutes,
      });
    });

    // Sort by due date ascending (most urgent / closest first)
    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [leads, user]);

  const counts = useMemo(() => {
    return {
      total: notifications.length,
      dueNow: notifications.filter((n) => n.urgency === "due_now").length,
      upcoming30: notifications.filter((n) => n.urgency === "upcoming_30").length,
      overdue: notifications.filter((n) => n.urgency === "overdue").length,
      activeAlerts: notifications.filter((n) => n.urgency === "due_now" || n.urgency === "upcoming_30" || n.urgency === "overdue").length,
    };
  }, [notifications]);

  // Real-time interval checker for multi-stage notifications
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndNotify = () => {
      const now = new Date();

      notifications.forEach((item) => {
        const diffMinutes = differenceInMinutes(item.dueDate, now);

        // Stage 1: 30 minutes before follow-up (between 1 and 30 minutes away)
        if (diffMinutes > 0 && diffMinutes <= 30) {
          const key30 = `notif_30min_${item.leadId}_${item.dueDateStr}`;
          if (!sessionStorage.getItem(key30)) {
            sessionStorage.setItem(key30, "1");

            // Play audio alert
            playNotificationSound();

            // In-app Toast alert
            toast.warning(`⏰ Upcoming Follow-up in ${diffMinutes} mins: ${item.leadName}`, {
              description: `Follow-up scheduled at ${format(item.dueDate, "h:mm a")}${item.companyName ? ` (${item.companyName})` : ""}. Phone: ${item.phone}`,
              duration: 8000,
              action: {
                label: "View Lead",
                onClick: () => {
                  window.location.href = `/leads/${item.leadId}`;
                },
              },
            });

            // Desktop Browser Notification
            sendBrowserNotification(`⏰ Upcoming Follow-up in ${diffMinutes}m: ${item.leadName}`, {
              body: `Scheduled at ${format(item.dueDate, "h:mm a")} • ${item.phone}`,
              tag: key30,
            });
          }
        }

        // Stage 2: Exact Time / Due Now (between -5 and 5 minutes of scheduled time)
        if (diffMinutes >= -5 && diffMinutes <= 2) {
          const keyDue = `notif_duenow_${item.leadId}_${item.dueDateStr}`;
          if (!sessionStorage.getItem(keyDue)) {
            sessionStorage.setItem(keyDue, "1");

            // Play audio alert
            playNotificationSound();

            // In-app Toast alert
            toast.error(`🔔 Follow-up Due Now: ${item.leadName}`, {
              description: `It's time to contact ${item.leadName}${item.companyName ? ` (${item.companyName})` : ""} at ${item.phone}.`,
              duration: 12000,
              action: {
                label: "Call Now",
                onClick: () => {
                  window.location.href = `/leads/${item.leadId}`;
                },
              },
            });

            // Desktop Browser Notification
            sendBrowserNotification(`🔔 Follow-up Due Now: ${item.leadName}`, {
              body: `Time to call ${item.leadName} (${item.phone})`,
              tag: keyDue,
            });
          }
        }
      });
    };

    // Run initial check and set interval every 20 seconds
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 20000);

    return () => clearInterval(interval);
  }, [notifications]);

  const markFollowUpDone = async (leadId: string) => {
    try {
      await updateLead(leadId, {
        next_followup_date: null,
      });
      toast.success("Follow-up marked as completed!");
      refreshLeads();
      refreshReminders();
    } catch (err) {
      toast.error("Failed to complete follow-up.");
    }
  };

  return {
    notifications,
    counts,
    refresh: () => {
      refreshLeads();
      refreshReminders();
    },
    markFollowUpDone,
  };
}
