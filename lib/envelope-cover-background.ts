export function getCoverBackgroundStyle(
  coverBackground: string | undefined,
  fallbackColor: string,
): Record<string, string> {
  const value = coverBackground?.trim() || fallbackColor;

  if (isImageBackground(value)) {
    return {
      backgroundImage: `url("${value}")`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    };
  }

  return { backgroundColor: value };
}

function isImageBackground(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  );
}
