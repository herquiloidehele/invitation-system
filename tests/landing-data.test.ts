import { describe, expect, it } from "vitest";

import {
  getFaqs,
  type LandingTranslator,
} from "@/components/landing/landing-data";

function fakeTranslator(
  items: { question: string; answer: string }[],
): LandingTranslator {
  const t = ((key: string, values?: Record<string, string | number>) => {
    if (key === "urgency.question") return "Urgency question";
    if (key === "urgency.answer") return `Urgency answer ${values?.price}`;
    return key;
  }) as LandingTranslator;
  t.raw = (key: string) => (key === "items" ? items : undefined);
  return t;
}

describe("getFaqs", () => {
  const items = Array.from({ length: 10 }, (_, i) => ({
    question: `Q${i}`,
    answer: `A${i}`,
  }));

  it("inserts the urgency FAQ after the turnaround item with the interpolated price", () => {
    const faqs = getFaqs(fakeTranslator(items), "1800 MZN");

    expect(faqs).toHaveLength(11);
    expect(faqs[0]).toEqual(items[0]); // turnaround stays first
    expect(faqs[1]).toEqual({
      question: "Urgency question",
      answer: "Urgency answer 1800 MZN",
    });
    expect(faqs.slice(2)).toEqual(items.slice(1)); // remaining originals preserved, in order
  });

  it("returns just the urgency item when there are no base items", () => {
    const faqs = getFaqs(fakeTranslator([]), "25 €");
    expect(faqs).toEqual([
      { question: "Urgency question", answer: "Urgency answer 25 €" },
    ]);
  });
});
