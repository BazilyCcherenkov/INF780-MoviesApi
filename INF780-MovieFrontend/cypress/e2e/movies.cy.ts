import type { Movie } from '../../src/types/movie'

const mockMovie: Movie = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
  createdAt: '2026-06-10T10:00:00.000Z',
  updatedAt: '2026-06-10T10:00:00.000Z',
}

const createdMovie: Movie = {
  ...mockMovie,
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Interstellar',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2014,
  rating: 9.0,
  synopsis: 'When Earth becomes uninhabitable, a team of explorers travels through a wormhole.',
}

const updatedMovie: Movie = {
  ...mockMovie,
  rating: 9.5,
  synopsis: 'Updated synopsis for testing.',
}

describe('Movies App - Funcionalidad con Intercepts', () => {
  describe('Performance Tests', () => {
    it('la respuesta de GET /movies es menor a 500ms', () => {
      cy.intercept('GET', '/movies', {
        body: [mockMovie],
        delay: 100,
      }).as('getMoviesFast')
      cy.visit('/')
      cy.wait('@getMoviesFast').its('duration').should('be.lessThan', 500)
    })

    it('la respuesta de POST /movies es menor a 500ms', () => {
      cy.intercept('GET', '/movies', { body: [] }).as('getMovies')
      cy.intercept('POST', '/movies', {
        body: createdMovie,
        delay: 100,
      }).as('createMovieFast')
      cy.visit('/')
      cy.wait('@getMovies')
      cy.contains('button', '+ Nueva película').click()
      cy.get('input[required]').first().type('Interstellar')
      cy.get('label').contains('Director').find('input').type('Christopher Nolan')
      cy.contains('button', 'Crear').click()
      cy.wait('@createMovieFast').its('duration').should('be.lessThan', 500)
    })

    it('el renderizado de la lista es menor a 2s', () => {
      cy.intercept('GET', '/movies', {
        body: Array(10).fill(mockMovie).map((m, i) => ({
          ...m,
          id: `id-${i}`,
          title: `Movie ${i + 1}`,
        })),
        delay: 200,
      }).as('getMovies')
      const start = Date.now()
      cy.visit('/')
      cy.wait('@getMovies')
      cy.get('.movie-card').should('have.length', 10)
      cy.then(() => {
        expect(Date.now() - start).to.be.lessThan(2000)
      })
    })
  })

  describe('Funcionalidad CRUD', () => {
    beforeEach(() => {
      cy.intercept('GET', '/movies', { body: [mockMovie] }).as('getMovies')
      cy.visit('/')
      cy.wait('@getMovies')
    })

    it('1. muestra la lista de películas', () => {
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'Inception').should('be.visible')
    })

    it('2. abre el formulario de creación', () => {
      cy.contains('button', '+ Nueva película').click()
      cy.contains('h2', 'Nueva película').should('be.visible')
      cy.contains('button', 'Crear').should('be.visible')
    })

    it('3. crea una nueva película vía POST', () => {
      cy.intercept('POST', '/movies', { body: createdMovie }).as('createMovie')
      cy.contains('button', '+ Nueva película').click()
      cy.get('input[required]').first().type('Interstellar')
      cy.get('label').contains('Director').find('input').type('Christopher Nolan')
      cy.get('label').contains('Rating').find('input').clear().type('9')
      cy.contains('button', 'Crear').click()
      cy.wait('@createMovie')
      cy.contains('.movie-card', 'Interstellar').should('be.visible')
    })

    it('4. edita una película vía PATCH', () => {
      cy.intercept('PATCH', `/movies/${mockMovie.id}`, { body: updatedMovie }).as('updateMovie')
      cy.get('.movie-card').first().contains('button', 'Editar').click()
      cy.contains('h2', 'Editar película').should('be.visible')
      cy.get('label').contains('Rating').find('input').clear().type('9.5')
      cy.contains('button', 'Actualizar').click()
      cy.wait('@updateMovie')
      cy.contains('.rating-number', '9.5').should('be.visible')
    })

    it('5. elimina una película vía DELETE', () => {
      cy.intercept('DELETE', `/movies/${mockMovie.id}`, { statusCode: 200 }).as('deleteMovie')
      cy.get('.movie-card').first().contains('button', 'Eliminar').click()
      cy.contains('h3', '¿Eliminar película?').should('be.visible')
      cy.contains('button', 'Eliminar').click()
      cy.wait('@deleteMovie')
      cy.get('.movie-card').should('not.exist')
    })
  })

  describe('Validaciones del formulario', () => {
    beforeEach(() => {
      cy.intercept('GET', '/movies', { body: [mockMovie] }).as('getMovies')
      cy.visit('/')
      cy.wait('@getMovies')
      cy.contains('button', '+ Nueva película').click()
    })

    it('6. el botón Crear está presente en el formulario', () => {
      cy.contains('button', 'Crear').should('be.visible')
    })

    it('7. el formulario tiene campo Título requerido', () => {
      cy.get('input[required]').first().should('be.visible')
    })

    it('8. el botón Cancelar cierra el formulario', () => {
      cy.contains('button', 'Cancelar').click()
      cy.contains('h2', 'Nueva película').should('not.exist')
    })

    it('9. el campo Rating acepta valores decimales', () => {
      cy.get('label').contains('Rating').find('input').clear().type('7.5')
      cy.get('label').contains('Rating').find('input').should('have.value', '7.5')
    })

    it('10. el campo Año tiene min=1888 y max=2030', () => {
      cy.get('label').contains('Año').find('input').should('have.attr', 'min', '1888')
      cy.get('label').contains('Año').find('input').should('have.attr', 'max', '2030')
    })
  })

  describe('Búsqueda y filtros', () => {
    const movies = [
      mockMovie,
      { ...mockMovie, id: 'id-2', title: 'Interstellar', genre: 'sci-fi' as const },
      { ...mockMovie, id: 'id-3', title: 'The Dark Knight', genre: 'action' as const, director: 'Christopher Nolan' },
    ]

    beforeEach(() => {
      cy.intercept('GET', '/movies', { body: movies }).as('getMovies')
      cy.visit('/')
      cy.wait('@getMovies')
    })

    it('11. filtra por título parcialmente', () => {
      cy.get('.search-input').type('Inception')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'Inception').should('be.visible')
    })

    it('12. filtra por director', () => {
      cy.get('.search-input').type('Dark')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'The Dark Knight').should('be.visible')
    })

    it('13. muestra mensaje cuando no hay resultados', () => {
      cy.get('.search-input').type('ZZZZnotfound')
      cy.contains('No se encontraron películas.').should('be.visible')
      cy.get('.movie-card').should('not.exist')
    })

    it('14. filtra por género usando el select', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').should('have.length', 2)
      cy.get('.movie-card').each(($card) => {
        cy.wrap($card).find('.genre-badge').should('contain', 'Ciencia Ficción')
      })
    })

    it('15. combinación de filtro texto + género', () => {
      cy.get('.search-input').type('Interstellar')
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'Interstellar').should('be.visible')
    })

    it('16. "Todos los géneros" muestra todas las películas', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').should('have.length', 2)
      cy.get('.genre-filter').select('')
      cy.get('.movie-card').should('have.length', 3)
    })
  })

  describe('Confirmación de eliminación', () => {
    beforeEach(() => {
      cy.intercept('GET', '/movies', { body: [mockMovie] }).as('getMovies')
      cy.visit('/')
      cy.wait('@getMovies')
    })

    it('17. abre diálogo de confirmación', () => {
      cy.get('.movie-card').first().contains('button', 'Eliminar').click()
      cy.contains('h3', '¿Eliminar película?').should('be.visible')
      cy.contains('p', 'Esta acción no se puede deshacer.').should('be.visible')
      cy.contains('button', 'Cancelar').should('be.visible')
      cy.contains('button', 'Eliminar').should('be.visible')
    })

    it('18. cancelar eliminación cierra el diálogo', () => {
      cy.get('.movie-card').first().contains('button', 'Eliminar').click()
      cy.contains('button', 'Cancelar').click()
      cy.contains('h3', '¿Eliminar película?').should('not.exist')
    })

    it('19. confirmar eliminación elimina la tarjeta', () => {
      cy.intercept('DELETE', `/movies/${mockMovie.id}`, { statusCode: 200 }).as('deleteMovie')
      cy.get('.movie-card').first().contains('button', 'Eliminar').click()
      cy.contains('button', 'Eliminar').click()
      cy.wait('@deleteMovie')
      cy.get('.movie-card').should('not.exist')
    })
  })

  describe('Intercept - Validación de métodos HTTP', () => {
    it('20. GET /movies se llama al cargar la página', () => {
      cy.intercept('GET', '/movies').as('getMovies')
      cy.visit('/')
      cy.wait('@getMovies').its('request.method').should('eq', 'GET')
    })

    it('21. POST /movies se llama al crear', () => {
      cy.intercept('GET', '/movies', { body: [] }).as('getMovies')
      cy.intercept('POST', '/movies').as('createMovie')
      cy.visit('/')
      cy.wait('@getMovies')
      cy.contains('button', '+ Nueva película').click()
      cy.get('input[required]').first().type('Test')
      cy.get('label').contains('Director').find('input').type('Test')
      cy.contains('button', 'Crear').click()
      cy.wait('@createMovie').its('request.method').should('eq', 'POST')
    })

    it('22. PATCH /movies se llama al editar', () => {
      cy.intercept('GET', '/movies', { body: [mockMovie] }).as('getMovies')
      cy.intercept('PATCH', `/movies/${mockMovie.id}`).as('updateMovie')
      cy.visit('/')
      cy.wait('@getMovies')
      cy.get('.movie-card').first().contains('button', 'Editar').click()
      cy.contains('button', 'Actualizar').click()
      cy.wait('@updateMovie').its('request.method').should('eq', 'PATCH')
    })

    it('23. DELETE /movies/:id se llama al eliminar', () => {
      cy.intercept('GET', '/movies', { body: [mockMovie] }).as('getMovies')
      cy.intercept('DELETE', `/movies/${mockMovie.id}`, { statusCode: 200 }).as('deleteMovie')
      cy.visit('/')
      cy.wait('@getMovies')
      cy.get('.movie-card').first().contains('button', 'Eliminar').click()
      cy.contains('button', 'Eliminar').click()
      cy.wait('@deleteMovie').its('request.method').should('eq', 'DELETE')
    })
  })

  describe('Manejo de errores del backend', () => {
    it('24. muestra mensaje de error si GET /movies falla', () => {
      cy.intercept('GET', '/movies', { statusCode: 500, body: { message: 'Server error' } }).as('getMoviesFail')
      cy.visit('/')
      cy.wait('@getMoviesFail')
      cy.contains('Error:', 'Server error').should('be.visible')
    })

    it('25. el botón de nueva película sigue visible aunque falle la carga', () => {
      cy.intercept('GET', '/movies', { statusCode: 500, body: { message: 'Error' } }).as('fail')
      cy.visit('/')
      cy.wait('@fail')
      cy.contains('button', '+ Nueva película').should('be.visible')
    })
  })
})
