"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useEffect } from "react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function SidebarContent({ collapsed, onNavItemClick }: { collapsed?: boolean; onNavItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={`flex items-center gap-2 px-2 mb-8 mt-2 ${collapsed ? 'justify-center' : ''}`}>
        <Image src="/logo.png" alt="Foremark Logo" width={32} height={32} className="object-contain" />
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-foreground">Foremark</span>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavItemClick}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto px-2 py-4 text-xs text-muted-foreground">
          Foremark ILMS v1.0
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <div 
      className={`hidden md:flex flex-col bg-card border-r border-border min-h-screen p-4 transition-all duration-300 relative ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <SidebarContent collapsed={collapsed} />
      
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-7 z-50 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronsRight className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronsLeft className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
