"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  CreateIntakeDialog,
  type IntakeDemoOption,
} from "@/components/admin/CreateIntakeDialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { getIntakePath } from "@/lib/admin-row-navigation";

/**
 * Edit-page header shortcuts for customer intake forms: create a link for a
 * demo, or jump to the answers a customer record was built from.
 */
export function IntakeHeaderActions({
  demo,
  sourceIntakeId,
}: {
  demo?: IntakeDemoOption | null;
  sourceIntakeId?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {sourceIntakeId ? (
        <Link
          href={getIntakePath(sourceIntakeId)}
          className={buttonVariants({ variant: "outline" })}
        >
          <ClipboardList className="size-4" />
          Respostas do formulário
        </Link>
      ) : null}
      {demo ? (
        <>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <ClipboardList className="size-4" />
            Criar formulário
          </Button>
          <CreateIntakeDialog open={open} onOpenChange={setOpen} preset={demo} />
        </>
      ) : null}
    </>
  );
}
