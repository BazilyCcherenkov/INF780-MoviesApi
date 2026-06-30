import { GENRE_LABELS } from '../types/movie';
import type { Movie } from '../types/movie';

interface Props {
  movie: Movie;
  onEdit: (movie: Movie) => void;
  onDelete: (id: string) => void;
}

function StarRating({ value }: { value: number }) {
  const filled = Math.round(value / 2);
  return (
    <span className="stars" title={`${value}/10`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'star filled' : 'star'}>★</span>
      ))}
      <span className="rating-number">{Number(value).toFixed(1)}</span>
    </span>
  );
}

export default function MovieCard({ movie, onEdit, onDelete }: Props) {
  return (
    <div className="movie-card">
      <div className="movie-card-header">
        <span className="genre-badge">{GENRE_LABELS[movie.genre]}</span>
        <span className="movie-year">{movie.year}</span>
      </div>
      <h3 className="movie-title">{movie.title}</h3>
      <p className="movie-director">Dir. {movie.director}</p>
      <StarRating value={movie.rating} />
      {movie.synopsis && <p className="movie-synopsis">{movie.synopsis}</p>}
      <div className="card-actions">
        <button className="btn btn-edit" onClick={() => onEdit(movie)}>Editar</button>
        <button className="btn btn-delete" onClick={() => onDelete(movie.id)}>Eliminar</button>
      </div>
    </div>
  );
}
