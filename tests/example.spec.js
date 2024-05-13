const { test, expect, beforeEach, describe } = require('@playwright/test')

//Note: for end to end tests to work, the server needs to be in test mode connected to the test database (NODE_ENV=test)

describe('Blog app', () => {
  let user = {
    username: 'play',
    password: 'play',
    name: 'Playwright'
  }
  let baseURL = 'http://localhost:5173'

  beforeEach(async ({ page, request }) => {
    await request.post(`${baseURL}/api/testing/reset`)
    await request.post(`${baseURL}/api/users`, { data: user })

    await page.goto(baseURL)
  })

  test('Login form is shown by default', async ({ page }) => {
    const locator = await page.getByText('Log in')
    await expect(locator).toBeVisible()
  })

  describe('Login', () => {
    
    test('succeeds with correct credentials', async ({ page }) => {
      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill(user.username)
      await texboxes[1].fill(user.password)

      await page.click('text=login')
      const locator = await page.getByText('Playwright logged-in')
      await expect(locator).toBeVisible()
    })

    test('fails with incorrect credentials', async ({ page }) => {
      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill("random")
      await texboxes[1].fill("false")

      await page.click('text=login')
      const locator = await page.getByText('Wrong username or password')
      await expect(locator).toBeVisible()
    })
  })
})