import ReactMarkdown from "react-markdown";
import { useMemo, useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getNoteBySlug, getNoteContentBySlug } from "../data/notes";

const draculaStyle = dracula as unknown as SyntaxHighlighterProps["style"];

type MarkdownNotePageProps = {
  slug: string;
};

export default function MarkdownNotePage({ slug }: MarkdownNotePageProps) {
  const note = getNoteBySlug(slug);
  const content = getNoteContentBySlug(slug);
  const hasContent = Boolean(content);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const remarkPlugins = useMemo(() => [remarkGfm], []);

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
        </div>
        <div className="page-meta">
          {note.status ? (
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
      </header>

      <article className="markdown-body">
        {hasContent ? (
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            components={{
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
