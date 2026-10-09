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
import { cn, resolveStatusColor } from "@/lib/utils";
import {
  CheckCircle2,
  Trophy,
  XCircle,
  PauseCircle,
  Ban,
  ArrowRight,
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

function getStepState(
  statusName: string,
  currentStatusName: string,
  linearPipelineNames: string[]
): "completed" | "current" | "future" {
  const currentIdx = linearPipelineNames.indexOf(currentStatusName);
  const statusIdx = linearPipelineNames.indexOf(statusName);
  if (statusIdx === -1) return "future";
  if (currentIdx === -1) return "future";
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
  const isOnHold = targetStatusName === "On Hold";
  const isJunk = targetStatusName === "Junk";

  function handleConfirm() {
    if (isLost && !lostReason) return;
    onConfirm(isLost ? (lostReason as LostReason) : undefined);
    setLostReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[420px] w-[92vw] bg-[#161822] border-white/10 text-zinc-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            {isWon && <Trophy className="h-5 w-5 text-emerald-400" />}
            {isLost && <XCircle className="h-5 w-5 text-rose-500" />}
            {isOnHold && <PauseCircle className="h-5 w-5 text-amber-400" />}
            {isJunk && <Ban className="h-5 w-5 text-zinc-400" />}
            {isWon
              ? "Mark Lead as Won!"
              : isLost
              ? "Mark Lead as Lost"
              : isOnHold
              ? "Place Lead On Hold"
              : isJunk
              ? "Mark Lead as Junk"
              : `Move to "${targetStatusName}"?`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isWon && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <Trophy className="h-6 w-6 text-emerald-400 shrink-0" />
              <p className="text-sm text-zinc-200">
                Congratulations! Moving this lead to{" "}
                <span className="font-bold text-emerald-400">Won</span> stage.
              </p>
            </div>
          )}

          {isLost && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">
                Current status:{" "}
                <span className="font-semibold text-white">{currentStatusName}</span>
              </p>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Reason for Loss <span className="text-rose-400">*</span>
                </label>
                <Select
                  value={lostReason}
                  onValueChange={(v) => setLostReason(v as LostReason)}
                >
                  <SelectTrigger className="w-full bg-zinc-900/90 border-white/15 text-zinc-100 focus:ring-rose-500">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-zinc-100">
                    {LOST_REASONS.map((r) => (
                      <SelectItem key={r} value={r} className="focus:bg-white/10 focus:text-white">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isWon && !isLost && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-zinc-300 flex items-center gap-2">
              <span>Change status from</span>
              <span className="font-semibold text-zinc-100 px-2 py-0.5 rounded bg-white/10">
                {currentStatusName}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-bold text-white px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                {targetStatusName}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-white/15 text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLost && !lostReason}
            className={cn(
              "font-semibold",
              isWon
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : isLost
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isWon ? "🎉 Confirm Won" : isLost ? "Mark as Lost" : "Confirm Move"}
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
  lostReason?: string | null;
  onStatusChange?: (newStatusId: string, lostReason?: string) => void;
}

export function StatusPipeline({
  currentStatus,
  lostReason,
  onStatusChange,
}: StatusPipelineProps) {
  const { statuses } = useStatuses();

  // Create pipelines from real DB statuses
  const linearPipeline = statuses.filter(
    (s) => !SPECIAL_STATUS_NAMES.includes(s.name)
  );
  const linearPipelineNames = linearPipeline.map((s) => s.name);
  const specialPipeline = statuses.filter((s) =>
    SPECIAL_STATUS_NAMES.includes(s.name)
  );

  const [localStatusName, setLocalStatusName] = useState<string>(currentStatus);
  const [pendingStatusName, setPendingStatusName] = useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleStepClick(statusName: string) {
    if (statusName === localStatusName) return;
    setPendingStatusName(statusName);
    setDialogOpen(true);
  }

  function handleConfirm(reason?: LostReason) {
    if (!pendingStatusName) return;
    setLocalStatusName(pendingStatusName);

    // Find the ID for the new status
    const newStatusObj = statuses.find((s) => s.name === pendingStatusName);
    if (newStatusObj) {
      onStatusChange?.(newStatusObj.id, reason);
    }

    setDialogOpen(false);
    setPendingStatusName(null);
  }

  function handleCancel() {
    setDialogOpen(false);
    setPendingStatusName(null);
  }

  const isTerminal = TERMINAL_STATUS_NAMES.includes(localStatusName);

  // Find current status color from DB or resolve default
  const currentStatusObj = statuses.find((s) => s.name === localStatusName);
  const currentStatusColor = resolveStatusColor(
    localStatusName,
    currentStatusObj?.color
  );

  if (statuses.length === 0)
    return (
      <div className="h-24 animate-pulse bg-zinc-900/60 rounded-xl border border-white/10" />
    );

  const currentLinearIndex = linearPipelineNames.indexOf(localStatusName);

  return (
    <div className="space-y-4">
      {/* Linear pipeline stepper + Special Statuses */}
      <div
        className="overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-label="Lead status pipeline"
        role="navigation"
      >
        <div className="flex items-center min-w-max gap-1 px-1 py-1">
          {linearPipeline.map((statusObj, idx) => {
            const status = statusObj.name;
            const state = getStepState(
              status,
              localStatusName,
              linearPipelineNames
            );
            const color = resolveStatusColor(status, statusObj.color);
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
                    "flex flex-col items-center gap-2 px-3 py-2.5 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    state === "current" &&
                      "bg-white/[0.08] border border-white/20 shadow-md cursor-default",
                    state === "completed" &&
                      "hover:bg-white/[0.06] cursor-pointer",
                    state === "future" &&
                      "hover:bg-white/[0.06] cursor-pointer"
                  )}
                >
                  {/* Circle Indicator */}
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all",
                      state === "completed" && "shadow-md",
                      state === "current" && "ring-4 border-2 shadow-lg",
                      state === "future" &&
                        "border-2 border-white/20 bg-zinc-900/80 group-hover:border-white/50 group-hover:bg-zinc-800"
                    )}
                    style={{
                      backgroundColor:
                        state === "completed"
                          ? color
                          : state === "current"
                          ? `${color}25`
                          : undefined,
                      borderColor:
                        state === "current"
                          ? color
                          : state === "completed"
                          ? color
                          : undefined,
                      // @ts-expect-error custom tw ring color
                      "--tw-ring-color":
                        state === "current" ? `${color}40` : undefined,
                    }}
                  >
                    {state === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : state === "current" ? (
                      <div
                        className="w-3.5 h-3.5 rounded-full animate-pulse shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ) : (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color, opacity: 0.9 }}
                      />
                    )}
                  </div>

                  {/* High-Contrast Label */}
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs leading-tight text-center max-w-[85px] transition-colors",
                      state === "current" &&
                        "font-bold text-white drop-shadow-sm",
                      state === "completed" &&
                        "font-semibold text-zinc-100 group-hover:text-white",
                      state === "future" &&
                        "font-medium text-zinc-300 group-hover:text-white"
                    )}
                  >
                    {status}
                  </span>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className="h-1 w-4 sm:w-7 shrink-0 rounded-full mx-0.5 transition-all"
                    style={{
                      backgroundColor:
                        getStepState(
                          linearPipeline[idx + 1].name,
                          localStatusName,
                          linearPipelineNames
                        ) !== "future"
                          ? color
                          : "rgba(255, 255, 255, 0.15)",
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}

          {/* Sleek Vertical Divider */}
          <div
            className="h-10 w-px bg-white/20 mx-3 shrink-0"
            aria-hidden="true"
          />

          {/* Special Terminal Statuses (Lost, On Hold, Junk) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {specialPipeline.map((statusObj) => {
              const status = statusObj.name;
              const isActive = localStatusName === status;
              const color = resolveStatusColor(status, statusObj.color);

              const Icon =
                status === "Lost"
                  ? XCircle
                  : status === "On Hold"
                  ? PauseCircle
                  : Ban;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStepClick(status)}
                  disabled={isActive}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-white/[0.12] border-2 shadow-md cursor-default text-white"
                      : "border-white/20 bg-zinc-900/80 hover:bg-zinc-800 hover:border-white/40 text-zinc-300 hover:text-white cursor-pointer"
                  )}
                  style={{
                    borderColor: isActive ? color : undefined,
                    boxShadow: isActive ? `0 0 12px ${color}30` : undefined,
                  }}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: isActive ? color : color }}
                  />
                  <span>{status}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Status Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08] text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-400 font-medium">Current Status:</span>
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-bold shadow-xs"
            style={{
              borderColor: `${currentStatusColor}50`,
              backgroundColor: `${currentStatusColor}15`,
              color: currentStatusColor,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentStatusColor }}
            />
            <span>{localStatusName}</span>
          </div>

          {localStatusName === "Lost" && lostReason && (
            <span className="text-zinc-400 font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full text-[11px]">
              Reason: {lostReason}
            </span>
          )}

          {currentLinearIndex >= 0 && (
            <span className="text-zinc-400 font-medium hidden sm:inline-block">
              (Stage {currentLinearIndex + 1} of {linearPipeline.length})
            </span>
          )}
        </div>

        <span className="text-[11px] text-zinc-400 font-normal">
          Click any stage above to move lead
        </span>
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
