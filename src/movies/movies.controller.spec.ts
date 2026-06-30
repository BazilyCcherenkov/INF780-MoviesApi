import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
} from "@nestjs/common";
import request from "supertest";
import { MoviesController } from "./movies.controller";
import { MoviesService } from "./movies.service";
import { Genre } from "./entities/movie.entity";
import { Movie } from "./entities/movie.entity";

const mockMoviesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const movieData = {
  title: "Inception",
  director: "Christopher Nolan",
  genre: "sci-fi",
  year: 2010,
  rating: 8.8,
  synopsis:
    "A thief who steals corporate secrets through the use of dream-sharing technology.",
};

const mockMovie: Partial<Movie> = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Inception",
  director: "Christopher Nolan",
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis:
    "A thief who steals corporate secrets through the use of dream-sharing technology.",
};

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const invalidUuid = "not-a-valid-uuid";
const nonExistentUuid = "00000000-0000-4000-a000-000000000000";

describe("MoviesController (Integration)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  // Aquí las pruebas
  // POST /movies - 6 casos
  describe("POST /movies", () => {
    it("1. Crea una película con datos válidos", async () => {
      mockMoviesService.create.mockResolvedValue(mockMovie);
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send(movieData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(movieData.title);
    });

    it("2. Falta el campo title en el body", async () => {
      const { title, ...invalidData } = movieData;
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send(invalidData)
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("3. El rating es mayor a 10", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, rating: 11 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("4. El rating es menor a 0", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, rating: -1 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("5. El year es menor a 1888", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, year: 1887 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("6. El genre no es un valor válido del enum", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, genre: "invalid-genre" })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });
  });

  // GET /movies - 2 casos
  describe("GET /movies", () => {
    it("7. Retorna todas las películas", async () => {
      mockMoviesService.findAll.mockResolvedValue([mockMovie]);
      const response = await request(app.getHttpServer())
        .get("/movies")
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("8. No existen películas registradas", async () => {
      mockMoviesService.findAll.mockResolvedValue([]);
      const response = await request(app.getHttpServer())
        .get("/movies")
        .expect(200);
      expect(response.body).toEqual([]);
    });
  });

  // GET /movies/:id - 3 casos
  describe("GET /movies/:id", () => {
    it("9. UUID válido y existente", async () => {
      mockMoviesService.findOne.mockResolvedValue(mockMovie);
      const response = await request(app.getHttpServer())
        .get(`/movies/${validUuid}`)
        .expect(200);
      expect(response.body.id).toBe(validUuid);
    });

    it("10. UUID con formato inválido", async () => {
      await request(app.getHttpServer())
        .get(`/movies/${invalidUuid}`)
        .expect(400);
    });

    it("11. UUID válido pero inexistente", async () => {
      mockMoviesService.findOne.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .get(`/movies/${nonExistentUuid}`)
        .expect(404);
    });
  });

  // PATCH /movies/:id - 4 casos
  describe("PATCH /movies/:id", () => {
    it("12. Actualiza parcialmente con DTO válido", async () => {
      const updatedMovie = { ...mockMovie, rating: 9.0 };
      mockMoviesService.update.mockResolvedValue(updatedMovie);
      const response = await request(app.getHttpServer())
        .patch(`/movies/${validUuid}`)
        .send({ rating: 9.0 })
        .expect(200);
      expect(response.body.rating).toBe(9.0);
    });

    it("13. UUID con formato inválido", async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${invalidUuid}`)
        .send({ rating: 9.0 })
        .expect(400);
    });

    it("14. UUID válido pero inexistente", async () => {
      mockMoviesService.update.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .patch(`/movies/${nonExistentUuid}`)
        .send({ rating: 9.0 })
        .expect(404);
    });

    it("15. Rating fuera de rango (ej: 15)", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${validUuid}`)
        .send({ rating: 15 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });
  });

  // DELETE /movies/:id - 3 casos
  describe("DELETE /movies/:id", () => {
    it("16. Elimina una película existente", async () => {
      mockMoviesService.remove.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .delete(`/movies/${validUuid}`)
        .expect(200);
      expect(response.body).toEqual({});
    });

    it("17. UUID con formato inválido", async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${invalidUuid}`)
        .expect(400);
    });

    it("18. UUID válido pero inexistente", async () => {
      mockMoviesService.remove.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .delete(`/movies/${nonExistentUuid}`)
        .expect(404);
    });
  });
});
