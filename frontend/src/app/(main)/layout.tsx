import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { UserProvider } from "@/components/providers/user-provider";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="min-h-screen w-full bg-[#edf0f4] dark:bg-[#0d0f14] text-[#111318] dark:text-[#f8fafc] flex flex-col p-3 sm:p-5 lg:p-6 gap-3 sm:gap-4 font-sans select-none overflow-x-hidden transition-colors duration-200">
        {/* Top Navigation Bar */}
        <Suspense fallback={<div className="h-16 w-full rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse" />}>
          <Topbar />
        </Suspense>

        {/* Main Workspace: Left Slim Floating Rail + Main Content Area */}
        <div className="flex-1 flex gap-3 sm:gap-5 min-w-0">
          <Suspense fallback={<div className="w-16 h-[500px] rounded-3xl bg-white/40 dark:bg-white/5 animate-pulse" />}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
