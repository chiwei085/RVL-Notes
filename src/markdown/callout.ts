import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

export type CalloutKind =
  | "note"
  | "info"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "error";

const CALLOUT_RE = /^\s*\[!(note|info|tip|success|warning|danger|error)\](?:[ \t]+([^\n]*))?/i;

export function createCalloutPlugin(): Plugin<[], any> {
  return () => (tree) => {
    visit(tree, "blockquote", (node: any, index: number | undefined, parent: any) => {
      if (!parent || typeof index !== "number") return;
      if (!Array.isArray(node.children) || node.children.length === 0) return;

      const first = node.children[0];
      if (!first || first.type !== "paragraph") return;
      const firstText = first.children?.[0];
      if (!firstText || firstText.type !== "text" || typeof firstText.value !== "string") return;

      const match = CALLOUT_RE.exec(firstText.value);
      if (!match) return;

      const kind = match[1].toLowerCase() as CalloutKind;
      const title = match[2]?.trim();
      const markerText = match[0];
      const remaining = firstText.value.slice(markerText.length);

      if (remaining) {
        firstText.value = remaining;
      } else {
        first.children.shift();
      }

      const nextChildren = [...node.children];
      if (nextChildren[0]?.type === "paragraph" && (!nextChildren[0].children || nextChildren[0].children.length === 0)) {
        nextChildren.shift();
      }

      const callout = {
        type: "callout",
        kind,
        title: title || undefined,
        children: nextChildren,
      };

      parent.children.splice(index, 1, callout);
      return [SKIP, index];
    });
  };
}
