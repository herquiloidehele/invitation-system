export function getGuestFormShellVariant(isMobile: boolean) {
  return isMobile ? "drawer" : "sheet";
}

export function getGuestFormSheetProps() {
  return {
    side: "right" as const,
    className: "w-full overflow-hidden sm:max-w-md",
    bodyClassName: "flex min-h-0 flex-col",
    formClassName: "min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4",
    footerClassName:
      "border-t bg-background/95 supports-backdrop-filter:backdrop-blur",
  };
}
