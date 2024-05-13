const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown by default', async ({ page }) => {
    const locator = await page.getByText('Log in')
    expect(locator).toBeVisible()
  })
})