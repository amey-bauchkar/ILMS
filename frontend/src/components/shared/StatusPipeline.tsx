"use client";

import { useState } from "react";
import { LeadStatus, statusColors } from "@/lib/mock-data";
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
import { CheckCircle2, Trophy, ChevronRight } from "lucide-react";

// ---------------------------------------------------------
// Constants
// ---------------------------------------------------------

const PIPELINE_STATUSES: LeadStatus[] = [
  "New",
  "Attempted Contact",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "On Hold",
  "Junk",
];

const LOST_REASONS = [
  "Budget",
  "Timing",
  "Went with competitor",
  "Not a fit",
  "No response",
  "Other",
] as const;

type LostReason = (typeof LOST_REASONS)[number];

// The "linear" progression (Won/Lost/On Hold/Junk are terminal)
const LINEAR_PIPELINE: LeadStatus[] = [
  "New",
  "Attempted Contact",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
];

const TERMINAL_STATUSES: LeadStatus[] = ["Won", "Lost", "On Hold", "Junk"];
const SPECIAL_STATUSES: LeadStatus[] = ["Lost", "On Hold", "Junk"];

function getStepState(
  status: LeadStatus,
  currentStatus: LeadStatus
): "completed" | "current" | "future" {
  const currentIdx = LINEAR_PIPELINE.indexOf(currentStatus);
  const statusIdx = LINEAR_PIPELINE.indexOf(status);
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
  targetStatus: LeadStatus | null;
  currentStatus: LeadStatus;
  onConfirm: (reason?: LostReason) => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  targetStatus,
  currentStatus,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [lostReason, setLostReason] = useState<LostReason | "">("");

  if (!targetStatus) return null;

  const isWon = targetStatus === "Won";
  const isLost = targetStatus === "Lost";

  function handleConfirm() {
    if (isLost && !lostReason) return;
    onConfirm(isLost ? (lostReason as LostReason) : undefined);
    setLostReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[400px] w-[92vw]">
        <DialogHeader>
          <DialogTitle>
            {isWon
              ? "🎉 Mark as Won?"
              : isLost
              ? "Mark as Lost"
              : `Move to "${targetStatus}"?`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {isWon && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Trophy className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm text-foreground">
                Congratulations! Moving{" "}
                <span className="font-medium">this lead</span> to{" "}
                <span className="font-medium text-green-500">Won</span>.
              </p>
            </div>
          )}

          {isLost && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current status:{" "}
                <span className="font-medium text-foreground">{currentStatus}</span>
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Reason for Loss <span className="text-destructive">*</span>
                </label>
                <Select
                  value={lostReason}
                  onValueChange={(v) => setLostReason(v as LostReason)}
                >
                  <SelectTrigger className="w-full bg-background border-input">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOST_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isWon && !isLost && (
            <p className="text-sm text-muted-foreground">
              Move status from{" "}
              <span className="font-medium text-foreground">{currentStatus}</span>{" "}
              to{" "}
              <span className="font-medium text-foreground">{targetStatus}</span>?
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLost && !lostReason}
            className={cn(isWon && "bg-green-500 hover:bg-green-500/80 text-white")}
          >
            {isWon ? "🎉 Confirm Won" : isLost ? "Mark as Lost" : "Confirm"}
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
  currentStatus: LeadStatus;
  onStatusChange?: (newStatus: LeadStatus, lostReason?: string) => void;
}

export function StatusPipeline({ currentStatus, onStatusChange }: StatusPipelineProps) {
  const [localStatus, setLocalStatus] = useState<LeadStatus>(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleStepClick(status: LeadStatus) {
    if (status === localStatus) return;
    setPendingStatus(status);
    setDialogOpen(true);
  }

  function handleConfirm(lostReason?: LostReason) {
    if (!pendingStatus) return;
    setLocalStatus(pendingStatus);
    onStatusChange?.(pendingStatus, lostReason);
    setDialogOpen(false);
    setPendingStatus(null);
  }

  function handleCancel() {
    setDialogOpen(false);
    setPendingStatus(null);
  }

  const isTerminal = TERMINAL_STATUSES.includes(localStatus);

  return (
    <div className="space-y-4">
      {/* Linear pipeline stepper */}
      <div
        className="overflow-x-auto pb-2"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-label="Lead status pipeline"
        role="navigation"
      >
        <div className="flex items-center min-w-max gap-0">
          {LINEAR_PIPELINE.map((status, idx) => {
            const state = getStepState(status, localStatus);
            const color = statusColors[status];
            const isLast = idx === LINEAR_PIPELINE.length - 1;

            return (
              <div key={status} className="flex items-center">
                {/* Step */}
                <button
                  type="button"
                  onClick={() => handleStepClick(status)}
                  disabled={state === "current"}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    state === "current" && "cursor-default",
                    state === "future" && "opacity-50 hover:opacity-80 cursor-pointer",
                    state === "completed" && "cursor-pointer hover:opacity-80"
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                      state === "completed" && "border-transparent",
                      state === "current" && "ring-4",
                      state === "future" && "border-dashed border-border bg-transparent"
                    )}
                    style={{
                      backgroundColor:
                        state === "completed"
                          ? color
                          : state === "current"
                          ? `${color}20`
                          : "transparent",
                      borderColor: state !== "future" ? color : undefined,
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": `${color}30`,
                    }}
                  >
                    {state === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : state === "current" ? (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-border" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight text-center max-w-[70px] whitespace-normal",
                      state === "current" && "font-semibold",
                      state === "future" && "text-muted-foreground"
                    )}
                    style={{ color: state !== "future" ? color : undefined }}
                  >
                    {status}
                  </span>
                </button>

                {/* Connector */}
                {!isLast && (
                  <div
                    className={cn("h-px w-4 shrink-0 mx-0.5")}
                    style={{
                      backgroundColor:
                        getStepState(LINEAR_PIPELINE[idx + 1], localStatus) !== "future"
                          ? color
                          : "var(--border)",
                      opacity:
                        getStepState(LINEAR_PIPELINE[idx + 1], localStatus) === "future" ? 0.3 : 1,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}

          {/* Separator for special statuses */}
          <ChevronRight className="h-4 w-4 text-border mx-2 shrink-0" aria-hidden="true" />

          {/* Special terminal statuses */}
          {SPECIAL_STATUSES.map((status) => {
            const isActive = localStatus === status;
            const color = statusColors[status];

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStepClick(status)}
                disabled={isActive}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all",
                  isActive ? "cursor-default" : "opacity-50 hover:opacity-80 cursor-pointer"
                )}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{
                    backgroundColor: isActive ? `${color}20` : "transparent",
                    borderColor: isActive ? color : "var(--border)",
                    borderStyle: isActive ? "solid" : "dashed",
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: isActive ? color : "var(--muted-foreground)" }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center max-w-[70px]",
                    !isActive && "text-muted-foreground"
                  )}
                  style={{ color: isActive ? color : undefined }}
                >
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current status badge */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColors[localStatus] }}
        />
        <span className="text-sm text-muted-foreground">
          Current status:{" "}
          <span className="font-medium" style={{ color: statusColors[localStatus] }}>
            {localStatus}
          </span>
        </span>
        {isTerminal && (
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
            Terminal
          </span>
        )}
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={dialogOpen}
        targetStatus={pendingStatus}
        currentStatus={localStatus}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
