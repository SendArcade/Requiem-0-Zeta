import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // External typography is unrelated to navigation and may be blocked in CI.
  await page.route('https://**', route => route.abort())
})

test('phone catalogue supports touch navigation, history and persistent tabs', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/market')
  const card = page.locator('.shop-card').first()
  await card.scrollIntoViewIfNeeded()
  await card.tap()
  await expect(page).toHaveURL(/\/market\/[^/?]+$/)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Catalogue' })).toHaveAttribute('aria-current', 'page')
  await page.goBack()
  await expect(page).toHaveURL(/\/market$/)
  const tabs = page.getByRole('navigation', { name: 'Main tabs' })
  await tabs.getByRole('link', { name: 'Docs' }).tap()
  await expect(page).toHaveURL(/\/docs$/)
  await expect(page.locator('.docs-article')).toBeVisible()
  expect(errors).toEqual([])
})

test('mobile menu locks scrolling, closes with Escape and restores focus', async ({ page }) => {
  await page.goto('/market')
  const toggle = page.getByRole('button', { name: 'Open menu' })
  await toggle.tap()
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.locator('#staggered-menu-panel')).not.toHaveAttribute('inert')
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(page.locator('#staggered-menu-panel')).toHaveAttribute('inert', '')
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await toggle.tap()
  await page.locator('#staggered-menu-panel').getByRole('link', { name: 'Open documentation', exact: true }).tap()
  await expect(page).toHaveURL(/\/docs$/)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('main layouts fit the viewport and pricing health remains available', async ({ page, request }) => {
  for (const [route, selector] of [['/market', '.shop-card'], ['/market/bx-002', '.pdp-page'], ['/lab?bey=bx-002', '.viewer-page'], ['/docs/pricing', '.docs-article'], ['/x', '.x-home'], ['/burst/customize', '.burst-home'], ['/requiem', '.shell-main']]) {
    await page.goto(route)
    await expect(page.locator(selector).first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('That route dropped a part.')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect((await request.get('/api/health')).status()).toBe(200)
  expect((await request.get('/does-not-exist')).status()).toBe(404)
  expect((await request.post('/__save-spin?id=test', { data: 'GIF89a01234567890' })).status()).toBe(404)
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.display).toBe('standalone')
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200)
})
