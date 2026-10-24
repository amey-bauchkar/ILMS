"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Headphones, 
  ArrowLeft, 
  MessageSquare,
  Compass,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Compass },
  { name: "Projects", href: "/won-deals", icon: Trophy },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Pulse", href: "/dashboard?tab=pulse", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function SidebarContent({ onNavItemClick }: { onNavItemClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  return (
    <div className="flex flex-col h-full justify-between items-center w-full py-2">
      {/* Top: Logo & Back Button */}
      <div className="flex flex-col items-center gap-3.5 w-full">
        {/* Brand Logo Squircle */}
        <Link 
          href="/dashboard"
          className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151821] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center p-2.5 transition-transform hover:scale-105 active:scale-95 group"
          title="Foremark CRM"
        >
          <Image src="/logo.png" alt="Foremark Logo" width={26} height={26} className="object-contain" />
        </Link>

        {/* Floating Back Arrow Circle */}
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-[#151821] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all active:scale-90"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Floating Vertical Icon Capsule Rail */}
        <nav className="flex flex-col items-center gap-2 p-1.5 rounded-full bg-white dark:bg-[#151821] shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-black/[0.05] dark:border-white/10 mt-1">
          {navItems.map((item) => {
            const isDashboardTab = item.href === "/dashboard";
            const isPulseTab = item.href === "/dashboard?tab=pulse";

            let isActive = false;
            if (pathname === "/dashboard") {
              if (isDashboardTab && currentTab === "dashboard") isActive = true;
              else if (isPulseTab && currentTab === "pulse") isActive = true;
            } else if (!item.href.includes("?")) {
              isActive = pathname.startsWith(item.href);
            }
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavItemClick}
                title={item.name}
                className={cn(
                  "flex items-center justify-center transition-all duration-300 relative group rounded-full",
                  isActive
                    ? "w-10 h-10 bg-[#181b20] dark:bg-white text-white dark:text-[#111318] shadow-md shadow-black/20"
                    : "w-9 h-9 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-[#c8f237] dark:text-[#111318]" : "text-zinc-500 dark:text-zinc-400")} />
                
                {/* Micro tooltip pill on hover */}
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#181b20] dark:bg-black border dark:border-white/15 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg whitespace-nowrap z-50">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Help / Support Circle */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <button
          type="button"
          onClick={() => alert("Foremark CRM Support & Help: support@foremark.com")}
          className="w-10 h-10 rounded-full border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all active:scale-90 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          title="Customer Support & Help"
        >
          <Headphones className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-16 shrink-0 h-full py-2 z-20">
      <Suspense fallback={null}>
        <SidebarContent />
      </Suspense>
    </aside>
  );
}
