import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";

const movieData = {
  title: "Inception",
  director: "Christopher Nolan",
  genre: "sci-fi",
  year: 2010,
  rating: 8.8,
  synopsis:
    "A thief who steals corporate secrets through the use of dream-sharing technology.",
};

const updateData = {
  rating: 9.0,
  synopsis: "Updated synopsis for testing purposes.",
};

const invalidUuid = "not-a-valid-uuid";
const nonExistentUuid = "00000000-0000-4000-a000-000000000000";

describe("Movies E2E", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdMovieId: string | null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await dataSource.query("DELETE FROM movies");

    // Create a movie for testing
    const response = await request(app.getHttpServer())
      .post("/movies")
      .send(movieData);
    createdMovieId = response.body.id;
  });

  afterAll(async () => {
    await dataSource.query("DELETE FROM movies");
    await app.close();
  });

  // POST /movies - 5 casos
  describe("POST /movies", () => {
    it("1. Crea una película con datos válidos y estructura completa", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send(movieData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("director");
      expect(response.body).toHaveProperty("genre");
      expect(response.body).toHaveProperty("year");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body.title).toBe(movieData.title);
      createdMovieId = response.body.id;
    });

    it("2. Falta el campo title", async () => {
      const { title, ...invalidData } = movieData;
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send(invalidData)
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("3. El rating es 11 (fuera de rango)", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, title: "Test Movie", rating: 11 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("4. El genre no es un valor válido", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, title: "Test Movie", genre: "invalid-genre" })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });

    it("5. El year es menor a 1888", async () => {
      const response = await request(app.getHttpServer())
        .post("/movies")
        .send({ ...movieData, title: "Test Movie", year: 1887 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });
  });

  // GET /movies - 1 caso
  describe("GET /movies", () => {
    it("6. Retorna un array que contiene la película recién creada", async () => {
      const response = await request(app.getHttpServer())
        .get("/movies")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const found = response.body.find((m: any) => m.id === createdMovieId);
      expect(found).toBeDefined();
    });
  });

  // GET /movies/:id - 3 casos
  describe("GET /movies/:id", () => {
    it("7. Obtiene la película usando createdMovieId", async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${createdMovieId}`)
        .expect(200);
      expect(response.body.id).toBe(createdMovieId);
    });

    it("8. UUID con formato inválido", async () => {
      await request(app.getHttpServer())
        .get(`/movies/${invalidUuid}`)
        .expect(400);
    });

    it("9. UUID válido pero inexistente", async () => {
      await request(app.getHttpServer())
        .get(`/movies/${nonExistentUuid}`)
        .expect(404);
    });
  });

  // PATCH /movies/:id - 4 casos
  describe("PATCH /movies/:id", () => {
    it("10. Actualiza rating y synopsis con datos válidos", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${createdMovieId}`)
        .send(updateData)
        .expect(200);
      expect(response.body.rating).toBe(updateData.rating);
      expect(response.body.synopsis).toBe(updateData.synopsis);
    });

    it("11. UUID con formato inválido", async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${invalidUuid}`)
        .send({ rating: 9.0 })
        .expect(400);
    });

    it("12. UUID válido pero inexistente", async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${nonExistentUuid}`)
        .send({ rating: 9.0 })
        .expect(404);
    });

    it("13. Rating fuera de rango (ej: 15)", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${createdMovieId}`)
        .send({ rating: 15 })
        .expect(422);
      expect(response.body.message).toBeDefined();
    });
  });

  // DELETE /movies/:id - 2 casos
  describe("DELETE /movies/:id", () => {
    it("14. Elimina la película recién creada", async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${createdMovieId}`)
        .expect(200);
    });

    it("15. Intenta obtener la película eliminada", async () => {
      await request(app.getHttpServer())
        .get(`/movies/${createdMovieId}`)
        .expect(404);
    });
  });
});
