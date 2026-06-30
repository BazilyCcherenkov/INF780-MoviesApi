import { useState, useEffect, useCallback } from 'react';
import { moviesApi } from '../api/moviesApi';
import type { Movie, CreateMovieDto, UpdateMovieDto } from '../types/movie';

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moviesApi.getAll();
      setMovies(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const createMovie = async (data: CreateMovieDto) => {
    const created = await moviesApi.create(data);
    setMovies((prev) => [created, ...prev]);
    return created;
  };

  const updateMovie = async (id: string, data: UpdateMovieDto) => {
    const updated = await moviesApi.update(id, data);
    setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteMovie = async (id: string) => {
    try {
      await moviesApi.remove(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  };

  return { movies, loading, error, fetchMovies, createMovie, updateMovie, deleteMovie };
}
