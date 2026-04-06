import { test, expect } from '@playwright/test'

test.describe('About page', () => {
  test('heading is visible and full-page screenshot is written', async ({ page }) => {
    await page.goto('/about')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Screenshot for manual inspection (see test-results/ after run)
    await page.screenshot({ path: 'test-results/about-full.png', fullPage: true })

    // When an author profile exists, name should not be clipped: box should fit text
    const box = await h1.boundingBox()
    if (box && box.height > 0) {
      expect(box.height).toBeGreaterThan(20)
    }
  })
})
