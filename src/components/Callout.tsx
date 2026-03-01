import type { ReactNode } from "react";

export type CalloutKind =
  | "note"
  | "info"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "error";

type CanonicalCalloutKind = "note" | "tip" | "warning" | "danger";

const DEFAULT_TITLES: Record<CanonicalCalloutKind, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
};

const ICONS: Record<CanonicalCalloutKind, string> = {
  note: "i",
  tip: "\u2713",
  warning: "!",
  danger: "\u00d7",
};

function normalizeKind(kind?: string): CanonicalCalloutKind {
  const value = (kind || "note").toLowerCase();
  if (value === "info") return "note";
  if (value === "success") return "tip";
  if (value === "error") return "danger";
  if (value === "tip" || value === "warning" || value === "danger") return value;
  return "note";
}

export type CalloutProps = {
  kind?: string;
  title?: string;
  children?: ReactNode;
};

export default function Callout({ kind, title, children }: CalloutProps) {
  const normalized = normalizeKind(kind);
  const displayTitle = title?.trim() || DEFAULT_TITLES[normalized];

  return (
    <aside className={`callout callout--${normalized}`} data-kind={normalized}>
      <div className="callout__header">
        <span className="callout__icon" aria-hidden="true">
          {ICONS[normalized]}
        </span>
        <strong className="callout__title">{displayTitle}</strong>
      </div>
      <div className="callout__body">{children}</div>
    </aside>
  );
}
