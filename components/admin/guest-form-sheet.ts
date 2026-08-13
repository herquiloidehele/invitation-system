export function getGuestFormSheetProps() {
  return {
    className:
      "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-h-[85dvh] sm:max-w-md",
    headerClassName: "px-4 pt-4 pb-3",
    formClassName: "min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4",
    footerClassName:
      "mx-0 mb-0 rounded-b-xl border-t bg-background/95 supports-backdrop-filter:backdrop-blur",
  };
}
