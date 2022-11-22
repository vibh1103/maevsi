import { CYPRESS_BASE_URL } from '~/utils/constants'

describe('ical api', () => {
  context('api load', () => {
    it('only allows POST requests', () => {
      const disallowedMethods = ['GET', 'PUT', 'DELETE', 'TRACE', 'PATCH']

      for (const disallowedMethod of disallowedMethods) {
        cy.request({
          url: '/api/ical',
          method: disallowedMethod,
          followRedirect: false,
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.equal(405)
          expect(resp.redirectedToUrl).to.equal(undefined)
          expect(resp.body.message).to.equal('Only POST requests are allowed!')
        })
      }
    })

    it('validates input data', () => {
      const inputData = [
        { data: undefined, message: 'Body is not set!' },
        { data: { contact: {}, invitation: {} }, message: 'Event is not set!' },
      ]

      for (const inputDataElement of inputData) {
        cy.request({
          url: '/api/ical',
          method: 'POST',
          followRedirect: false,
          failOnStatusCode: false,
          body: inputDataElement.data,
        }).then((resp) => {
          expect(resp.status).to.equal(400)
          expect(resp.redirectedToUrl).to.equal(undefined)
          expect(resp.body.message).to.equal(inputDataElement.message)
        })
      }
    })
  })
})

describe('robots page', () => {
  context('page load', () => {
    it('loads the page successfully', () => {
      cy.request('/robots.txt').then((resp) => {
        expect(resp.status).to.equal(200)
        expect(resp.redirectedToUrl).to.equal(undefined)
      })
    })
  })

  context('content', () => {
    it('links the sitemap', () => {
      cy.request('/robots.txt').then((resp) => {
        expect(resp.body).to.include(`Sitemap: ${CYPRESS_BASE_URL}/sitemap.xml`)
      })
    })
  })
})

describe('sitemap page', () => {
  context('page load', () => {
    it('loads the page successfully', () => {
      cy.request('/sitemap.xml').then((resp) => {
        expect(resp.status).to.equal(200)
        expect(resp.redirectedToUrl).to.equal(undefined)
      })
    })
  })

  context('content', () => {
    it('includes the root page', () => {
      cy.request('/sitemap.xml').then((resp) => {
        // TODO: correct https (https://github.com/unjs/is-https/issues/8)
        expect(resp.body).to.satisfy(
          (x: any) =>
            x.includes(
              '<url><loc>http://localhost:3000/</loc><xhtml:link rel="alternate" hreflang="de" href="http://localhost:3000/de"/><xhtml:link rel="alternate" hreflang="en" href="http://localhost:3000/"/></url>'
            ) ||
            x.includes(
              '<url><loc>https://localhost:3000/</loc><xhtml:link rel="alternate" hreflang="de" href="https://localhost:3000/de"/><xhtml:link rel="alternate" hreflang="en" href="https://localhost:3000/"/></url>'
            )
        )
      })
    })

    it('includes the root page localized', () => {
      cy.request('/sitemap.xml').then((resp) => {
        // TODO: correct https (https://github.com/unjs/is-https/issues/8)
        expect(resp.body).to.satisfy(
          (x: any) =>
            x.includes(
              '<url><loc>http://localhost:3000/de</loc><xhtml:link rel="alternate" hreflang="de" href="http://localhost:3000/de"/><xhtml:link rel="alternate" hreflang="en" href="http://localhost:3000/"/></url>'
            ) ||
            x.includes(
              '<url><loc>https://localhost:3000/de</loc><xhtml:link rel="alternate" hreflang="de" href="https://localhost:3000/de"/><xhtml:link rel="alternate" hreflang="en" href="https://localhost:3000/"/></url>'
            )
        )
      })
    })

    it('does not include excluded pages', () => {
      cy.request('/sitemap.xml').then((resp) => {
        expect(resp.body).to.not.include('http://localhost:3000/teapot')
      })
    })
  })
})
