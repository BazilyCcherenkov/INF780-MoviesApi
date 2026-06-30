export const Genre = {
  ACTION: 'action',
  COMEDY: 'comedy',
  DRAMA: 'drama',
  HORROR: 'horror',
  SCIFI: 'sci-fi',
  THRILLER: 'thriller',
  ROMANCE: 'romance',
  DOCUMENTARY: 'documentary',
  ANIMATION: 'animation',
} as const;

export type Genre = (typeof Genre)[keyof typeof Genre];

export const GENRE_LABELS: Record<Genre, string> = {
  action: 'Acción',
  comedy: 'Comedia',
  drama: 'Drama',
  horror: 'Terror',
  'sci-fi': 'Ciencia Ficción',
  thriller: 'Thriller',
  romance: 'Romance',
  documentary: 'Documental',
  animation: 'Animación',
};

export interface Movie {
  id: string;
  title: string;
  director: string;
  genre: Genre;
  year: number;
  rating: number;
  synopsis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieDto {
  title: string;
  director: string;
  genre: Genre;
  year: number;
  rating: number;
  synopsis?: string;
}

export type UpdateMovieDto = Partial<CreateMovieDto>;
