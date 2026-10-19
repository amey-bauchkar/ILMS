"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./sidebar";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export function FloatingDock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#12131a]/85 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-r border-white/10 pr-2.5">
          <Layers className="w-3 h-3 text-primary" />
          <span>SWITCH</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={`dock-${item.name}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all active:scale-95",
                  isActive
                    ? "bg-primary text-white font-semibold shadow-md shadow-primary/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
