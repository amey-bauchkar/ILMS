import LeadsTable from "@/components/leads/LeadsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/leads/LeadForm";

export default function LeadsPage() {
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
          <Dialog>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Lead
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <DialogHeader className="mb-6">
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <LeadForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <LeadsTable />
    </div>
  );
}