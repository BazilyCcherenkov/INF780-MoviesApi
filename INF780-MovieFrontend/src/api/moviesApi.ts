import type { Movie, CreateMovieDto, UpdateMovieDto } from '../types/movie';

const BASE_URL = '/movies';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

export const moviesApi = {
  getAll: (): Promise<Movie[]> =>
    fetch(BASE_URL).then((r) => handleResponse<Movie[]>(r)),

  getOne: (id: string): Promise<Movie> =>
    fetch(`${BASE_URL}/${id}`).then((r) => handleResponse<Movie>(r)),

  create: (data: CreateMovieDto): Promise<Movie> =>
    fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Movie>(r)),

  update: (id: string, data: UpdateMovieDto): Promise<Movie> =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Movie>(r)),

  remove: (id: string): Promise<void> =>
    fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<void>(r),
    ),
};
