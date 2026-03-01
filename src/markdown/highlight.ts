import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

const HIGHLIGHT_RE = /==([^=\n]+?)==/g;

export function createHighlightPlugin(): Plugin<[], any> {
  return () => (tree) => {
    visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
      if (!parent || typeof index !== "number") return;
      if (parent.type === "inlineCode" || parent.type === "code") return;

      const value = node.value;
      if (typeof value !== "string" || !value.includes("==")) return;

      const out: any[] = [];
      let last = 0;

      for (const match of value.matchAll(HIGHLIGHT_RE)) {
        const full = match[0];
        const content = match[1];
        const start = match.index ?? 0;
        const end = start + full.length;

        if (start > last) {
          out.push({ type: "text", value: value.slice(last, start) });
        }

        if (content.trim()) {
          out.push({
            type: "highlight",
            children: [{ type: "text", value: content }],
          });
        } else {
          out.push({ type: "text", value: full });
        }

        last = end;
      }

      if (out.length === 0) return;
      if (last < value.length) {
        out.push({ type: "text", value: value.slice(last) });
      }

      parent.children.splice(index, 1, ...out);
      return [SKIP, index];
    });
  };
}
