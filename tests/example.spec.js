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

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill(user.username)
      await texboxes[1].fill(user.password)

      await page.click('text=login')
    })

    const createNewBlog = async (page) => {
      await page.click('text=New blog entry')

      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill('Playwright is awesome')
      await texboxes[1].fill('John Appleseed')
      await texboxes[2].fill('http://www.johnappleseed.com')

      const buttons = await page.getByRole('button').all()
      await buttons[1].click()
    }

    test('A blog can be created', async ({ page }) => {
      await createNewBlog(page)

      const locator = await page.getByText('Playwright is awesome by John Appleseed').last()
      await expect(locator).toBeVisible()
    })

    test('A blog can be liked (can be edited)', async ({ page }) => {
      await createNewBlog(page)

      await page.getByRole('button', { name: 'view details' }).click()
      const locator = await page.getByText('0 likes')
      await expect(locator).toBeVisible()

      await page.click('text=like')
      const locator2 = await page.getByText('1 likes')
      await expect(locator2).toBeVisible()
    })

    test('A blog can be deleted by the user who added the blog', async ({ page }) => {
      await createNewBlog(page)

      await page.getByRole('button', { name: 'view details' }).click()

      page.on('dialog', async dialog => { await dialog.accept()})
      await page.click('text=Delete blog')
      const locator = await page.getByText('Playwright is awesome by John Appleseed deleted')
      await expect(locator).toBeVisible()
    })

    test('Delete blog is only visible to the user who added the blog', async ({ page, request }) => {
      await createNewBlog(page)

      await page.getByRole('button', { name: 'view details' }).click()

      const locator = await page.getByRole('button', { name: 'Delete blog' })
      await expect(locator).toBeVisible()

      await page.getByRole('button', { name: 'Log out' }).click()

      const newbieUser = {username: "newuser", password: "new", name: "Newbie"}

      await request.post(`${baseURL}/api/users`, { data: newbieUser })

      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill(newbieUser.username)
      await texboxes[1].fill(newbieUser.password)

      await page.click('text=login')
      const locator2 = await page.getByText('Playwright is awesome by John Appleseed')
      await expect(locator2).toBeVisible()

      await page.getByRole('button', { name: 'view details' }).click()

      const locator3 = await page.getByRole('button', { name: 'Delete blog' })
      await expect(locator3).toBeHidden()
    })

  })
})