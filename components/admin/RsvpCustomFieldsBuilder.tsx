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
import { RsvpCustomFieldConditionEditor } from "@/components/admin/RsvpCustomFieldConditionEditor";
import {
  createRsvpListColumn,
  RsvpCustomListColumnsEditor,
} from "@/components/admin/RsvpCustomListColumnsEditor";
import {
  createRsvpOption,
  RSVP_BUILDER_SELECT_POPUP_CLASS,
  RsvpCustomOptionsEditor,
} from "@/components/admin/RsvpCustomOptionsEditor";
import {
  getRsvpConditionTriggers,
  reconcileRsvpCustomFieldConditions,
} from "@/lib/rsvp-custom-fields";
import type {
  RsvpCustomField,
  RsvpCustomFieldType,
  RsvpCustomFieldVisibility,
} from "@/lib/types";

const FIELD_TYPES: { value: RsvpCustomFieldType; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "switch", label: "Sim/Não" },
  { value: "radio", label: "Escolha única (botões)" },
  { value: "select", label: "Escolha única (lista)" },
  { value: "list", label: "Lista (várias linhas)" },
];

const VISIBILITIES: { value: RsvpCustomFieldVisibility; label: string }[] = [
  { value: "always", label: "Sempre mostrar" },
  { value: "attending", label: "Só se confirmar presença" },
  { value: "conditional", label: "Depende de outra resposta" },
];

function needsOptions(type: RsvpCustomFieldType) {
  return type === "radio" || type === "select";
}

/** Sim/Não, button choices and lists have no empty state to hint at. */
function supportsPlaceholder(type: RsvpCustomFieldType) {
  return type === "text" || type === "textarea" || type === "select";
}

function createField(): RsvpCustomField {
  return {
    id: `rsvp-field-${crypto.randomUUID()}`,
    label: "",
    type: "text",
    required: false,
    visibility: "always",
  };
}

export function RsvpCustomFieldsBuilder({
  fields,
  sourceValue,
  structureLocked = false,
  allowListType = true,
  onChange,
}: {
  fields: RsvpCustomField[];
  sourceValue?: RsvpCustomField[];
  structureLocked?: boolean;
  /** False where the guest form cannot draw a list (AI-built invitations). */
  allowListType?: boolean;
  onChange: (fields: RsvpCustomField[]) => void;
}) {
  const sourceById = new Map(
    (sourceValue ?? []).map((field) => [field.id, field]),
  );

  // Every edit goes through here so a condition can never outlive its trigger.
  const commit = (next: RsvpCustomField[]) =>
    onChange(reconcileRsvpCustomFieldConditions(next));

  const updateField = (id: string, patch: Partial<RsvpCustomField>) => {
    commit(
      fields.map((field) => {
        if (field.id !== id) return field;
        const next = { ...field, ...patch };

        if (!needsOptions(next.type)) {
          delete next.options;
        } else if (!next.options || next.options.length === 0) {
          next.options = [createRsvpOption()];
        }
        if (!supportsPlaceholder(next.type)) {
          delete next.placeholder;
        }
        if (next.type !== "list") {
          delete next.columns;
          delete next.addLabel;
        } else if (!next.columns || next.columns.length === 0) {
          next.columns = [createRsvpListColumn()];
        }
        if (next.visibility === "conditional" && !next.showWhen) {
          const trigger = getRsvpConditionTriggers(fields, id)[0];
          if (trigger) {
            next.showWhen = {
              fieldId: trigger.id,
              value: trigger.answers[0].value,
            };
          }
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
    commit(next);
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
          disabled={structureLocked}
          onClick={() => commit([...fields, createField()])}
        >
          <Plus className="mr-1.5 size-4" />
          Adicionar
        </Button>
      </div>

      {structureLocked && (
        <p className="text-xs text-muted-foreground">
          A estrutura é editada em Português.
        </p>
      )}

      {!allowListType && (
        <p className="text-xs text-muted-foreground">
          Convites criados com IA ainda não suportam campos do tipo Lista.
        </p>
      )}

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhum campo personalizado configurado.
        </p>
      )}

      {fields.map((field, index) => {
        const source = sourceById.get(field.id);
        // In a translation locale the labels being edited start blank, so
        // name the triggers by their Portuguese text instead.
        const triggers = getRsvpConditionTriggers(fields, field.id).map(
          (trigger) => {
            const sourceTrigger = sourceById.get(trigger.id);
            return {
              ...trigger,
              label: trigger.label.trim() || sourceTrigger?.label || "",
              answers: trigger.answers.map((answer) => ({
                ...answer,
                label:
                  answer.label.trim() ||
                  sourceTrigger?.options?.find(
                    (option) => option.id === answer.value,
                  )?.label ||
                  "",
              })),
            };
          },
        );
        const fieldTypes = FIELD_TYPES.filter(
          (type) =>
            type.value !== "list" || allowListType || field.type === "list",
        );

        return (
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
                  disabled={structureLocked || index === 0}
                  onClick={() => moveField(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={structureLocked || index === fields.length - 1}
                  onClick={() => moveField(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={structureLocked}
                  onClick={() =>
                    commit(fields.filter((item) => item.id !== field.id))
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
                  placeholder={
                    source?.label || "Ex: Vai precisar de transporte?"
                  }
                />
              </div>

              {supportsPlaceholder(field.type) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Texto de exemplo</Label>
                  <Input
                    value={field.placeholder ?? ""}
                    onChange={(event) =>
                      updateField(field.id, {
                        placeholder: event.target.value,
                      })
                    }
                    placeholder={
                      source?.placeholder ||
                      (field.type === "select"
                        ? "Ex: Selecione uma opção"
                        : "Ex: João e Maria")
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {field.type === "select"
                      ? "Aparece como primeira opção da lista, antes de escolher."
                      : "Aparece dentro do campo enquanto está vazio."}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  items={fieldTypes}
                  value={field.type}
                  disabled={structureLocked}
                  onValueChange={(value) =>
                    updateField(field.id, {
                      type: value as RsvpCustomFieldType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={RSVP_BUILDER_SELECT_POPUP_CLASS}>
                    {fieldTypes.map((type) => (
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
                  items={VISIBILITIES}
                  value={field.visibility}
                  disabled={structureLocked}
                  onValueChange={(value) =>
                    updateField(field.id, {
                      visibility: value as RsvpCustomFieldVisibility,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={RSVP_BUILDER_SELECT_POPUP_CLASS}>
                    {VISIBILITIES.map((visibility) => (
                      <SelectItem
                        key={visibility.value}
                        value={visibility.value}
                        disabled={
                          visibility.value === "conditional" &&
                          triggers.length === 0
                        }
                      >
                        {visibility.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {index > 0 && triggers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Para depender de outra resposta, adicione antes um campo
                    Sim/Não ou de escolha única.
                  </p>
                )}
              </div>

              {field.visibility === "conditional" && (
                <RsvpCustomFieldConditionEditor
                  triggers={triggers}
                  value={field.showWhen}
                  disabled={structureLocked}
                  onChange={(showWhen) => updateField(field.id, { showWhen })}
                />
              )}
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
              <RsvpCustomOptionsEditor
                options={field.options ?? []}
                sourceOptions={source?.options}
                structureLocked={structureLocked}
                onChange={(options) => updateField(field.id, { options })}
              />
            )}

            {field.type === "list" && (
              <RsvpCustomListColumnsEditor
                columns={field.columns ?? []}
                addLabel={field.addLabel}
                sourceColumns={source?.columns}
                sourceAddLabel={source?.addLabel}
                structureLocked={structureLocked}
                onColumnsChange={(columns) =>
                  updateField(field.id, { columns })
                }
                onAddLabelChange={(addLabel) =>
                  updateField(field.id, { addLabel })
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
