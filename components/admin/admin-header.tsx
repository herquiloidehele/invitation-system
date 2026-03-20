"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/admin/theme-switcher";

export function AdminHeader() {
  const pathname = usePathname();

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem
                  className={index === 0 ? "hidden md:block" : ""}
                >
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto px-4">
        <ThemeSwitcher />
      </div>
    </header>
  );
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  if (segments[0] === "admin") {
    if (segments[1] === "invitations") {
      crumbs.push({ label: "Admin", href: "/admin" });
      crumbs.push({ label: "Convites", href: "/admin/invitations" });

      if (segments[2] === "new") {
        crumbs.push({ label: "Criar Novo", href: "/admin/invitations/new" });
      } else if (segments[2] && segments[3] === "edit") {
        crumbs.push({
          label: "Editar",
          href: `/admin/invitations/${segments[2]}/edit`,
        });
      }
    } else {
      crumbs.push({ label: "Painel", href: "/admin" });
    }
  }

  return crumbs.length > 0 ? crumbs : [{ label: "Painel", href: "/admin" }];
}
