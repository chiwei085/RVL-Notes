import ReactMarkdown, { type Options } from "react-markdown";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Handler } from "mdast-util-to-hast";
import { Prism as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import Callout from "../components/Callout";
import Embed from "../components/Embed";
import Fold from "../components/Fold";
import { getNoteBySlug, getNoteContentBySlug } from "../data/notes";
import {
  createCalloutPlugin,
  createFoldPlugin,
  createHeadingPlugin,
  createHighlightPlugin,
  createObsidianLinkPlugin,
  type TocItem,
} from "../markdown/plugins";
import { createMicromarkSyntaxPlugin } from "../markdown/micromark";

const draculaStyle = dracula as unknown as SyntaxHighlighterProps["style"];
type MarkdownNotePageProps = {
  slug: string;
};

type RehypeState = {
  all: (node: unknown) => unknown[];
};

type RehypeNode = {
  children?: unknown[];
  [key: string]: unknown;
};

const elementHandler = (
  tagName: string,
  getProperties: (node: RehypeNode) => Record<string, unknown>,
  includeChildren = true
): Handler =>
  ((state: RehypeState, node: RehypeNode) => ({
    type: "element",
    tagName,
    properties: getProperties(node),
    children: includeChildren ? state.all(node) : [],
  })) as Handler;

export default function MarkdownNotePage({ slug }: MarkdownNotePageProps) {
  const note = getNoteBySlug(slug);
  const content = getNoteContentBySlug(slug);
  const hasContent = Boolean(content);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedHeadingId, setCopiedHeadingId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const headingCopyTimeoutRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const tocItems = useMemo(() => {
    const items: TocItem[] = [];
    if (!content) {
      return items;
    }
    const processor = remark().use(remarkGfm).use(createHeadingPlugin(items));
    const tree = processor.parse(content);
    processor.runSync(tree);
    return items;
  }, [content]);
  const sectionParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("section");
  }, [location.search]);
  const markdownPlugins = useMemo<NonNullable<Options["remarkPlugins"]>>(
    () => [
      createMicromarkSyntaxPlugin(),
      remarkGfm,
      remarkMath,

      createCalloutPlugin(),
      createFoldPlugin(),

      createHighlightPlugin(),

      createHeadingPlugin(),
      createObsidianLinkPlugin(),
    ],
    []
  );
  const remarkRehypeOptions = useMemo<NonNullable<Options["remarkRehypeOptions"]>>(
    () => ({
      handlers: {
        embed: elementHandler(
          "rvl-embed",
          (node) => ({
            provider: node.provider,
            id: node.id,
            width: node.width,
            aspect: node.aspect,
          }),
          false
        ),
        callout: elementHandler("rvl-callout", (node) => ({
          kind: node.kind,
          title: node.title,
        })),
        fold: elementHandler("rvl-fold", (node) => ({
          title: node.title,
        })),
        highlight: elementHandler("mark", () => ({ className: "highlight" })),
        kbd: elementHandler("kbd", () => ({ className: "kbd" })),
        badge: elementHandler("span", () => ({ className: ["badge", "badge-inline"] })),
      },
    }),
    []
  );
  const rehypePlugins = useMemo<NonNullable<Options["rehypePlugins"]>>(
    () => [rehypeKatex],
    []
  );

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const buildSectionSearch = (sectionId?: string) => {
    const params = new URLSearchParams(location.search);
    if (sectionId) {
      params.set("section", sectionId);
    } else {
      params.delete("section");
    }
    const search = params.toString();
    return search ? `?${search}` : "";
  };

  const updateSection = (sectionId?: string) => {
    navigate(
      { search: buildSectionSearch(sectionId) },
      { replace: true }
    );
  };

  const buildSectionLink = (sectionId: string) =>
    `#/note/${slug}?section=${encodeURIComponent(sectionId)}`;

  useEffect(() => {
    if (!content) {
      return;
    }
    if (sectionParam) {
      requestAnimationFrame(() => {
        scrollToHeading(sectionParam);
      });
      return;
    }
    const legacyId = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    if (!legacyId) {
      return;
    }
    requestAnimationFrame(() => {
      scrollToHeading(legacyId);
    });
    updateSection(legacyId);
  }, [content, location.hash, sectionParam]);

  const handleCopy = async (text: string, key: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard API unavailable");
      setCopiedKey(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1200);
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedKey(null);
    }
  };

  const handleCopySection = async (sectionId: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard API unavailable");
      setCopiedHeadingId(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(buildSectionLink(sectionId));
      setCopiedHeadingId(sectionId);
      if (headingCopyTimeoutRef.current) {
        window.clearTimeout(headingCopyTimeoutRef.current);
      }
      headingCopyTimeoutRef.current = window.setTimeout(() => {
        setCopiedHeadingId((current) => (current === sectionId ? null : current));
      }, 1200);
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedHeadingId(null);
    }
  };

  const renderHeading = (Tag: "h2" | "h3") => {
    return ({ id, className, children, ...rest }: ComponentPropsWithoutRef<"h2">) => {
      const headingId = typeof id === "string" ? id : "";
      const isCopied = headingId && copiedHeadingId === headingId;
      return (
        <Tag
          id={headingId || undefined}
          className={["heading-anchor", className].filter(Boolean).join(" ")}
          {...rest}
        >
          <span className="heading-text">{children}</span>
          {headingId ? (
            <button
              type="button"
              className={`heading-link${isCopied ? " is-copied" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleCopySection(headingId);
              }}
            >
              {isCopied ? "Copied" : "🔗"}
            </button>
          ) : null}
        </Tag>
      );
    };
  };

  if (!note) {
    return (
      <main className="page shell">
        <header className="page-header">
          <h1>Note not found</h1>
          <p className="page-subtitle">Slug: {slug}</p>
        </header>
        <article className="markdown-body">
          <div className="note-fallback">這篇筆記尚未建立。</div>
        </article>
      </main>
    );
  }

  return (
    <main className="page shell">
      <header className="page-header">
        <div className="page-title-row">
          <h1>{note.title}</h1>
          <span className="badge badge-category">{note.category}</span>
          {note.status === "subpage" ? (
            <span className="badge badge-status">Subpage</span>
          ) : null}
        </div>
        <div className="page-meta">
          {note.status && note.status !== "subpage" ? (
            <span className="badge badge-status">{note.status}</span>
          ) : null}
          <span className="note-updated">Updated: {note.updated}</span>
        </div>
        <div className="tag-list">
          {note.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        {tocItems.length > 0 && (
          <details className="toc" open>
            <summary
              onClick={() => {
                if (sectionParam) {
                  updateSection();
                }
              }}
            >
              Table of contents
            </summary>
            <div className="toc-list">
              {tocItems.map((item) => (
                <Link
                  key={item.id}
                  className={`toc-link${item.depth === 3 ? " is-sub" : ""}`}
                  to={{ pathname: location.pathname, search: buildSectionSearch(item.id) }}
                  onClick={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.altKey ||
                      event.shiftKey
                    ) {
                      return;
                    }
                    event.preventDefault();
                    scrollToHeading(item.id);
                    updateSection(item.id);
                  }}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </details>
        )}
      </header>

      <article className="markdown-body">
        {hasContent ? (
          <ReactMarkdown
            remarkPlugins={markdownPlugins}
            remarkRehypeOptions={remarkRehypeOptions}
            rehypePlugins={rehypePlugins}
            components={{
              h2: renderHeading("h2"),
              h3: renderHeading("h3"),
              "rvl-callout"({ kind, title, children }: any) {
                return (
                  <Callout kind={String(kind)} title={title ? String(title) : undefined}>
                    {children}
                  </Callout>
                );
              },
              "rvl-fold"({ title, children }: any) {
                return <Fold title={title ? String(title) : undefined}>{children}</Fold>;
              },
              "rvl-embed"({ provider, id, width, aspect }: any) {
                const p = String(provider);
                const vid = String(id);
                const widthValue = Number(width);
                const aspectValue =
                  aspect === "16:9" || aspect === "4:3" || aspect === "1:1"
                    ? aspect
                    : undefined;
                if (p !== "youtube" && p !== "bilibili") return null;
                return (
                  <Embed
                    provider={p}
                    id={vid}
                    width={Number.isFinite(widthValue) ? widthValue : undefined}
                    aspect={aspectValue}
                  />
                );
              },
              code({ className, children, ...rest }) {
                const match = /language-(\w+)/.exec(className || "");
                if (match) {
                  const text = String(children).replace(/\n$/, "");
                  const key = `${text.slice(0, 32)}:${text.length}`;
                  const isCopied = copiedKey === key;
                  return (
                    <div className="codeblock">
                      <button
                        type="button"
                        className="codeblock-copy"
                        onClick={() => handleCopy(text, key)}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                      <SyntaxHighlighter
                        style={draculaStyle}
                        language={match[1]}
                        PreTag="div"
                        className="syntax-highlighter"
                        customStyle={{ margin: 0, borderRadius: 12 }}
                      >
                        {text}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className="note-fallback">內容尚未建立。</div>
        )}
      </article>
    </main>
  );
}
