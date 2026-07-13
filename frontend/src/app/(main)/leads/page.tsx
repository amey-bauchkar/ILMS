import { SavedViews } from "@/components/saved-views";

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
          <SavedViews />
        </div>
      </div>

      <div className="h-[600px] rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground">
        Lead Table Component (To be built by Tanmay)
      </div>
    </div>
  );
}
