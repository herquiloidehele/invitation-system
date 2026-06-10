"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  RsvpCustomField,
  RsvpCustomFieldOption,
  RsvpCustomFieldType,
} from "@/lib/types";

const FIELD_TYPES: { value: RsvpCustomFieldType; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "switch", label: "Sim/Não" },
  { value: "radio", label: "Escolha única (botões)" },
  { value: "select", label: "Escolha única (lista)" },
];

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function needsOptions(type: RsvpCustomFieldType) {
  return type === "radio" || type === "select";
}

function createField(): RsvpCustomField {
  return {
    id: newId("rsvp-field"),
    label: "",
    type: "text",
    required: false,
    visibility: "always",
  };
}

function createOption(): RsvpCustomFieldOption {
  return { id: newId("rsvp-option"), label: "" };
}

export function RsvpCustomFieldsBuilder({
  fields,
  onChange,
}: {
  fields: RsvpCustomField[];
  onChange: (fields: RsvpCustomField[]) => void;
}) {
  const updateField = (id: string, patch: Partial<RsvpCustomField>) => {
    onChange(
      fields.map((field) => {
        if (field.id !== id) return field;
        const next = { ...field, ...patch };
        if (!needsOptions(next.type)) {
          delete next.options;
        } else if (!next.options || next.options.length === 0) {
          next.options = [createOption()];
        }
        return next;
      }),
    );
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const next = [...fields];
    const [field] = next.splice(index, 1);
    next.splice(nextIndex, 0, field);
    onChange(next);
  };

  const updateOption = (fieldId: string, optionId: string, label: string) => {
    onChange(
      fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: (field.options ?? []).map((option) =>
                option.id === optionId ? { ...option, label } : option,
              ),
            }
          : field,
      ),
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Campos personalizados</Label>
          <p className="text-xs text-muted-foreground">
            Perguntas extras para recolher detalhes como crianças, transporte ou
            refeição.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...fields, createField()])}
        >
          <Plus className="mr-1.5 size-4" />
          Adicionar
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhum campo personalizado configurado.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-3 rounded-md border bg-background p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Campo {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => moveField(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === fields.length - 1}
                onClick={() => moveField(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() =>
                  onChange(fields.filter((item) => item.id !== field.id))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Pergunta</Label>
              <Input
                value={field.label}
                onChange={(event) =>
                  updateField(field.id, { label: event.target.value })
                }
                placeholder="Ex: Vai precisar de transporte?"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={field.type}
                onValueChange={(value) =>
                  updateField(field.id, { type: value as RsvpCustomFieldType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Visibilidade</Label>
              <Select
                value={field.visibility}
                onValueChange={(value) =>
                  updateField(field.id, {
                    visibility: value as RsvpCustomField["visibility"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre mostrar</SelectItem>
                  <SelectItem value="attending">
                    Só se confirmar presença
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <Label>Obrigatório</Label>
              <p className="text-xs text-muted-foreground">
                O convidado precisa responder quando o campo estiver visível.
              </p>
            </div>
            <Switch
              checked={field.required}
              onCheckedChange={(required) =>
                updateField(field.id, { required })
              }
            />
          </div>

          {needsOptions(field.type) && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {(field.options ?? []).map((option, optionIndex) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) =>
                      updateOption(field.id, option.id, event.target.value)
                    }
                    placeholder={`Opção ${optionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() =>
                      updateField(field.id, {
                        options: (field.options ?? []).filter(
                          (item) => item.id !== option.id,
                        ),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField(field.id, {
                    options: [...(field.options ?? []), createOption()],
                  })
                }
              >
                <Plus className="mr-1.5 size-4" />
                Adicionar opção
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
