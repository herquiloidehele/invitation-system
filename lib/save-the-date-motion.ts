export interface SaveTheDateSparkle {
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
}

const SAVE_THE_DATE_SPARKLES: SaveTheDateSparkle[] = [
  { top: "8%", left: "13%", size: 5, delay: 0.2, duration: 3.6 },
  { top: "13%", left: "78%", size: 3, delay: 0.8, duration: 4.2 },
  { top: "24%", left: "18%", size: 4, delay: 1.1, duration: 3.4 },
  { top: "30%", left: "86%", size: 6, delay: 0.4, duration: 4.8 },
  { top: "48%", left: "8%", size: 3, delay: 1.6, duration: 3.8 },
  { top: "58%", left: "90%", size: 4, delay: 1.9, duration: 4.4 },
  { top: "76%", left: "17%", size: 5, delay: 0.9, duration: 5 },
  { top: "82%", left: "73%", size: 3, delay: 1.4, duration: 3.2 },
];

export function getSaveTheDateSparkles(): SaveTheDateSparkle[] {
  return SAVE_THE_DATE_SPARKLES;
}
