import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ThemeProvider } from "@/components/admin/theme-provider";
import { createNoIndexMetadata } from "@/lib/seo";
import { countUnseenIntakes } from "@/lib/intake/service";

export const metadata: Metadata = createNoIndexMetadata();

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  // A badge must never take the admin down with it.
  const intakeBadge = await countUnseenIntakes().catch((error) => {
    console.error("[Admin] Could not count unseen intakes:", error);
    return 0;
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar intakeBadge={intakeBadge} />
          <SidebarInset>
            <AdminHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}
