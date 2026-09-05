import { hostRuntime } from "../runtime";

const framerMotion = hostRuntime().framerMotion as Record<string, never>;

export const motion = framerMotion.motion;
export const AnimatePresence = framerMotion.AnimatePresence;
