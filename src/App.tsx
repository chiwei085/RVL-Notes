import "./App.css";
import { notes } from "./data/notes";

export default function App() {
  return (
    <main className="home shell">
      <header className="brand">
        <div className="brand-text">
          <h1>RVL-Notes</h1>
          <p className="subtitle">研究與學習筆記</p>
        </div>
      </header>

      <section className="card-list">
        {notes.map((note) => (
          <div key={note.slug} className="note-card">
            <div className="note-card-header">
              <h2>{note.title}</h2>
              <span className="badge badge-category">{note.category}</span>
            </div>
            <p className="note-summary">{note.summary}</p>
            <div className="note-meta">
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
          </div>
        ))}
      </section>
    </main>
  );
}
