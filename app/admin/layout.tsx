import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-6 px-6">
          <Link
            href="/admin"
            className="font-semibold text-lg tracking-tight"
          >
            Brindel Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/admin"
              className="hover:text-foreground transition-colors"
            >
              Invitations
            </Link>
          </nav>
          <div className="ml-auto">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              View Site &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">{children}</main>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
