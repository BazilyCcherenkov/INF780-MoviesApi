import type { Movie } from '../../src/types/movie'

const baseMovie: Movie = {
  id: '1',
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals secrets through dreams.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const allMovies: Movie[] = [
  { ...baseMovie, id: '1', title: 'Inception', director: 'Christopher Nolan', genre: 'sci-fi', year: 2010, rating: 8.8 },
  { ...baseMovie, id: '2', title: 'Interstellar', director: 'Christopher Nolan', genre: 'sci-fi', year: 2014, rating: 9.0 },
  { ...baseMovie, id: '3', title: 'The Dark Knight', director: 'Christopher Nolan', genre: 'action', year: 2008, rating: 9.0 },
  { ...baseMovie, id: '4', title: 'Pulp Fiction', director: 'Quentin Tarantino', genre: 'thriller', year: 1994, rating: 8.9 },
  { ...baseMovie, id: '5', title: 'Forrest Gump', director: 'Robert Zemeckis', genre: 'drama', year: 1994, rating: 8.8 },
  { ...baseMovie, id: '6', title: 'The Matrix', director: 'Lana Wachowski', genre: 'sci-fi', year: 1999, rating: 8.7 },
  { ...baseMovie, id: '7', title: 'Toy Story', director: 'John Lasseter', genre: 'animation', year: 1995, rating: 8.3 },
  { ...baseMovie, id: '8', title: 'The Godfather', director: 'Francis Ford Coppola', genre: 'drama', year: 1972, rating: 9.2 },
  { ...baseMovie, id: '9', title: 'Get Out', director: 'Jordan Peele', genre: 'horror', year: 2017, rating: 7.7 },
  { ...baseMovie, id: '10', title: 'Superbad', director: 'Greg Mottola', genre: 'comedy', year: 2007, rating: 7.6 },
]

describe('Búsqueda y filtros - Search & Filter', () => {
  beforeEach(() => {
    cy.intercept('GET', '/movies', { body: allMovies }).as('getMovies')
    cy.visit('/')
    cy.wait('@getMovies')
  })

  describe('Búsqueda por título - captura de caja de texto', () => {
    it('1. escribe en el search-input y verifica el valor capturado', () => {
      cy.get('.search-input').should('have.value', '')
      cy.get('.search-input').type('Inception')
      cy.get('.search-input').should('have.value', 'Inception')
    })

    it('2. búsqueda exacta por título devuelve 1 resultado', () => {
      cy.get('.search-input').type('Inception')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.movie-title').first().should('contain', 'Inception')
      cy.get('.status-msg').should('not.exist')
    })

    it('3. búsqueda parcial por título (primeras 3 letras "Inc")', () => {
      cy.get('.search-input').type('Inc')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.movie-title').first().should('contain', 'Inception')
    })

    it('4. búsqueda parcial por título ("The") devuelve múltiples resultados', () => {
      cy.get('.search-input').type('The')
      cy.get('.movie-card').should('have.length', 3)
      const titles: string[] = []
      cy.get('.movie-title').each(($el) => titles.push($el.text()))
      cy.then(() => {
        expect(titles).to.include.members(['The Dark Knight', 'The Matrix', 'The Godfather'])
      })
    })

    it('5. búsqueda case-insensitive ("the" en minúscula)', () => {
      cy.get('.search-input').type('the')
      cy.get('.movie-card').should('have.length', 3)
    })

    it('6. búsqueda con espacios al inicio no afecta el filtro', () => {
      cy.get('.search-input').type('  Inception')
      cy.get('.movie-card').should('have.length', 1)
    })

    it('7. borrar el texto del search-input restaura la lista completa', () => {
      cy.get('.search-input').type('xyz')
      cy.get('.movie-card').should('not.exist')
      cy.contains('No se encontraron películas.').should('be.visible')
      cy.get('.search-input').clear()
      cy.get('.movie-card').should('have.length', 10)
    })

    it('8. escribir carácter por carácter y verificar filtro en cada paso', () => {
      cy.get('.search-input').type('I')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.search-input').type('n')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.search-input').clear()
      cy.get('.search-input').type('T')
      cy.get('.movie-card').should('have.length', 3)
    })

    it('9. búsqueda con números en el título', () => {
      cy.intercept('GET', '/movies', {
        body: [
          ...allMovies,
          { ...baseMovie, id: '11', title: 'Room 1408', director: 'Mikael Håfström', genre: 'horror', year: 2007, rating: 6.8 },
        ],
      }).as('getMoviesWithNumber')
      cy.visit('/')
      cy.wait('@getMoviesWithNumber')
      cy.get('.search-input').type('1408')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'Room 1408').should('be.visible')
    })

    it('10. placeholder del input de búsqueda es correcto', () => {
      cy.get('.search-input').should('have.attr', 'placeholder', 'Buscar por título o director…')
    })
  })

  describe('Búsqueda por director', () => {
    it('11. buscar por nombre de director ("Christopher Nolan")', () => {
      cy.get('.search-input').type('Christopher Nolan')
      cy.get('.movie-card').should('have.length', 3)
    })

    it('12. buscar por apellido de director ("Tarantino")', () => {
      cy.get('.search-input').type('Tarantino')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'Pulp Fiction').should('be.visible')
    })
  })

  describe('Filtro por género (select)', () => {
    it('13. seleccionar "Ciencia Ficción" filtra 3 películas', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').should('have.length', 3)
      cy.get('.genre-badge').each(($badge) => {
        cy.wrap($badge).should('contain', 'Ciencia Ficción')
      })
    })

    it('14. seleccionar "Drama" filtra 2 películas', () => {
      cy.get('.genre-filter').select('Drama')
      cy.get('.movie-card').should('have.length', 2)
      cy.get('.genre-badge').each(($badge) => {
        cy.wrap($badge).should('contain', 'Drama')
      })
    })

    it('15. seleccionar "Acción" filtra 1 película', () => {
      cy.get('.genre-filter').select('Acción')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'The Dark Knight').should('be.visible')
    })

    it('16. "Todos los géneros" (default) muestra todas las películas', () => {
      cy.get('.genre-filter').select('Animación')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.genre-filter').select('')
      cy.get('.movie-card').should('have.length', 10)
    })
  })

  describe('Combinación de búsqueda + género', () => {
    it('17. título "The" + género "Drama" devuelve 1 resultado', () => {
      cy.get('.search-input').type('The')
      cy.get('.genre-filter').select('Drama')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'The Godfather').should('be.visible')
    })

    it('18. director "Christopher Nolan" + género "Acción" devuelve 1 resultado', () => {
      cy.get('.search-input').type('Christopher Nolan')
      cy.get('.genre-filter').select('Acción')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'The Dark Knight').should('be.visible')
    })

    it('19. búsqueda sin match + género activo = mensaje vacío', () => {
      cy.get('.search-input').type('ZZZZ')
      cy.get('.genre-filter').select('Comedia')
      cy.contains('No se encontraron películas.').should('be.visible')
      cy.get('.movie-card').should('not.exist')
    })
  })

  describe('Verificación visual de resultados', () => {
    it('20. cada tarjeta filtrada contiene el texto buscado en título o director', () => {
      cy.get('.search-input').type('Nolan')
      cy.get('.movie-card').each(($card) => {
        const text = $card.text().toLowerCase()
        expect(text).to.include('nolan')
      })
    })

    it('21. el género badge coincide con el filtro seleccionado', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').each(($card) => {
        cy.wrap($card).find('.genre-badge').should('contain', 'Ciencia Ficción')
      })
    })

    it('22. cambiar filtro de género actualiza los resultados inmediatamente', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.movie-card').should('have.length', 3)
      cy.get('.genre-filter').select('Comedia')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.genre-filter').select('Terror')
      cy.get('.movie-card').should('have.length', 1)
    })

    it('23. al escribir y limpiar, los resultados vuelven al filtro de género activo', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.search-input').type('The')
      cy.get('.movie-card').should('have.length', 1)
      cy.get('.search-input').clear()
      cy.get('.movie-card').should('have.length', 3)
      cy.get('.genre-badge').each(($badge) => {
        cy.wrap($badge).should('contain', 'Ciencia Ficción')
      })
    })
  })

  describe('Cobertura de casos límite', () => {
    it('24. lista vacía desde backend muestra mensaje', () => {
      cy.intercept('GET', '/movies', { body: [] }).as('getEmpty')
      cy.visit('/')
      cy.wait('@getEmpty')
      cy.contains('No se encontraron películas.').should('be.visible')
      cy.get('.movie-card').should('not.exist')
    })

    it('25. caracteres especiales en búsqueda no rompen el filtro', () => {
      cy.get('.search-input').type('@#$%^&*()')
      cy.contains('No se encontraron películas.').should('be.visible')
    })

    it('26. títulos con acentos y caracteres Unicode', () => {
      cy.intercept('GET', '/movies', {
        body: [
          { ...baseMovie, id: '12', title: 'José y María', director: 'Director', genre: 'drama', year: 2020 },
          { ...baseMovie, id: '13', title: 'São Paulo Nights', director: 'Director', genre: 'thriller', year: 2021 },
        ],
      }).as('getUnicode')
      cy.visit('/')
      cy.wait('@getUnicode')
      cy.get('.search-input').type('José')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'José y María').should('be.visible')
      cy.get('.search-input').clear()
      cy.get('.search-input').type('São')
      cy.get('.movie-card').should('have.length', 1)
      cy.contains('.movie-title', 'São Paulo Nights').should('be.visible')
    })

    it('27. filtro de género con valor por defecto "Todos los géneros"', () => {
      cy.get('.genre-filter').find('option:selected').should('have.text', 'Todos los géneros')
      cy.get('.genre-filter').should('have.value', '')
    })

    it('28. cambiar entre géneros rápidamente no causa errores', () => {
      cy.get('.genre-filter').select('Ciencia Ficción')
      cy.get('.genre-filter').select('Drama')
      cy.get('.genre-filter').select('Comedia')
      cy.get('.genre-filter').select('Terror')
      cy.get('.movie-card').should('have.length', 1)
    })
  })
})
