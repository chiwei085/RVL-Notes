import type { Plugin } from "unified";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";

export type EmbedProvider = "youtube" | "bilibili";

export type EmbedNode = {
  type: "embed";
  provider: EmbedProvider;
  id: string;
  params?: Record<string, string>;
};

function parseSpec(spec: string): { provider: EmbedProvider; id: string } | null {
  const match = /^(youtube|bilibili):(.+)$/.exec(spec);
  if (!match) return null;
  const provider = match[1] as EmbedProvider;
  const id = match[2].trim();
  if (!id) return null;

  if (provider === "youtube") {
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
  } else {
    if (!/^BV[a-zA-Z0-9]{10}$/.test(id) && !/^av\d{1,12}$/.test(id)) return null;
  }
  return { provider, id };
}

function rewriteObsidianEmbedToDirective(markdown: string): string {
  return markdown.replace(/!\[\[([^\]\n]+)\]\]/g, (_full, inner) => `::embed[${inner}]`);
}

export function createEmbedPlugin(): Plugin<[], Root> {
  return function attacher(this: any) {
    const data = this.data();

    const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = []);
    micromarkExts.push(directive());

    const fromMarkdownExts =
      data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
    fromMarkdownExts.push(directiveFromMarkdown);

    const toMarkdownExts = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
    toMarkdownExts.push(directiveToMarkdown);

    const originalParser = this.Parser;
    const originalParse = originalParser.prototype.parse;

    originalParser.prototype.parse = function (doc: string) {
      return originalParse.call(this, rewriteObsidianEmbedToDirective(doc));
    };

    return (tree) => {
      visit(tree, (node: any, index: number | null, parent: any) => {
        if (!parent || typeof index !== "number") return;
        if (node.type !== "leafDirective") return;
        if (node.name !== "embed") return;

        const label = (node.children?.[0]?.value || "").toString();
        const spec = label.trim();
        const parsed = parseSpec(spec);
        if (!parsed) return;

        const embed: EmbedNode = {
          type: "embed",
          provider: parsed.provider,
          id: parsed.id,
        };

        parent.children.splice(index, 1, embed);
        return [visit.SKIP, index];
      });
    };
  };
}
