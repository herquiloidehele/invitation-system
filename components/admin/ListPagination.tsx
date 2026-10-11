"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { pageItems, type Pagination } from "@/lib/admin-list/params";
import { cn } from "@/lib/utils";

interface ListPaginationProps {
  pagination: Pagination;
  hrefFor: (page: number) => string;
  /** Runs the navigation inside the list's transition so the table can dim. */
  onNavigate: (href: string) => void;
  className?: string;
}

/**
 * "A mostrar 26–50 de 312" plus Anterior / page numbers / Seguinte. The
 * summary shows whenever there are rows; the controls only with several pages.
 */
export function ListPagination({
  pagination,
  hrefFor,
  onNavigate,
  className,
}: ListPaginationProps) {
  const { page, pageCount, total, from, to } = pagination;
  if (total === 0) return null;

  const follow = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Leave modified clicks alone so "open in new tab" keeps working.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href);
  };

  const stepLink = (target: number, enabled: boolean, children: ReactNode) =>
    enabled ? (
      <Link
        href={hrefFor(target)}
        onClick={(event) => follow(event, hrefFor(target))}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {children}
      </Link>
    ) : (
      <span
        aria-disabled="true"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none opacity-50",
        )}
      >
        {children}
      </span>
    );

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        A mostrar {from}–{to} de {total}
      </p>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          {stepLink(
            page - 1,
            page > 1,
            <>
              <ChevronLeft />
              Anterior
            </>,
          )}
          {pageItems(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Link
                key={item}
                href={hrefFor(item)}
                aria-current={item === page ? "page" : undefined}
                onClick={(event) => follow(event, hrefFor(item))}
                className={cn(
                  buttonVariants({
                    variant: item === page ? "default" : "outline",
                    size: "sm",
                  }),
                  "min-w-7 tabular-nums",
                )}
              >
                {item}
              </Link>
            ),
          )}
          {stepLink(
            page + 1,
            page < pageCount,
            <>
              Seguinte
              <ChevronRight />
            </>,
          )}
        </div>
      ) : null}
    </nav>
  );
}
