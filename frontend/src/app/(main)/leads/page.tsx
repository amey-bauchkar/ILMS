"use client";

import { useState } from "react";
import LeadsTable from "@/components/leads/LeadsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/leads/LeadForm";

export default function LeadsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your pipeline and track interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Lead
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.25rem)] sm:w-full sm:max-w-[840px] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-[#101117]/95 border border-white/15 backdrop-blur-2xl p-3.5 sm:p-7 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] rounded-2xl sm:rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <DialogHeader className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2.5 sm:gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs shrink-0">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="truncate">Add New Lead</span>
                </DialogTitle>
              </DialogHeader>
              <LeadForm onSuccess={() => {
                setDialogOpen(false);
                // LeadsTable will auto-refresh via useLeads hook
                window.location.reload();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <LeadsTable />
    </div>
  );
}