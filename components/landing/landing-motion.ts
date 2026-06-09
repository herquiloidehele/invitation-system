import type { MotionProps, Variants } from "framer-motion";

const landingEase: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

const landingViewport: MotionProps["viewport"] = {
  once: true,
  margin: "-120px",
};

export const landingTransition = {
  duration: 0.7,
  ease: landingEase,
};

export const landingFastTransition = {
  duration: 0.28,
  ease: landingEase,
};

export const landingContainerVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...landingTransition,
      delayChildren: 0.08,
      staggerChildren: 0.08,
    },
  },
};

export const landingStaggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.08,
    },
  },
};

export const landingItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: landingTransition,
  },
};

const landingSoftItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: landingFastTransition,
  },
};

export const landingCardVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: landingTransition,
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.98,
    transition: landingFastTransition,
  },
};

export const landingNavVariants: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: landingFastTransition,
  },
};

export const landingCardHover = {
  y: -8,
  scale: 1.01,
  transition: landingFastTransition,
};

export const landingCardTap = { scale: 0.985 };

export function shouldReduceMotion(
  reduceMotion: boolean | null | undefined,
): boolean {
  return reduceMotion === true;
}

export function getMotionProps(
  reduceMotion: boolean | null | undefined,
  variants: Variants,
  mode: "inView" | "animate" = "inView",
): Pick<
  MotionProps,
  "initial" | "animate" | "whileInView" | "viewport" | "variants"
> {
  if (shouldReduceMotion(reduceMotion)) {
    return { initial: false };
  }

  if (mode === "animate") {
    return {
      initial: "hidden",
      animate: "visible",
      variants,
    };
  }

  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: landingViewport,
    variants,
  };
}
