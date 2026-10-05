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
  Trophy, 
  XCircle, 
  PauseCircle, 
  Ban
} from "lucide-react";

// ---------------------------------------------------------
// Constants
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

const SPECIAL_ICONS: Record<string, React.ElementType> = {
  Lost: XCircle,
  "On Hold": PauseCircle,
  Junk: Ban,
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
// Sub-components
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

  function handleConfirm() {
    if (isLost && !lostReason) return;
    onConfirm(isLost ? (lostReason as LostReason) : undefined);
    setLostReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[420px] w-[92vw] bg-[#121319] border border-white/20 text-white shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            {isWon
              ? "🎉 Mark Lead as Won"
              : isLost
              ? "Mark Lead as Lost"
              : `Change Status to "${targetStatusName}"?`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isWon && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <Trophy className="h-6 w-6 text-emerald-400 shrink-0" />
              <p className="text-sm text-zinc-200">
                Congratulations! Moving this lead to{" "}
                <strong className="font-semibold text-emerald-400">Won</strong> will record a closed-won victory.
              </p>
            </div>
          )}

          {isLost && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Current status:{" "}
                <span className="font-semibold text-white">{currentStatusName}</span>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-200">
                  Reason for Loss <span className="text-red-400">*</span>
                </label>
                <Select
                  value={lostReason}
                  onValueChange={(v) => setLostReason(v as LostReason)}
                >
                  <SelectTrigger className="w-full bg-white/[0.05] border-white/20 text-white rounded-xl h-10">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121319] border border-white/20 text-white rounded-xl z-[150]">
                    {LOST_REASONS.map((r) => (
                      <SelectItem key={r} value={r} className="text-zinc-300 hover:text-white hover:bg-white/10">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isWon && !isLost && (
            <p className="text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to move this lead from{" "}
              <strong className="text-white font-semibold">{currentStatusName}</strong> to{" "}
              <strong className="text-white font-semibold">{targetStatusName}</strong>?
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" onClick={onCancel} className="rounded-xl border-white/20 bg-white/[0.05] text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLost && !lostReason}
            className={cn(
              "rounded-xl font-semibold",
              isWon
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : isLost
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            {isWon ? "Confirm Won 🎉" : isLost ? "Confirm Lost" : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------
// Main component
// ---------------------------------------------------------

interface StatusPipelineProps {
  currentStatus: string;
  onStatusChange?: (newStatusId: string, lostReason?: string) => void;
}

export function StatusPipeline({ currentStatus, onStatusChange }: StatusPipelineProps) {
  const { statuses } = useStatuses();
  
  // Create pipelines from real DB statuses
  const linearPipeline = statuses.filter(s => !SPECIAL_STATUS_NAMES.includes(s.name));
  const linearPipelineNames = linearPipeline.map(s => s.name);
  const specialPipeline = statuses.filter(s => SPECIAL_STATUS_NAMES.includes(s.name));

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
    
    // Find the ID for the new status
    const newStatusObj = statuses.find(s => s.name === pendingStatusName);
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

  // Find current status color from DB, fallback to blue
  const currentStatusObj = statuses.find(s => s.name === localStatusName);
  const currentStatusColor = currentStatusObj?.color || "#3b82f6";
  const currentStepIdx = linearPipelineNames.indexOf(localStatusName);

  if (statuses.length === 0) return <div className="h-24 animate-pulse bg-secondary/40 rounded-xl" />;

  return (
    <div className="space-y-4">
      {/* Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm animate-pulse"
            style={{ backgroundColor: currentStatusColor }}
          />
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Status:
            </span>
            <span
              className="text-sm font-bold tracking-tight px-2.5 py-0.5 rounded-full border shadow-2xs"
              style={{
                backgroundColor: `${currentStatusColor}20`,
                borderColor: `${currentStatusColor}50`,
                color: currentStatusColor,
              }}
            >
              {localStatusName}
            </span>
          </div>

          {currentStepIdx >= 0 && (
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-block">
              (Stage {currentStepIdx + 1} of {linearPipeline.length})
            </span>
          )}
        </div>

        {/* Quick Outcome Badges for Special Dispositions */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1 hidden md:inline">
            Quick Dispositions:
          </span>
          {specialPipeline.map((statusObj) => {
            const status = statusObj.name;
            const isActive = localStatusName === status;
            const color = statusObj.color || "#ef4444";
            const IconComponent = SPECIAL_ICONS[status] || XCircle;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStepClick(status)}
                disabled={isActive}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-2xs",
                  isActive
                    ? "ring-2 scale-105 cursor-default font-bold"
                    : "hover:scale-102 hover:shadow-xs cursor-pointer opacity-85 hover:opacity-100"
                )}
                style={{
                  backgroundColor: isActive ? color : `${color}15`,
                  color: isActive ? "#ffffff" : color,
                  borderColor: isActive ? color : `${color}40`,
                }}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Linear Stepper Pipeline */}
      <div
        className="overflow-x-auto py-2 -my-2"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-label="Lead status pipeline"
        role="navigation"
      >
        <div className="flex items-center min-w-max gap-0 px-1">
          {linearPipeline.map((statusObj, idx) => {
            const status = statusObj.name;
            const state = getStepState(status, localStatusName, linearPipelineNames);
            const color = statusObj.color || "#3b82f6";
            const isLast = idx === linearPipeline.length - 1;

            return (
              <div key={status} className="flex items-center">
                {/* Step Button */}
                <button
                  type="button"
                  onClick={() => handleStepClick(status)}
                  disabled={state === "current"}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-2 px-3 py-2 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    state === "current" && "cursor-default scale-105",
                    state === "completed" && "cursor-pointer hover:scale-102",
                    state === "future" && "cursor-pointer hover:scale-102"
                  )}
                >
                  {/* Step Circle Node */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 shadow-xs",
                      state === "completed" && "border-transparent text-white font-bold",
                      state === "current" && "ring-4 ring-offset-2 ring-offset-background",
                      state === "future" && "border-border/80 bg-secondary/50 dark:bg-zinc-800/90 hover:border-foreground/50 hover:bg-secondary"
                    )}
                    style={{
                      backgroundColor:
                        state === "completed"
                          ? color
                          : state === "current"
                          ? `${color}25`
                          : undefined,
                      borderColor: state !== "future" ? color : undefined,
                      // @ts-expect-error custom ring variable
                      "--tw-ring-color": `${color}50`,
                      boxShadow:
                        state === "current"
                          ? `0 0 16px ${color}60`
                          : undefined,
                    }}
                  >
                    {state === "completed" ? (
                      <Check className="h-4 w-4 text-white stroke-[3]" />
                    ) : state === "current" ? (
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-foreground/70 dark:text-zinc-300">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Step Label with High Contrast */}
                  <span
                    className={cn(
                      "text-xs font-semibold leading-tight text-center max-w-[85px] whitespace-normal transition-colors",
                      state === "current" && "font-bold text-sm tracking-tight",
                      state === "completed" && "text-foreground font-semibold",
                      state === "future" && "text-foreground/80 dark:text-zinc-200 group-hover:text-foreground group-hover:font-semibold"
                    )}
                    style={{
                      color: state === "current" ? color : undefined,
                    }}
                  >
                    {status}
                  </span>
                </button>

                {/* Connector Line between Linear Steps */}
                {!isLast && (
                  <div
                    className={cn(
                      "h-1 w-6 sm:w-10 shrink-0 mx-1 rounded-full transition-all",
                      getStepState(linearPipeline[idx + 1].name, localStatusName, linearPipelineNames) === "future"
                        ? "bg-border/80 dark:bg-zinc-700"
                        : ""
                    )}
                    style={{
                      backgroundColor:
                        getStepState(linearPipeline[idx + 1].name, localStatusName, linearPipelineNames) !== "future"
                          ? color
                          : undefined,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
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
