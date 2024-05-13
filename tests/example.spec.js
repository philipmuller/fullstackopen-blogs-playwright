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

    const createNewBlog = async (page, title) => {
      const texboxes = await page.getByRole('textbox').all()
      await texboxes[0].fill(title)
      await texboxes[1].fill('John Appleseed')
      await texboxes[2].fill('http://www.johnappleseed.com')

      const buttons = await page.getByRole('button').all()
      await buttons[1].click()
    }

    const initWithNewBlog = async (page) => {
      await page.click('text=New blog entry')
      await createNewBlog(page, 'Playwright is awesome')
    }

    test('A blog can be created', async ({ page }) => {
      await initWithNewBlog(page)

      const locator = await page.getByText('Playwright is awesome by John Appleseed').last()
      await expect(locator).toBeVisible()
    })

    test('A blog can be liked (can be edited)', async ({ page }) => {
      await initWithNewBlog(page)

      await page.getByRole('button', { name: 'view details' }).click()
      const locator = await page.getByText('0 likes')
      await expect(locator).toBeVisible()

      await page.click('text=like')
      const locator2 = await page.getByText('1 likes')
      await expect(locator2).toBeVisible()
    })

    test('A blog can be deleted by the user who added the blog', async ({ page }) => {
      await initWithNewBlog(page)

      await page.getByRole('button', { name: 'view details' }).click()

      page.on('dialog', async dialog => { await dialog.accept()})
      await page.click('text=Delete blog')
      const locator = await page.getByText('Playwright is awesome by John Appleseed deleted')
      await expect(locator).toBeVisible()
    })

    test('Delete blog is only visible to the user who added the blog', async ({ page, request }) => {
      await initWithNewBlog(page)

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

    test('Blogs are ordered by likes', async ({ page, request }) => {
      await initWithNewBlog(page)
      await page.waitForTimeout(50)
      await createNewBlog(page, 'Blog 2')

      await page.waitForTimeout(100)

      let blogs = await page.locator('.blog').all()

      await blogs[0].getByRole('button', { name: 'view details' }).click()
      const locator = await blogs[0].getByText('0 likes')
      await expect(locator).toBeVisible()

      //if playwright is awesome is found in the blogs[0] item, then that blog is the first one
      const firstblogTitleLocator = blogs[0].getByText('Playwright is awesome by John Appleseed')
      await expect(firstblogTitleLocator).toBeVisible()

      await page.waitForTimeout(50)

      await blogs[1].getByRole('button', { name: 'view details' }).click()
      const locator1 = await blogs[1].getByText('0 likes')
      await expect(locator1).toBeVisible()
      await blogs[1].getByRole('button', { name: 'like' }).click()
      await page.waitForTimeout(50)
      const locator2 = await page.getByText('1 likes')
      await expect(locator2).toBeVisible()

      await page.waitForTimeout(100)
      //if blogs are ordered by likes, the second blog should now be first
      blogs = await page.locator('.blog').all() //we are fetching the blogs again

      //if Blog2 is found in the blogs[0] item, then that blog is the first one, which happened because it got liked more
      const newFirstBlogTitleLocator = blogs[0].getByText('Blog 2 by John Appleseed')
      await expect(newFirstBlogTitleLocator).toBeVisible()
    })

  })
})