import ReactMarkdown from "react-markdown";
import { useMemo } from "react";
import remarkGfm from "remark-gfm";
import { getNoteBySlug, getNoteContentBySlug } from "../data/notes";

type MarkdownNotePageProps = {
  slug: string;
};

export default function MarkdownNotePage({ slug }: MarkdownNotePageProps) {
  const note = getNoteBySlug(slug);
  const content = getNoteContentBySlug(slug);
  const hasContent = Boolean(content);
  const remarkPlugins = useMemo(() => [remarkGfm], []);

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
          <ReactMarkdown remarkPlugins={remarkPlugins}>{content}</ReactMarkdown>
        ) : (
          <div className="note-fallback">內容尚未建立。</div>
        )}
      </article>
    </main>
  );
}
