import { hostRuntime } from "../runtime";

const runtime = hostRuntime().jsxRuntime as Record<string, never>;

export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export const Fragment = runtime.Fragment;
