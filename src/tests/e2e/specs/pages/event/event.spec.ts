import { test, expect } from '@playwright/test'

import { TIMEZONE_COOKIE_NAME } from '../../../../../utils/constants'
import {
  COOKIE_CONTROL_DEFAULT,
  TIMEZONE_DEFAULT,
} from '../../../utils/constants'

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: TIMEZONE_COOKIE_NAME,
      value: TIMEZONE_DEFAULT,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'ncc_c',
      value: COOKIE_CONTROL_DEFAULT,
      domain: 'localhost',
      path: '/',
    },
  ])
})

test.describe('page load', () => {
  test('loads the page successfully', async ({ request }) => {
    const resp = await request.get('/event')
    expect(resp.status()).toBe(200)
  })
})

// TODO: mock data
// context('visual regression', () => {
//   it('looks as before', () => {
//     cy.visit('/event')
//     cy.get('[data-is-loading="false"]').should('be.visible')
//     cy.get('[data-testid="nuxt-cookie-control-control-button"]').should(
//       'be.visible'
//     )
//     cy.compareSnapshot('event')
//   })
// })
