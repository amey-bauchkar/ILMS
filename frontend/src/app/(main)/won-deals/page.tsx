"use client";

import { Suspense } from "react";
import { useLeads } from "@/hooks/use-data";
import { WonDealsDashboard } from "@/components/dashboard/WonDealsDashboard";
import { Loader2 } from "lucide-react";

function WonDealsContent() {
  const { leads, loading } = useLeads();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] shadow-lg border border-black/[0.05] dark:border-white/10 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#181b20] dark:text-[#c8f237]" />
          <span className="text-sm text-[#7d8592] dark:text-zinc-300 font-medium">
            Loading Won Deals & Project Updates...
          </span>
        </div>
      </div>
    );
  }

  return <WonDealsDashboard leads={leads} />;
}

export default function WonDealsPage() {
  return (
    <Suspense fallback={null}>
      <WonDealsContent />
    </Suspense>
  );
}
