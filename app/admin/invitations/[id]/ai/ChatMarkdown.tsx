"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an agent message as markdown. The agent writes lists, `code` and
 * **bold** — shown raw they read as noise.
 *
 * Raw HTML is not enabled (react-markdown ignores it unless rehype-raw is
 * added), so agent-authored text cannot inject markup into the admin.
 */
export default function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-4">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          code: ({ children }) => (
            <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-foreground/10 p-2 font-mono text-xs">
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <p className="text-sm font-semibold">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="text-sm font-semibold">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="text-sm font-semibold">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-foreground/15" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
