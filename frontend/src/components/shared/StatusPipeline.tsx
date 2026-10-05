"use client";

import { useState } from "react";
import { useStatuses } from "@/hooks/use-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Trophy,
  Sparkles,
  PhoneCall,
  MessageSquare,
  BadgeCheck,
  FileText,
  Scale,
  XCircle,
  PauseCircle,
  Trash2,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------
// Constants & Icon Helpers
// ---------------------------------------------------------

const LOST_REASONS = [
  "Budget",
  "Timing",
  "Went with competitor",
  "Not a fit",
  "No response",
  "Other",
] as const;

type LostReason = (typeof LOST_REASONS)[number];

const TERMINAL_STATUS_NAMES = ["Won", "Lost", "On Hold", "Junk"];
const SPECIAL_STATUS_NAMES = ["Lost", "On Hold", "Junk"];

const STATUS_ICONS: Record<string, React.ElementType> = {
  New: Sparkles,
  "Attempted Contact": PhoneCall,
  Contacted: MessageSquare,
  Qualified: BadgeCheck,
  "Proposal Sent": FileText,
  Negotiation: Scale,
  Won: Trophy,
  Lost: XCircle,
  "On Hold": PauseCircle,
  Junk: Trash2,
};

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  New: "#3b82f6",
  "Attempted Contact": "#8b5cf6",
  Contacted: "#06b6d4",
  Qualified: "#e87811",
  "Proposal Sent": "#f59e0b",
  Negotiation: "#ec4899",
  Won: "#10b981",
  Lost: "#ef4444",
  "On Hold": "#f97316",
  Junk: "#71717a",
};

function getStepState(
  statusName: string,
  currentStatusName: string,
  linearPipelineNames: string[]
): "completed" | "current" | "future" {
  const currentIdx = linearPipelineNames.indexOf(currentStatusName);
  const statusIdx = linearPipelineNames.indexOf(statusName);
  if (statusIdx === -1) return "future";
  if (statusIdx < currentIdx) return "completed";
  if (statusIdx === currentIdx) return "current";
  return "future";
}

// ---------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean;
  targetStatusName: string | null;
  currentStatusName: string;
  onConfirm: (reason?: LostReason) => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  targetStatusName,
  currentStatusName,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [lostReason, setLostReason] = useState<LostReason | "">("");

  if (!targetStatusName) return null;

  const isWon = targetStatusName === "Won";
  const isLost = targetStatusName === "Lost";
  const isJunk = targetStatusName === "Junk";
  const isOnHold = targetStatusName === "On Hold";

  function handleConfirm() {
    if (isLost && !lostReason) return;
    onConfirm(isLost ? (lostReason as LostReason) : undefined);
    setLostReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[440px] w-[92vw] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isWon ? (
              <>
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">
                  <Trophy className="h-5 w-5" />
                </span>
                <span>Mark Lead as Won?</span>
              </>
            ) : isLost ? (
              <>
                <span className="p-1.5 rounded-lg bg-destructive/20 text-destructive">
                  <XCircle className="h-5 w-5" />
                </span>
                <span>Mark Lead as Lost</span>
              </>
            ) : isJunk ? (
              <>
                <span className="p-1.5 rounded-lg bg-zinc-500/20 text-zinc-400">
                  <Trash2 className="h-5 w-5" />
                </span>
                <span>Move Lead to Junk</span>
              </>
            ) : isOnHold ? (
              <>
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                  <PauseCircle className="h-5 w-5" />
                </span>
                <span>Place Lead On Hold</span>
              </>
            ) : (
              <span>Move Pipeline Stage</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isWon && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              <p className="text-sm font-semibold leading-relaxed">
                🎉 Congratulations! This will convert the lead into a closed-won deal and update revenue metrics.
              </p>
            </div>
          )}

          {isLost && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current stage:{" "}
                <span className="font-semibold text-foreground">{currentStatusName}</span>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reason for Loss <span className="text-destructive">*</span>
                </label>
                <Select
                  value={lostReason}
                  onValueChange={(v) => setLostReason(v as LostReason)}
                >
                  <SelectTrigger className="w-full bg-secondary/50 border-input rounded-xl">
                    <SelectValue placeholder="Select why this deal was lost..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {LOST_REASONS.map((r) => (
                      <SelectItem key={r} value={r} className="rounded-lg">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isWon && !isLost && (
            <div className="p-3.5 rounded-xl bg-secondary/60 border border-border flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                Transitioning from:
              </span>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <span>{currentStatusName}</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">{targetStatusName}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLost && !lostReason}
            className={cn(
              "rounded-xl font-semibold",
              isWon
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isLost
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isWon
              ? "🎉 Confirm Won"
              : isLost
              ? "Confirm Loss"
              : isJunk
              ? "Move to Junk"
              : "Update Stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------
// Main StatusPipeline Component
// ---------------------------------------------------------

interface StatusPipelineProps {
  currentStatus: string;
  onStatusChange?: (newStatusId: string, lostReason?: string) => void;
}

export function StatusPipeline({ currentStatus, onStatusChange }: StatusPipelineProps) {
  const { statuses } = useStatuses();

  // Linear stages: New through Won
  const linearPipeline = statuses.filter((s) => !SPECIAL_STATUS_NAMES.includes(s.name));
  const linearPipelineNames = linearPipeline.map((s) => s.name);
  const specialPipeline = statuses.filter((s) => SPECIAL_STATUS_NAMES.includes(s.name));

  const [localStatusName, setLocalStatusName] = useState<string>(currentStatus);
  const [pendingStatusName, setPendingStatusName] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleStepClick(statusName: string) {
    if (statusName === localStatusName) return;
    setPendingStatusName(statusName);
    setDialogOpen(true);
  }

  function handleConfirm(lostReason?: LostReason) {
    if (!pendingStatusName) return;
    setLocalStatusName(pendingStatusName);

    const newStatusObj = statuses.find((s) => s.name === pendingStatusName);
    if (newStatusObj) {
      onStatusChange?.(newStatusObj.id, lostReason);
    }

    setDialogOpen(false);
    setPendingStatusName(null);
  }

  function handleCancel() {
    setDialogOpen(false);
    setPendingStatusName(null);
  }

  const isTerminal = TERMINAL_STATUS_NAMES.includes(localStatusName);
  const isSpecial = SPECIAL_STATUS_NAMES.includes(localStatusName);

  // Status color resolution
  const currentStatusObj = statuses.find((s) => s.name === localStatusName);
  const currentStatusColor =
    currentStatusObj?.color || DEFAULT_STATUS_COLORS[localStatusName] || "#e87811";
  const CurrentIcon = STATUS_ICONS[localStatusName] || Layers;

  // Pipeline progress calculation
  const currentIdx = linearPipelineNames.indexOf(localStatusName);
  const totalLinear = linearPipelineNames.length || 1;
  const progressPercent =
    currentIdx >= 0 ? Math.round(((currentIdx + 1) / totalLinear) * 100) : isSpecial ? 100 : 0;

  if (statuses.length === 0) {
    return (
      <div className="h-28 animate-pulse bg-secondary/50 rounded-2xl border border-border w-full" />
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Top Header: Pipeline Progress & Active Stage Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform duration-200 hover:scale-105"
            style={{
              backgroundColor: currentStatusColor,
              boxShadow: `0 4px 14px ${currentStatusColor}40`,
            }}
          >
            <CurrentIcon className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Stage {currentIdx >= 0 ? `${currentIdx + 1} of ${totalLinear}:` : "Outcome:"}
              </span>

              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1.5 shadow-xs border"
                style={{
                  backgroundColor: `${currentStatusColor}18`,
                  color: currentStatusColor,
                  borderColor: `${currentStatusColor}35`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentStatusColor }}
                />
                {localStatusName}
              </span>

              {isTerminal && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                  Terminal
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              Click any stage below to advance or update this lead in your sales pipeline.
            </p>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        {!isSpecial && (
          <div className="flex items-center gap-3 sm:max-w-xs w-full sm:w-auto self-end sm:self-center">
            <div className="flex-1 sm:w-44 bg-secondary/80 h-3 rounded-full overflow-hidden border border-border/60 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: currentStatusColor,
                  backgroundImage: `linear-gradient(90deg, #e87811, ${currentStatusColor})`,
                }}
              />
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
              {progressPercent}% <span className="text-muted-foreground font-normal">Progress</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Linear Stepper: Spans 100% of Width with High-Contrast Stage Cards */}
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 w-full">
          {linearPipeline.map((statusObj, idx) => {
            const status = statusObj.name;
            const state = getStepState(status, localStatusName, linearPipelineNames);
            const color = statusObj.color || DEFAULT_STATUS_COLORS[status] || "#e87811";
            const StageIcon = STATUS_ICONS[status] || HelpCircle;
            const isCurrent = state === "current";
            const isCompleted = state === "completed";

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStepClick(status)}
                disabled={isCurrent}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative flex flex-col items-start p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 group w-full select-none cursor-pointer shadow-xs",
                  isCurrent
                    ? "border-2 shadow-md ring-2 ring-offset-2 ring-offset-background scale-[1.02] z-10"
                    : isCompleted
                    ? "border-border/90 bg-card hover:border-primary/50 hover:shadow-sm"
                    : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card hover:shadow-sm"
                )}
                style={{
                  borderColor: isCurrent
                    ? color
                    : isCompleted
                    ? `${color}60`
                    : undefined,
                  backgroundColor: isCurrent
                    ? `${color}18`
                    : isCompleted
                    ? `${color}0c`
                    : undefined,
                  // @ts-expect-error custom ring variable
                  "--tw-ring-color": `${color}50`,
                }}
              >
                {/* Top Mini Header: Number/Check Icon + Micro Badge */}
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-transform duration-200 group-hover:scale-110 shadow-xs",
                      isCompleted || isCurrent
                        ? "text-white"
                        : "text-muted-foreground bg-secondary/80 border border-border"
                    )}
                    style={{
                      backgroundColor:
                        isCompleted || isCurrent ? color : undefined,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {isCurrent ? (
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs"
                      style={{
                        backgroundColor: `${color}25`,
                        color: color,
                        borderColor: `${color}40`,
                      }}
                    >
                      Active
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                      Done ✓
                    </span>
                  ) : (
                    <StageIcon className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  )}
                </div>

                {/* Stage Title */}
                <p
                  className={cn(
                    "text-xs sm:text-sm font-semibold leading-snug w-full truncate",
                    isCurrent
                      ? "text-foreground font-bold"
                      : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground transition-colors"
                  )}
                  style={{
                    color: isCurrent ? color : undefined,
                  }}
                  title={status}
                >
                  {status}
                </p>

                {/* Bottom Active Glow Accent Line */}
                {isCurrent && (
                  <span
                    className="absolute left-3 right-3 bottom-1 h-1 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Dedicated High-Contrast Special / Outcome Disposition Ribbon */}
      <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20 p-3 rounded-2xl border border-border/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-primary" />
          <span>Quick Outcomes & Special Dispositions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Won Button (Quick access to final linear step) */}
          <button
            type="button"
            onClick={() => handleStepClick("Won")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-xs",
              localStatusName === "Won"
                ? "bg-emerald-500 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30 scale-105"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Won Deal</span>
          </button>

          {/* Lost, On Hold, Junk Buttons */}
          {specialPipeline.map((statusObj) => {
            const status = statusObj.name;
            const isActive = localStatusName === status;
            const color = statusObj.color || DEFAULT_STATUS_COLORS[status] || "#ef4444";
            const StatusIcon = STATUS_ICONS[status] || XCircle;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStepClick(status)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-xs",
                  isActive
                    ? "text-white shadow-md ring-2 scale-105"
                    : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
                style={{
                  backgroundColor: isActive ? color : `${color}12`,
                  color: isActive ? "#ffffff" : color,
                  borderColor: isActive ? color : `${color}35`,
                  // @ts-expect-error custom ring variable
                  "--tw-ring-color": `${color}40`,
                }}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Confirmation Dialog */}
      <ConfirmDialog
        open={dialogOpen}
        targetStatusName={pendingStatusName}
        currentStatusName={localStatusName}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
