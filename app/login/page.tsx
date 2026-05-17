import type { Metadata } from "next";

import { createNoIndexMetadata } from "@/lib/seo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = createNoIndexMetadata();

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  );
}
