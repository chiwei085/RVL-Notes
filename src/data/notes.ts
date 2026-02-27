export type NoteCategory = "guide" | "note" | "project" | "research";
export type NoteStatus = string;

export type NoteMeta = {
  slug: string;
  title: string;
  summary: string;
  category: NoteCategory;
  tags: string[];
  status: NoteStatus;
  updated: string;
};

type Frontmatter = Partial<Omit<NoteMeta, "slug">>;

type ParsedNote = {
  meta: NoteMeta;
  content: string;
};

const rawNotes = import.meta.glob<string>("../../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function unquote(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineList(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  const unwrapped =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;
  return unwrapped
    .split(",")
    .map((item) => unquote(item.trim()))
    .filter(Boolean);
}

function parseFrontmatter(frontmatter: string): Frontmatter {
  const result: Record<string, string | string[]> = {};
  const lines = frontmatter.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1];
    const rest = match[2].trim();
    if (!rest) {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = /^\s*-\s*(.+)$/.exec(lines[j]);
        if (!itemMatch) {
          break;
        }
        items.push(unquote(itemMatch[1].trim()));
        j += 1;
      }
      if (items.length > 0) {
        result[key] = items;
        i = j;
        continue;
      }
      result[key] = "";
      i += 1;
      continue;
    }
    if (key === "tags") {
      result[key] = parseInlineList(rest);
    } else {
      result[key] = unquote(rest);
    }
    i += 1;
  }
  return result;
}

function parseMarkdown(raw: string) {
  const match = raw.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---\s*[\r\n]*/);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }
  const frontmatter = parseFrontmatter(match[1]);
  const content = raw.slice(match[0].length);
  return { frontmatter, content };
}

function toString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toTags(value: unknown) {
  if (Array.isArray(value)) {
    const isString = (item: unknown): item is string => typeof item === "string";
    return value.filter(isString).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return parseInlineList(value);
  }
  return [];
}

function toCategory(value: unknown): NoteCategory {
  const raw = toString(value, "note");
  if (
    raw === "guide" ||
    raw === "note" ||
    raw === "project" ||
    raw === "research"
  ) {
    return raw;
  }
  return "note";
}

function toStatus(value: unknown): NoteStatus {
  return toString(value, "");
}

const slugToPaths = new Map<string, string[]>();
Object.keys(rawNotes).forEach((path) => {
  const slug = path.split("/").pop()?.replace(/\.md$/, "") ?? path;
  const list = slugToPaths.get(slug);
  if (list) {
    list.push(path);
  } else {
    slugToPaths.set(slug, [path]);
  }
});
const duplicateSlugs = [...slugToPaths.entries()].filter(([, paths]) => paths.length > 1);
if (duplicateSlugs.length > 0) {
  const lines = duplicateSlugs.flatMap(([slug, paths]) => [
    `- ${slug}:`,
    ...paths.map((item) => `  - ${item}`),
  ]);
  throw new Error(`Duplicate slugs found in content:\n${lines.join("\n")}`);
}

const parsedNotes: ParsedNote[] = Object.entries(rawNotes).map(([path, raw]) => {
  const slug = path.split("/").pop()?.replace(/\.md$/, "") ?? path;
  const { frontmatter, content } = parseMarkdown(raw ?? "");
  const meta: NoteMeta = {
    slug,
    title: toString(frontmatter.title, slug),
    summary: toString(frontmatter.summary, ""),
    category: toCategory(frontmatter.category),
    tags: toTags(frontmatter.tags),
    status: toStatus(frontmatter.status),
    updated: toString(frontmatter.updated, ""),
  };
  return { meta, content };
});

export const notes = parsedNotes.map((item) => item.meta);
const noteBySlug = new Map(parsedNotes.map((item) => [item.meta.slug, item]));

export function getNoteBySlug(slug: string) {
  return noteBySlug.get(slug)?.meta;
}

export function getNoteContentBySlug(slug: string) {
  return noteBySlug.get(slug)?.content ?? "";
}
