const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown by default', async ({ page }) => {
    const locator = await page.getByText('Log in')
    await expect(locator).toBeVisible()
  })

  // describe('Login', () => {
  //   test('succeeds with correct credentials', async ({ page }) => {
  //     await page.fill('input[name="username"]', 'root')
  //     await page.fill('input[name="password"]', 'sekret')
  //     await page.click('text=login')
  //     const locator = await page.getByText('root logged in')
  //     expect(locator).toBeVisible()
  //   })

  //   test('fails with wrong credentials', async ({ page }) => {
  //     await page.fill('input[name="username"]', 'root')
  //     await page.fill('input[name="password"]', 'wrong')
  //     await page.click('text=login')
  //     const locator = await page.getByText('wrong username or password')
  //     expect(locator).toBeVisible()
  //   })
  // })
})