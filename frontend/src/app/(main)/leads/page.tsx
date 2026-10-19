"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeadsTable from "@/components/leads/LeadsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/leads/LeadForm";

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams?.get("action") === "create" || searchParams?.get("openEdit") === "1") {
      setDialogOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111318] dark:text-white">Leads</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c8f237] text-[11px] font-bold text-[#111318] shadow-xs">
              Live Pipeline
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Manage your pipeline and track interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={
              <Button className="gap-2 bg-[#c8f237] hover:bg-[#bde82f] text-[#111318] font-bold shadow-sm rounded-full px-4 h-9" />
            }>
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.25rem)] sm:w-full sm:max-w-[840px] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-[#101117] border border-black/[0.08] dark:border-white/15 p-3.5 sm:p-7 text-[#111318] dark:text-white shadow-[0_25px_70px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.8)] rounded-2xl sm:rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <DialogHeader className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-black/[0.08] dark:border-white/10">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-[#111318] dark:text-white flex items-center gap-2.5 sm:gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#c8f237] border border-black/10 flex items-center justify-center text-[#111318] shadow-xs shrink-0 font-bold">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="truncate">Add New Lead</span>
                </DialogTitle>
              </DialogHeader>
              <LeadForm onSuccess={() => {
                setDialogOpen(false);
                router.refresh();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <LeadsTable />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsContent />
    </Suspense>
  );
}