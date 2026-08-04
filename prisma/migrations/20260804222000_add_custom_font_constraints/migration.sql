ALTER TABLE "CustomFontFamily"
ADD CONSTRAINT "CustomFontFamily_fallbackCategory_check"
CHECK ("fallbackCategory" IN ('serif', 'sans-serif', 'display', 'handwriting', 'monospace')),
ADD CONSTRAINT "CustomFontFamily_revision_check"
CHECK ("revision" > 0);

ALTER TABLE "CustomFontVariant"
ADD CONSTRAINT "CustomFontVariant_weight_check"
CHECK ("weight" BETWEEN 100 AND 900),
ADD CONSTRAINT "CustomFontVariant_style_check"
CHECK ("style" IN ('normal', 'italic')),
ADD CONSTRAINT "CustomFontVariant_format_check"
CHECK ("format" IN ('woff2', 'woff', 'ttf', 'otf')),
ADD CONSTRAINT "CustomFontVariant_sizeBytes_check"
CHECK ("sizeBytes" BETWEEN 1 AND 10485760),
ADD CONSTRAINT "CustomFontVariant_revision_check"
CHECK ("revision" > 0);
