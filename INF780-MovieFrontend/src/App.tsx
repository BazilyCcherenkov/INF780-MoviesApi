import { useState } from 'react';
import { useMovies } from './hooks/useMovies';
import MovieCard from './components/MovieCard';
import MovieForm from './components/MovieForm';
import Modal from './components/Modal';
import { Genre, GENRE_LABELS } from './types/movie';
import type { Movie, CreateMovieDto } from './types/movie';
import './App.css';

export default function App() {
  const { movies, loading, error, createMovie, updateMovie, deleteMovie } = useMovies();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState<Genre | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m: Movie) => { setEditing(m); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: CreateMovieDto) => {
    if (editing) {
      await updateMovie(editing.id, data);
    } else {
      await createMovie(data);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMovie(id);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.director.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = filterGenre === '' || m.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <span className="header-icon">🎬</span>
            <h1>Movies API</h1>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Nueva película
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="filters">
          <input
            className="search-input"
            placeholder="Buscar por título o director…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="genre-filter"
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value as Genre | '')}
          >
            <option value="">Todos los géneros</option>
            {(Object.values(Genre) as Genre[]).map((g) => (
              <option key={g} value={g}>{GENRE_LABELS[g]}</option>
            ))}
          </select>
        </div>

        {loading && <p className="status-msg">Cargando películas…</p>}
        {error && <p className="status-msg error">Error: {error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="status-msg">No se encontraron películas.</p>
        )}

        <div className="movies-grid">
          {filtered.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      </main>

      <Modal open={modalOpen} onClose={closeModal}>
        <MovieForm initial={editing} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <div className="confirm-dialog">
          <h3>¿Eliminar película?</h3>
          <p>Esta acción no se puede deshacer.</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </button>
            <button className="btn btn-delete" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
