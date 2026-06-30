import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { Movie } from "./entities/movie.entity";
import { Genre } from "./entities/movie.entity";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = any,
>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

const movieData: CreateMovieDto = {
  title: "Inception",
  director: "Christopher Nolan",
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis:
    "A thief who steals corporate secrets through the use of dream-sharing technology.",
};

const mockMovie: Movie = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: movieData.title,
  director: movieData.director,
  genre: movieData.genre,
  year: movieData.year,
  rating: movieData.rating,
  synopsis: movieData.synopsis ?? "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("MoviesService", () => {
  let service: MoviesService;
  let repository: MockRepository<Movie>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MockRepository<Movie>>(getRepositoryToken(Movie));
  });

  // Prueba 1
  it("El servicio debe estar definido", () => {
    expect(service).toBeDefined();
  });

  // create() - Pruebas 2 y 3
  describe("create", () => {
    it("Al recibir un DTO válido, crea la entidad y la persiste", async () => {
      (repository.create as jest.Mock).mockReturnValue(mockMovie);
      (repository.save as jest.Mock).mockResolvedValue(mockMovie);

      const result = await service.create(movieData);

      expect(repository.create).toHaveBeenCalledWith(movieData);
      expect(repository.save).toHaveBeenCalledWith(mockMovie);
      expect(result).toEqual(mockMovie);
    });
      // Prueba 3 
    it("La película creada tiene un identificador UUID v4 asignado", async () => {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      (repository.create as jest.Mock).mockImplementation((dto) => ({
        ...dto,
        id: "a3f5c1b2-4d3e-4f5a-8b6c-9d0e1f2a3b4c",
      }));
      (repository.save as jest.Mock).mockImplementation((movie) =>
        Promise.resolve(movie),
      );

      const result = await service.create(movieData);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(uuidPattern);
    });
  });

  // findAll() - Pruebas 4 y 5
  describe("findAll", () => {
    it("Retorna todas las películas almacenadas como array", async () => {
      const movies = [mockMovie];
      (repository.find as jest.Mock).mockResolvedValue(movies);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(movies);
    });

    it("Retorna un array vacío cuando no existen películas", async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // findOne() - Pruebas 6 y 7
  describe("findOne", () => {
    it("Dado un UUID existente, retorna la película correspondiente", async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(mockMovie);

      const result = await service.findOne(mockMovie.id);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockMovie.id });
      expect(result).toEqual(mockMovie);
    });

    it("Dado un UUID inexistente, lanza una excepción", async () => {
      const nonExistentId = "00000000-0000-4000-a000-000000000000";
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // update() - Pruebas 8 y 9
  describe("update", () => {
    it("Dado un UUID existente y un DTO parcial, actualiza y retorna la película", async () => {
      const updateDto: UpdateMovieDto = { rating: 9.0 };
      const updatedMovie = { ...mockMovie, rating: 9.0 };
      (repository.findOneBy as jest.Mock).mockResolvedValue(mockMovie);
      (repository.save as jest.Mock).mockResolvedValue(updatedMovie);

      const result = await service.update(mockMovie.id, updateDto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockMovie.id });
      expect(repository.merge).toHaveBeenCalledWith(mockMovie, updateDto);
      expect(repository.save).toHaveBeenCalledWith(mockMovie);
      expect(result.rating).toBe(9.0);
    });

    it("Dado un UUID inexistente, lanza excepción antes de actualizar", async () => {
      const nonExistentId = "00000000-0000-4000-a000-000000000000";
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(nonExistentId, { rating: 9.0 }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // remove() - Pruebas 10 y 11
  describe("remove", () => {
    it("Dado un UUID existente, elimina la película", async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(mockMovie);
      (repository.remove as jest.Mock).mockResolvedValue(mockMovie);

      await service.remove(mockMovie.id);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockMovie.id });
      expect(repository.remove).toHaveBeenCalledWith(mockMovie);
    });

    it("Dado un UUID inexistente, lanza excepción antes de eliminar", async () => {
      const nonExistentId = "00000000-0000-4000-a000-000000000000";
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
