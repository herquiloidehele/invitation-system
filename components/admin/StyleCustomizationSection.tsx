"use client";

import { getModelStyleEditor } from "@/components/models";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StyleCustomizationSectionProps {
  /** The model component name (e.g. "ModernMinimal") — determines which editor to load. */
  modelComponent: string;
  /** Current styles to display and edit (opaque — passed through to the model editor). */
  styles: Record<string, unknown>;
  /** Callback to update a single top-level style field. */
  onStyleChange: (key: string, value: unknown) => void;
  /** Which accordion subsections to open by default. */
  defaultOpen?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Dynamic style editor dispatcher.
 * Loads the model-specific StyleEditor component based on the selected model.
 * Falls back to a message if the model has no custom editor.
 */
export default function StyleCustomizationSection({
  modelComponent,
  styles,
  onStyleChange,
  defaultOpen = [],
}: StyleCustomizationSectionProps) {
  const StyleEditor = getModelStyleEditor(modelComponent);

  if (!StyleEditor) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Este modelo não possui editor de estilos personalizado.
      </p>
    );
  }

  return (
    <StyleEditor
      styles={styles}
      onStyleChange={onStyleChange}
      defaultOpen={defaultOpen}
    />
  );
}
