export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground text-base">
          Welcome back to Foremark CRM. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for Janhavi to build out */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
        ))}
      </div>
      
      <div className="h-[400px] rounded-xl bg-card border border-border animate-pulse" />
    </div>
  );
}
