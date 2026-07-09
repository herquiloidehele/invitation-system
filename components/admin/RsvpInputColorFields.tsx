import { X } from "lucide-react";
import type { InvitationData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RsvpColorField =
  | "inputBackgroundColor"
  | "inputTextColor"
  | "inputPlaceholderColor"
  | "inputBorderColor";

const COLOR_ROWS: { field: RsvpColorField; label: string; fallback: string }[] =
  [
    {
      field: "inputBackgroundColor",
      label: "Fundo dos campos",
      fallback: "#ffffff",
    },
    {
      field: "inputTextColor",
      label: "Texto dos campos",
      fallback: "#111111",
    },
    {
      field: "inputPlaceholderColor",
      label: "Placeholder dos campos",
      fallback: "#999999",
    },
    {
      field: "inputBorderColor",
      label: "Borda dos campos",
      fallback: "#dddddd",
    },
  ];

function colorPickerValue(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value! : fallback;
}

export function RsvpInputColorFields({
  rsvp,
  onChange,
}: {
  rsvp: InvitationData["rsvp"];
  onChange: (field: RsvpColorField, value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label>Cores dos campos RSVP</Label>
        <p className="text-xs text-muted-foreground">
          Personaliza o fundo, texto digitado e placeholders dos inputs.
        </p>
      </div>
      <div className="space-y-2">
        {COLOR_ROWS.map(({ field, label, fallback }) => (
          <div key={field} className="grid grid-cols-[1fr_auto] gap-2">
            <div className="min-w-0 space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorPickerValue(rsvp[field], fallback)}
                  onChange={(event) => onChange(field, event.target.value)}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                  aria-label={label}
                />
                <Input
                  value={rsvp[field] ?? ""}
                  onChange={(event) => onChange(field, event.target.value)}
                  placeholder={fallback}
                  className="h-8 min-w-0 font-mono text-sm"
                />
              </div>
            </div>
            {rsvp[field] ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6 h-8 w-8"
                onClick={() => onChange(field, "")}
                aria-label={`Limpar ${label.toLowerCase()}`}
              >
                <X size={14} />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
