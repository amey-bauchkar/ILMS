import { Activity, statusColors } from "@/lib/mock-data";
import { Phone, MessageSquare, ArrowRightLeft, Tag, RefreshCcw } from "lucide-react";

export function TimelineEntry({ activity }: { activity: Activity }) {
  const isStatusChange = activity.type === "status_change";
  const isCall = activity.type === "call";
  const isNote = activity.type === "note";

  let Icon = MessageSquare;
  let iconBg = "bg-secondary";
  let iconColor = "text-muted-foreground";

  if (isCall) {
    Icon = Phone;
    iconBg = activity.outcome === "Answered" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30";
    iconColor = activity.outcome === "Answered" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  } else if (isStatusChange) {
    Icon = ArrowRightLeft;
    iconBg = "bg-blue-100 dark:bg-blue-900/30";
    iconColor = "text-blue-600 dark:text-blue-400";
  } else if (activity.type === "tag_change") {
    Icon = Tag;
  } else if (activity.type === "reassignment") {
    Icon = RefreshCcw;
  }

  return (
    <div className="relative pl-8 py-4 border-b border-border/50 last:border-0 group">
      {/* Timeline Line & Icon */}
      <div className="absolute left-[11px] top-[26px] bottom-[-26px] w-px bg-border group-last:hidden" />
      <div className={`absolute left-0 top-5 w-6 h-6 rounded-full border border-border flex items-center justify-center z-10 ${iconBg}`}>
        <Icon className={`h-3 w-3 ${iconColor}`} />
      </div>

      <div className="flex justify-between items-start mb-1">
        <div className="text-sm">
          <span className="font-medium text-foreground">{activity.createdBy.name}</span>
          
          {isCall && (
            <span className="text-muted-foreground">
              {" "}logged a call ({activity.outcome})
            </span>
          )}
          
          {isNote && (
            <span className="text-muted-foreground"> left a note</span>
          )}
          
          {isStatusChange && (
            <span className="text-muted-foreground">
              {" "}changed status from <span className="font-medium text-foreground">{activity.fromStatus}</span> to{" "}
              <span className="font-medium" style={{ color: activity.toStatus ? statusColors[activity.toStatus] : undefined }}>
                {activity.toStatus}
              </span>
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
          {new Date(activity.createdAt).toLocaleString("en-IN", {
            day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
          })}
        </span>
      </div>

      {activity.notes && (
        <div className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
          {activity.notes}
        </div>
      )}
    </div>
  );
}
