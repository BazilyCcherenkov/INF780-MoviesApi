import { useState, useEffect } from 'react';
import { Genre, GENRE_LABELS } from '../types/movie';
import type { Movie, CreateMovieDto } from '../types/movie';

interface Props {
  initial?: Movie | null;
  onSubmit: (data: CreateMovieDto) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: CreateMovieDto = {
  title: '',
  director: '',
  genre: Genre.ACTION as Genre,
  year: new Date().getFullYear(),
  rating: 5,
  synopsis: '',
};

export default function MovieForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CreateMovieDto>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        director: initial.director,
        genre: initial.genre,
        year: initial.year,
        rating: initial.rating,
        synopsis: initial.synopsis ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  const set = (field: keyof CreateMovieDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const raw = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: field === 'year' || field === 'rating' ? Number(raw) : raw,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="movie-form">
      <h2>{initial ? 'Editar película' : 'Nueva película'}</h2>

      {formError && <p className="form-error">{formError}</p>}

      <label>
        Título *
        <input value={form.title} onChange={set('title')} required maxLength={255} />
      </label>

      <label>
        Director *
        <input value={form.director} onChange={set('director')} required maxLength={150} />
      </label>

      <label>
        Género *
        <select value={form.genre} onChange={set('genre')} required>
          {(Object.values(Genre) as Genre[]).map((g) => (
            <option key={g} value={g}>
              {GENRE_LABELS[g]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Año *
        <input
          type="number"
          value={form.year}
          onChange={set('year')}
          required
          min={1888}
          max={2030}
        />
      </label>

      <label>
        Rating (0–10) *
        <input
          type="number"
          value={form.rating}
          onChange={set('rating')}
          required
          min={0}
          max={10}
          step={0.1}
        />
      </label>

      <label>
        Sinopsis
        <textarea value={form.synopsis} onChange={set('synopsis')} rows={3} />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
