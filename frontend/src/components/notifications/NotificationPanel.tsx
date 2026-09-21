"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Volume2,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useFollowUpNotifications,
  type FollowUpNotificationItem,
  type FollowUpUrgency,
} from "@/hooks/use-follow-up-notifications";
import { requestNotificationPermission } from "@/lib/notification-sound";
import { toast } from "sonner";
import { avatarColor } from "@/lib/avatar-colors";
import { priorityColors } from "@/hooks/use-data";

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "urgent" | "overdue">("all");
  const [hasBrowserNotifs, setHasBrowserNotifs] = useState<boolean>(true);
  const { notifications, counts, refresh, markFollowUpDone } = useFollowUpNotifications();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasBrowserNotifs(Notification.permission === "granted");
    }
  }, []);

  const handleEnableBrowserNotifs = async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      setHasBrowserNotifs(true);
      toast.success("Desktop notifications enabled! You'll receive real-time follow-up alerts.");
    } else {
      toast.error("Notification permission denied in your browser settings.");
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "urgent") {
      return item.urgency === "due_now" || item.urgency === "upcoming_30";
    }
    if (activeTab === "overdue") {
      return item.urgency === "overdue";
    }
    return true;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <button
          type="button"
          aria-label="Open notifications"
          className="relative p-2.5 text-[#a3a3a3] hover:text-white hover:bg-[#262626] transition-all rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      }>
        <Bell className="w-5 h-5" />
        {counts.activeAlerts > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
            {counts.activeAlerts > 9 ? "9+" : counts.activeAlerts}
          </span>
        ) : counts.total > 0 ? (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full"></span>
        ) : null}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[460px] p-0 flex flex-col bg-[#0f0f0f] border-l border-[#262626] shadow-2xl z-50 text-foreground"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#262626] bg-[#141414]/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-white tracking-tight">
                  Follow-up Notifications
                </SheetTitle>
                <p className="text-xs text-[#737373] mt-0.5">
                  Automated 30-min advance & exact-time alerts
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#737373] hover:text-white hover:bg-[#262626]"
              onClick={() => {
                refresh();
                toast.info("Notifications refreshed");
              }}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop Notification Banner if not granted */}
          {!hasBrowserNotifs && (
            <div className="mb-3 p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-white">
                <Volume2 className="w-4 h-4 text-primary shrink-0" />
                <span>Enable desktop sound & push alerts</span>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs px-2.5 bg-primary text-black hover:bg-primary/90 font-medium"
                onClick={handleEnableBrowserNotifs}
              >
                Enable
              </Button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1.5 p-1 bg-[#1c1c1c] rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[#2b2b2b] text-white shadow-sm"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setActiveTab("urgent")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === "urgent"
                  ? "bg-[#2b2b2b] text-amber-400 shadow-sm"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              Due & Soon ({counts.dueNow + counts.upcoming30})
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === "overdue"
                  ? "bg-[#2b2b2b] text-red-400 shadow-sm"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              Overdue ({counts.overdue})
            </button>
          </div>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-white font-medium text-sm">You&apos;re all caught up!</p>
              <p className="text-xs text-[#737373] mt-1 max-w-[240px] mx-auto">
                No pending follow-ups matching this filter. New reminders will notify you automatically.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onDone={() => markFollowUpDone(item.leadId)}
                onClosePanel={() => setIsOpen(false)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#262626] bg-[#141414] flex items-center justify-between text-xs text-[#737373]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Auto-alerts 30m prior & at scheduled time
          </span>
          <Link
            href="/leads"
            onClick={() => setIsOpen(false)}
            className="text-primary hover:underline font-medium"
          >
            View All Leads →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationCard({
  item,
  onDone,
  onClosePanel,
}: {
  item: FollowUpNotificationItem;
  onDone: () => void;
  onClosePanel: () => void;
}) {
  const isUrgent = item.urgency === "due_now" || item.urgency === "upcoming_30";
  const isOverdue = item.urgency === "overdue";
  const ownerInitials = item.ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const ownerColor = avatarColor(item.ownerName);

  return (
    <div
      className={`rounded-xl border p-4 transition-all relative overflow-hidden group ${
        item.urgency === "due_now"
          ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70"
          : isOverdue
          ? "bg-red-950/20 border-red-500/30 hover:border-red-500/60"
          : item.urgency === "upcoming_30"
          ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70"
          : "bg-[#161616] border-[#262626] hover:border-[#383838]"
      }`}
    >
      {/* Urgency colored left border bar */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full"
        style={{ backgroundColor: item.urgencyColor }}
      />

      <div className="pl-1">
        {/* Header row: Urgency badge & Time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                item.urgency === "due_now"
                  ? "bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/40"
                  : item.urgency === "upcoming_30"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : isOverdue
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "bg-[#262626] text-[#a3a3a3]"
              }`}
            >
              {item.urgency === "due_now" && <Sparkles className="w-3 h-3 text-rose-400" />}
              {item.urgency === "upcoming_30" && <Clock className="w-3 h-3 text-amber-400" />}
              {isOverdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
              {item.urgencyLabel}
            </span>
          </div>

          <span className="text-[11px] font-medium text-[#a3a3a3] tabular-nums">
            {item.formattedDateTime}
          </span>
        </div>

        {/* Lead name & Company */}
        <div className="mb-2.5">
          <Link
            href={`/leads/${item.leadId}`}
            onClick={onClosePanel}
            className="text-base font-semibold text-white hover:text-primary transition-colors flex items-center gap-1.5 group-hover:text-primary"
          >
            {item.leadName}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          {item.companyName && (
            <p className="text-xs text-[#a3a3a3] truncate mt-0.5">{item.companyName}</p>
          )}
        </div>

        {/* Tags & Owner info */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{
              backgroundColor: `${item.statusColor}20`,
              color: item.statusColor,
            }}
          >
            {item.status}
          </span>

          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{
              backgroundColor: `${priorityColors[item.priority]}20`,
              color: priorityColors[item.priority],
            }}
          >
            {item.priority}
          </span>

          {item.dealValue && (
            <span className="text-[#e5e5e5] font-semibold tabular-nums text-[11px]">
              ₹{item.dealValue.toLocaleString("en-IN")}
            </span>
          )}

          <div className="flex items-center gap-1 ml-auto text-[11px] text-[#737373]">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ backgroundColor: ownerColor }}
            >
              {ownerInitials}
            </div>
            <span>{item.ownerName}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#262626]/80">
          <a
            href={`tel:${item.phone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
            title="Call Lead"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call ({item.phone})</span>
          </a>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/leads/${item.leadId}`}
              onClick={onClosePanel}
              className="px-2.5 py-1.5 rounded-lg bg-[#262626] text-[#e5e5e5] hover:bg-[#333333] hover:text-white transition-colors text-xs font-medium"
            >
              Details
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={onDone}
              className="h-7 px-2.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 border-green-500/20 gap-1"
              title="Mark Follow-up as Completed"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
