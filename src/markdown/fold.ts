import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import remarkDirective from "remark-directive";

const collectText = (node: any): string => {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(collectText).join("");
  }
  return "";
};

export function createFoldPlugin(): Plugin<[], any> {
  return function attacher(this: any) {
    this.use(remarkDirective);

    return (tree) => {
      visit(tree, "containerDirective", (node: any, index: number | undefined, parent: any) => {
        if (!parent || typeof index !== "number") return;
        if (node.name !== "fold") return;

        let title: string | undefined = typeof node.label === "string" ? node.label.trim() : undefined;
        const attrTitle =
          typeof node.attributes?.title === "string" ? node.attributes.title.trim() : undefined;
        if (!title && attrTitle) {
          title = attrTitle;
        }
        if (node.children?.[0]?.type === "paragraph" && node.children[0].data?.directiveLabel) {
          title = collectText(node.children[0]).trim() || undefined;
          node.children = node.children.slice(1);
        }

        const fold = {
          type: "fold",
          title,
          children: node.children,
        };

        parent.children.splice(index, 1, fold);
        return [SKIP, index];
      });
    };
  };
}
