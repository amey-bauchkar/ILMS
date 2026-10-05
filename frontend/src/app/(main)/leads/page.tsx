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
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground text-base">
            Manage your pipeline and track interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Lead
            </DialogTrigger>
            <DialogContent className="sm:max-w-[840px] w-[95vw] max-h-[92vh] overflow-y-auto bg-white border border-zinc-200/90 p-6 sm:p-7 text-zinc-900 shadow-2xl rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <DialogHeader className="mb-6 pb-4 border-b border-zinc-200/80">
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span>Add New Lead</span>
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