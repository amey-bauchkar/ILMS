import { SavedViews } from "@/components/saved-views";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
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
