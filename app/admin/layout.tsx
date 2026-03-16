import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/admin/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ThemeProvider } from "@/components/admin/theme-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
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
