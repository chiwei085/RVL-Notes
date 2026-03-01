type HeadingNode = {
  type?: string;
  depth?: number;
  value?: string;
  children?: HeadingNode[];
  data?: {
    id?: string;
    hProperties?: Record<string, unknown>;
  };
};

type MarkdownNode = {
  type?: string;
  value?: string;
  url?: string;
  title?: string | null;
  children?: MarkdownNode[];
};

export type TocItem = {
  id: string;
  title: string;
  depth: 2 | 3;
};

const slugify = (value: string) => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "section";
};

const collectText = (node: HeadingNode): string => {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (Array.isArray(node.children)) {
    return node.children.map(collectText).join("");
  }
  return "";
};

export const createHeadingPlugin = (toc?: TocItem[]) => {
  return () => (tree: HeadingNode) => {
    const counts: Record<string, number> = {};
    const nextSlug = (title: string) => {
      const base = slugify(title);
      const count = (counts[base] ?? 0) + 1;
      counts[base] = count;
      return count === 1 ? base : `${base}-${count}`;
    };
    const visit = (node: HeadingNode) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "heading" && typeof node.depth === "number") {
        const title = collectText(node).trim() || "Section";
        const id = nextSlug(title);
        node.data ??= {};
        node.data.hProperties = {
          ...(node.data.hProperties ?? {}),
          id,
        };
        node.data.id = id;
        if (toc && (node.depth === 2 || node.depth === 3)) {
          toc.push({ id, title, depth: node.depth });
        }
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };
    if (toc) {
      toc.length = 0;
    }
    visit(tree);
  };
};

const obsidianLinkPattern = /\[\[([a-zA-Z0-9-_]+)\]\]/g;

export const createObsidianLinkPlugin = () => {
  return () => (tree: MarkdownNode) => {
    const transformNode = (node: MarkdownNode) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "code" || node.type === "inlineCode") {
        return;
      }
      if (!Array.isArray(node.children)) {
        return;
      }
      const nextChildren: MarkdownNode[] = [];
      node.children.forEach((child) => {
        if (child.type === "text" && typeof child.value === "string") {
          const value = child.value;
          obsidianLinkPattern.lastIndex = 0;
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = obsidianLinkPattern.exec(value))) {
            const [raw, slug] = match;
            const start = match.index;
            const end = start + raw.length;
            if (start > lastIndex) {
              nextChildren.push({ type: "text", value: value.slice(lastIndex, start) });
            }
            nextChildren.push({
              type: "link",
              url: `#/note/${slug}`,
              title: null,
              children: [{ type: "text", value: slug }],
            });
            lastIndex = end;
          }
          if (lastIndex === 0) {
            nextChildren.push(child);
          } else if (lastIndex < value.length) {
            nextChildren.push({ type: "text", value: value.slice(lastIndex) });
          }
        } else {
          nextChildren.push(child);
          transformNode(child);
        }
      });
      node.children = nextChildren;
    };
    transformNode(tree);
  };
};

export * from "./callout";
export * from "./highlight";
export * from "./fold";
