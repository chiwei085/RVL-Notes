import { useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import MarkdownNotePage from "./pages/MarkdownNotePage";
import { notes, type NoteCategory } from "./data/notes";
import logo from "./assets/logo.png";

function HomePage() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<NoteCategory[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const categories: NoteCategory[] = ["guide", "note", "project", "research"];
  const baseNotes = notes.filter((note) => note.status !== "subpage");
  const categoryCounts = baseNotes.reduce(
    (acc, note) => {
      acc[note.category] = (acc[note.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<NoteCategory, number>
  );
  const tagCounts = baseNotes.reduce(
    (acc, note) => {
      note.tags.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
  const isAllActive = selectedCategories.length === 0;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredNotes = baseNotes.filter((note) => {
    if (!isAllActive && !selectedCategories.includes(note.category)) {
      return false;
    }
    if (
      selectedTags.length > 0 &&
      !selectedTags.some((tag) => note.tags.includes(tag))
    ) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${note.title} ${note.summary} ${note.tags.join(
        " "
      )}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
  const getTime = (value: string) => {
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
  };
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => getTime(b.updated) - getTime(a.updated)
  );

  const toggleCategory = (category: NoteCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const clearCategories = () => setSelectedCategories([]);
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="home shell">
      <header className="brand">
        <div className="brand-text">
          <h1>RVL-Notes</h1>
          <p className="subtitle">研究與學習筆記</p>
        </div>
      </header>

      <section className="search-block">
        <h2 className="section-title">Search</h2>
        <input
          type="search"
          className="search-input"
          placeholder="Search notes..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <section className="category-block">
        <h2 className="section-title">Content type</h2>
        <div className="category-list">
          <button
            type="button"
            className={`badge badge-category category-chip${
              isAllActive ? " is-active" : ""
            }`}
            onClick={clearCategories}
          >
            All ({baseNotes.length})
          </button>
          {categories.map((category) => {
            const isActive = selectedCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                className={`badge badge-category category-chip${
                  isActive ? " is-active" : ""
                }`}
                onClick={() => toggleCategory(category)}
              >
                {category} ({categoryCounts[category] ?? 0})
              </button>
            );
          })}
        </div>
        <h2 className="section-title">Tags</h2>
        <div className="tag-list">
          {sortedTags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`tag tag-chip${isActive ? " is-active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag} ({tagCounts[tag] ?? 0})
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-list">
        {sortedNotes.length === 0
          ? (
              <div className="empty-state">
                No notes match the current filters.
              </div>
            )
          : sortedNotes.map((note) => {
              const displayTags = note.tags.slice(0, 3);
              return (
                <button
                  key={note.slug}
                  className="note-card"
                  onClick={() => navigate(`/note/${note.slug}`)}
                >
                  <div className="note-card-header">
                    <h2>{note.title}</h2>
                    <span className="badge badge-category">
                      {note.category}
                    </span>
                  </div>
                  <p className="note-summary">{note.summary}</p>
                  <div className="note-meta">
                    {note.status ? (
                      <span className="badge badge-status">{note.status}</span>
                    ) : null}
                    <span className="note-updated">Updated: {note.updated}</span>
                  </div>
                  <div className="tag-list">
                    {displayTags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
      </section>
    </main>
  );
}

function NotePage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  if (!slug) {
    return null;
  }
  return (
    <>
      <nav className="topbar">
        <div className="shell">
          <button onClick={() => navigate("/")}>← 回首頁</button>
          <img src={logo} alt="RVL-Notes logo" className="topbar-logo" />
        </div>
      </nav>
      <MarkdownNotePage slug={slug} />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/note/:slug" element={<NotePage />} />
    </Routes>
  );
}
