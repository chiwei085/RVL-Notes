import type { ReactNode } from "react";

export type FoldProps = {
  title?: string;
  children?: ReactNode;
};

export default function Fold({ title, children }: FoldProps) {
  const summary = title?.trim() || "Details";

  return (
    <details className="md-fold">
      <summary className="md-fold-summary">{summary}</summary>
      <div className="md-fold-body">{children}</div>
    </details>
  );
}
