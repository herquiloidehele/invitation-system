"use client";

import type { CSSProperties } from "react";
import { Switch } from "@/components/ui/switch";
import { RSVPCustomListField } from "@/components/shared/RSVPCustomListField";
import { getVisibleRsvpCustomFields } from "@/lib/rsvp-custom-fields";
import type { RsvpCustomField, RsvpCustomListRow } from "@/lib/types";

export type RsvpCustomValue =
  | string
  | boolean
  | RsvpCustomListRow[]
  | undefined;
export type RsvpCustomValues = Record<string, RsvpCustomValue>;
export type RsvpCustomErrors = Record<string, string | undefined>;

function stringValue(value: RsvpCustomValue): string {
  return typeof value === "string" ? value : "";
}

function listValue(value: RsvpCustomValue): RsvpCustomListRow[] {
  return Array.isArray(value) ? value : [];
}

export function RSVPCustomFields({
  fields,
  attending,
  values,
  errors,
  onChange,
  labelStyle,
  inputClassName,
  inputStyle,
  choiceClassName,
  choiceStyle,
  switchClassName,
  switchStyle,
}: {
  fields: RsvpCustomField[];
  attending: boolean;
  values: RsvpCustomValues;
  errors: RsvpCustomErrors;
  onChange: (fieldId: string, value: RsvpCustomValue) => void;
  labelStyle: CSSProperties;
  inputClassName: string;
  inputStyle: CSSProperties;
  choiceClassName: string;
  choiceStyle: (selected: boolean) => CSSProperties;
  switchClassName: string;
  switchStyle: CSSProperties;
}) {
  const visibleFields = getVisibleRsvpCustomFields(fields, { attending, values });
  if (visibleFields.length === 0) return null;

  return (
    <>
      {visibleFields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <label style={labelStyle}>
            {field.label}
            {field.required ? " *" : ""}
          </label>
          {field.type === "list" ? (
            <RSVPCustomListField
              field={field}
              rows={listValue(values[field.id])}
              onChange={(rows) => onChange(field.id, rows)}
              labelStyle={labelStyle}
              inputClassName={inputClassName}
              inputStyle={inputStyle}
              choiceClassName={choiceClassName}
              choiceStyle={choiceStyle}
            />
          ) : field.type === "textarea" ? (
            <textarea
              rows={3}
              value={stringValue(values[field.id])}
              onChange={(event) => onChange(field.id, event.target.value)}
              placeholder={field.placeholder || undefined}
              className={`${inputClassName} resize-none`}
              style={inputStyle}
            />
          ) : field.type === "switch" ? (
            <div className={switchClassName} style={switchStyle}>
              <span>{values[field.id] === true ? "Sim" : "Não"}</span>
              <Switch
                checked={values[field.id] === true}
                onCheckedChange={(checked) => onChange(field.id, checked)}
              />
            </div>
          ) : field.type === "radio" ? (
            <div className="flex gap-3">
              {(field.options ?? []).map((option) => {
                const selected = values[field.id] === option.id;
                return (
                <label
                  key={option.id}
                  className={`${choiceClassName} text-center`}
                  style={{
                    ...choiceStyle(selected),
                    fontFamily: inputStyle.fontFamily,
                  }}
                >
                  <input
                    type="radio"
                    name={`custom-${field.id}`}
                    value={option.id}
                    checked={values[field.id] === option.id}
                    onChange={() => onChange(field.id, option.id)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
                );
              })}
            </div>
          ) : field.type === "select" ? (
            <select
              value={stringValue(values[field.id])}
              onChange={(event) =>
                onChange(field.id, event.target.value || undefined)
              }
              className={inputClassName}
              style={inputStyle}
            >
              <option value="">
                {field.placeholder || "Selecione uma opção"}
              </option>
              {(field.options ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={stringValue(values[field.id])}
              onChange={(event) => onChange(field.id, event.target.value)}
              placeholder={field.placeholder || undefined}
              className={inputClassName}
              style={inputStyle}
            />
          )}
          {errors[field.id] && (
            <span className="text-xs text-red-500">{errors[field.id]}</span>
          )}
        </div>
      ))}
    </>
  );
}
