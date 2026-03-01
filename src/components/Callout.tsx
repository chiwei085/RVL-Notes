import type { ReactNode } from "react";

export type CalloutKind =
  | "note"
  | "info"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "error";

const DEFAULT_TITLES: Record<CalloutKind, string> = {
  note: "Note",
  info: "Info",
  tip: "Tip",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
  error: "Error",
};

export type CalloutProps = {
  kind?: string;
  title?: string;
  children?: ReactNode;
};

export default function Callout({ kind, title, children }: CalloutProps) {
  const normalized = (kind || "note") as CalloutKind;
  const displayTitle = title?.trim() || DEFAULT_TITLES[normalized] || "Note";

  return (
    <div className="callout" data-kind={normalized}>
      {displayTitle ? <div className="callout-title">{displayTitle}</div> : null}
      <div className="callout-content">{children}</div>
    </div>
  );
}
