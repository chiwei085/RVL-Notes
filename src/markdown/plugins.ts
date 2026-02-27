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
