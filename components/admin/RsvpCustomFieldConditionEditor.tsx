"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RSVP_BUILDER_SELECT_POPUP_CLASS } from "@/components/admin/RsvpCustomOptionsEditor";
import type { RsvpConditionTrigger } from "@/lib/rsvp-custom-fields";
import type { RsvpCustomFieldCondition } from "@/lib/types";

// Select values must be strings; switch answers are booleans.
const answerKey = (value: string | boolean) => String(value);

/** Picks the earlier question, and the answer to it, that reveal a field. */
export function RsvpCustomFieldConditionEditor({
  triggers,
  value,
  disabled = false,
  onChange,
}: {
  triggers: RsvpConditionTrigger[];
  value: RsvpCustomFieldCondition | undefined;
  disabled?: boolean;
  onChange: (condition: RsvpCustomFieldCondition) => void;
}) {
  const trigger =
    triggers.find((item) => item.id === value?.fieldId) ?? triggers[0];
  if (!trigger) return null;

  const selectedAnswer =
    trigger.answers.find((answer) => answer.value === value?.value) ??
    trigger.answers[0];
  const triggerItems = triggers.map((item) => ({
    value: item.id,
    label: item.label.trim() || "Pergunta sem texto",
  }));
  const answerItems = trigger.answers.map((answer, index) => ({
    value: answerKey(answer.value),
    label: answer.label.trim() || `Opção ${index + 1}`,
  }));

  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Pergunta</Label>
        <Select
          items={triggerItems}
          value={trigger.id}
          disabled={disabled}
          onValueChange={(fieldId) => {
            const next = triggers.find((item) => item.id === fieldId);
            if (next) {
              onChange({ fieldId: next.id, value: next.answers[0].value });
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={RSVP_BUILDER_SELECT_POPUP_CLASS}>
            {triggerItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Resposta</Label>
        <Select
          items={answerItems}
          value={answerKey(selectedAnswer.value)}
          disabled={disabled}
          onValueChange={(key) => {
            const answer = trigger.answers.find(
              (item) => answerKey(item.value) === key,
            );
            if (answer) onChange({ fieldId: trigger.id, value: answer.value });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={RSVP_BUILDER_SELECT_POPUP_CLASS}>
            {answerItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground sm:col-span-2">
        O campo só aparece quando o convidado der esta resposta.
      </p>
    </div>
  );
}
