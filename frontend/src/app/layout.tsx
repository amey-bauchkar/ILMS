import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foremark CRM",
  description: "Internal Lead Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('foremark-theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#edf0f4] dark:bg-[#0d0f14] text-foreground transition-colors duration-200 relative overflow-x-hidden selection:bg-primary/20 selection:text-black">
        {/* Soft Studio Ambient Background */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-opacity duration-300 dark:opacity-25">
          <div className="absolute -top-40 -left-20 w-[700px] h-[700px] rounded-full bg-white/70 dark:bg-emerald-500/10 blur-[140px]" />
          <div className="absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full bg-blue-100/40 dark:bg-indigo-500/10 blur-[160px]" />
          <div className="absolute -bottom-32 left-1/3 w-[700px] h-[700px] rounded-full bg-slate-200/50 dark:bg-[#c8f237]/5 blur-[150px]" />
        </div>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
