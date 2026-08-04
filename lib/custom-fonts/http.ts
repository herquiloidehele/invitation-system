import { NextResponse } from "next/server";

const STATUS_BY_CODE: Record<string, number> = {
  invalid_input: 400,
  invalid_pending_key: 400,
  upload_changed: 400,
  not_found: 404,
  duplicate_family: 409,
  replacement_required: 409,
  font_in_use: 409,
  file_too_large: 413,
};

export function customFontErrorResponse(error: unknown): NextResponse {
  if (error && typeof error === "object" && "code" in error) {
    const code = typeof error.code === "string" ? error.code : "invalid_input";
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "Custom font request failed";
    const details =
      "details" in error &&
      error.details &&
      typeof error.details === "object" &&
      !Array.isArray(error.details)
        ? error.details
        : {};
    return NextResponse.json(
      { error: message, code, ...details },
      { status: STATUS_BY_CODE[code] ?? 400 },
    );
  }
  console.error("[custom-fonts] Unhandled request error", error);
  return NextResponse.json(
    { error: "Custom font request failed", code: "internal_error" },
    { status: 500 },
  );
}
