"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/guest-links";
import type { GuestData, GuestUpsertInput } from "@/lib/types";
import {
  getGuestFormSheetProps,
  getGuestFormShellVariant,
} from "./guest-form-sheet";
import { buildGuestUpsertInput } from "./guest-form-payload";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
  phoneCountryCode: z.string().min(2),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (v) => {
        const digits = (v ?? "").replace(/[^0-9]/g, "");
        // Empty is allowed; otherwise must be 6–15 digits
        return (
          digits.length === 0 || (digits.length >= 6 && digits.length <= 15)
        );
      },
      { message: "Telefone deve ter entre 6 e 15 dígitos" },
    ),
  tableLabel: z.string().optional(),
  totalGuests: z.string().optional(),
  canInviteOthers: z.boolean(),
  note: z.string().optional(),
  customExternalLink: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GuestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the form is in edit mode. */
  guest?: GuestData;
  onSubmit: (input: GuestUpsertInput) => Promise<void>;
  saving: boolean;
  showCustomExternalLink?: boolean;
}

export default function GuestForm({
  open,
  onOpenChange,
  guest,
  onSubmit,
  saving,
  showCustomExternalLink = false,
}: GuestFormProps) {
  const isMobile = useIsMobile();
  const shellVariant = getGuestFormShellVariant(isMobile);
  const sheetProps = getGuestFormSheetProps();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      companion: "",
      phoneCountryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: "",
      tableLabel: "",
      totalGuests: "",
      canInviteOthers: false,
      note: "",
      customExternalLink: "",
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState } = form;

  // Sync form values when opening / switching guests
  useEffect(() => {
    if (!open) return;
    if (guest) {
      reset({
        name: guest.name,
        companion: guest.companion ?? "",
        phoneCountryCode: guest.phoneCountryCode || DEFAULT_COUNTRY_CODE,
        phoneNumber: guest.phoneNumber ?? "",
        tableLabel: guest.tableLabel ?? "",
        totalGuests: guest.totalGuests != null ? String(guest.totalGuests) : "",
        canInviteOthers: guest.canInviteOthers,
        note: guest.note ?? "",
        customExternalLink: guest.customExternalLink ?? "",
      });
    } else {
      reset({
        name: "",
        companion: "",
        phoneCountryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber: "",
        tableLabel: "",
        totalGuests: "",
        canInviteOthers: false,
        note: "",
        customExternalLink: "",
      });
    }
  }, [open, guest, reset]);

  const countryCode = watch("phoneCountryCode");
  const canInviteOthers = watch("canInviteOthers");

  async function submit(values: FormValues) {
    await onSubmit(buildGuestUpsertInput(values, { showCustomExternalLink }));
  }

  const title = guest ? "Editar convidado" : "Adicionar convidado";
  const description = guest
    ? "Actualiza os detalhes deste convidado."
    : "Preenche os detalhes do novo convidado.";

  const formContent = (
    <>
      <div className={sheetProps.bodyClassName}>
        <form
          onSubmit={handleSubmit(submit)}
          className={sheetProps.formClassName}
          id="guest-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="guest-name">Nome *</Label>
            <Input id="guest-name" {...register("name")} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-companion">Acompanhante</Label>
            <Input id="guest-companion" {...register("companion")} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 w-full">
              <Label htmlFor="guest-cc">Indicativo *</Label>
              <Select
                value={countryCode}
                onValueChange={(value) =>
                  setValue("phoneCountryCode", value ?? DEFAULT_COUNTRY_CODE, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="guest-cc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-1">{c.flag}</span>
                      <span className="font-mono text-xs">{c.code}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-phone">Telefone</Label>
              <Input
                id="guest-phone"
                inputMode="tel"
                {...register("phoneNumber")}
              />
              {formState.errors.phoneNumber && (
                <p className="text-xs text-destructive">
                  {formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-table">Mesa</Label>
            <Input
              id="guest-table"
              placeholder="Ex: Mesa 7 ou Os Amigos do Pedro"
              {...register("tableLabel")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-total">Nº de convidados</Label>
            <Input
              id="guest-total"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Ex: 2"
              {...register("totalGuests")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">
                Pode convidar mais pessoas
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quando activo, este convidado pode adicionar outros à lista a
                partir do convite pessoal.
              </p>
            </div>
            <Switch
              checked={canInviteOthers}
              onCheckedChange={(value) =>
                setValue("canInviteOthers", value, { shouldDirty: true })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-note">Nota</Label>
            <Textarea
              id="guest-note"
              rows={3}
              placeholder="Ex: Sem glúten, alergia a marisco, etc"
              {...register("note")}
            />
          </div>

          {showCustomExternalLink && (
            <div className="space-y-1.5">
              <Label htmlFor="guest-custom-external-link">
                Link Canva personalizado
              </Label>
              <Input
                id="guest-custom-external-link"
                type="url"
                placeholder="https://exemplo.canva.site/convite-maria"
                {...register("customExternalLink")}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Se estiver vazio, este convidado usa o link externo
                padrão do convite.
              </p>
            </div>
          )}
        </form>

        <div className="sr-only" aria-live="polite">
          {title}
        </div>
      </div>
    </>
  );

  if (shellVariant === "drawer") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          {formContent}

          <DrawerFooter className={sheetProps.footerClassName}>
            <DrawerClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DrawerClose>
            <Button type="submit" form="guest-form" disabled={saving}>
              {saving && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {guest ? "Guardar" : "Adicionar"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={sheetProps.side} className={sheetProps.className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {formContent}

        <div className={sheetProps.bodyClassName}>
          <SheetFooter className={sheetProps.footerClassName}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="guest-form" disabled={saving}>
              {saving && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {guest ? "Guardar" : "Adicionar"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
