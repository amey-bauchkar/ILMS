import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { UserProvider } from "@/components/providers/user-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
