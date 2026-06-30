describe('Smoke Tests - Carga de página y assets', () => {
  beforeEach(() => {
    cy.intercept('GET', '/movies', { fixture: 'movies.json' }).as('getMovies')
    cy.visit('/')
    cy.wait('@getMovies')
  })

  it('la página responde con status 200', () => {
    cy.request('/').its('status').should('eq', 200)
  })

  it('carga el archivo HTML correctamente', () => {
    cy.document().its('contentType').should('eq', 'text/html')
    cy.document().its('charset').should('eq', 'UTF-8')
  })

  it('el título de la página es correcto', () => {
    cy.title().should('eq', 'frontend')
  })

  it('el meta viewport está configurado', () => {
    cy.get('meta[name="viewport"]')
      .should('have.attr', 'content')
      .and('include', 'width=device-width')
  })

  it('el favicon se carga correctamente', () => {
    cy.get('link[rel="icon"]')
      .should('have.attr', 'href')
      .and('include', '.svg')
  })

  it('el script principal main.tsx se carga', () => {
    cy.get('script[type="module"][src*="main"]').should('exist')
  })

  it('el div#root existe y se renderiza', () => {
    cy.get('#root').should('exist')
    cy.get('#root').should('not.be.empty')
  })

  it('la aplicación monta correctamente (renderiza el header)', () => {
    cy.contains('h1', 'Movies API').should('be.visible')
  })

  it('muestra el botón de nueva película', () => {
    cy.contains('button', '+ Nueva película').should('be.visible')
  })

  it('los estilos CSS se aplican (.app-header existe)', () => {
    cy.get('.app-header').should('be.visible')
  })

  it('los filtros se muestran en pantalla', () => {
    cy.get('.search-input').should('be.visible')
    cy.get('.genre-filter').should('be.visible')
  })

  it('las películas mock se cargan desde el fixture', () => {
    cy.get('.movies-grid').should('exist')
    cy.get('.movie-card').should('have.length.at.least', 1)
  })

  it('cada película mock tiene título visible', () => {
    cy.get('.movie-card').first().find('.movie-title').should('not.be.empty')
  })
})
