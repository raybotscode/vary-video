import {test, expect} from '@playwright/test';

/**
 * Phase 1 responsive verification for the dashboard.
 * Covers the viewports required by DEVELOPMENT_PLAN §7:
 * 360x800, 390x844, 430x932, 768x1024, 1024x768, 1440x900
 */
const VIEWPORTS = [
  {name: 'small-mobile', width: 360, height: 800},
  {name: 'modern-mobile', width: 390, height: 844},
  {name: 'large-mobile', width: 430, height: 932},
  {name: 'tablet', width: 768, height: 1024},
  {name: 'tablet-landscape', width: 1024, height: 768},
  {name: 'desktop', width: 1440, height: 900},
];

/**
 * Navigate to the dashboard by clicking the hero CTA.
 * (The navbar Dashboard link is hidden inside the hamburger on mobile.)
 */
const gotoDashboard = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', {name: /get started/i}).click();
  await page.waitForTimeout(500);
};

const gotoComposer = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', {name: /scene composer/i}).click();
  await page.waitForTimeout(500);
};

test.describe('dashboard responsive', () => {
  for (const viewport of VIEWPORTS) {
    test(`no horizontal scroll at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      await gotoDashboard(page);

      // Give the app a beat to settle, then measure.
      await page.waitForTimeout(500);
      const {scrollWidth, clientWidth} = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test(`mobile action bar visible on mobile, hidden on desktop (${viewport.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      await gotoDashboard(page);
      await page.waitForTimeout(500);

      const mobileBarVisible = await page
        .locator('.mobile-action-bar')
        .first()
        .isVisible()
        .catch(() => false);

      if (viewport.width <= 768) {
        expect(mobileBarVisible).toBe(true);
      } else {
        expect(mobileBarVisible).toBe(false);
      }
    });
  }

  test('mobile composer switches tabs without horizontal scroll', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await gotoComposer(page);

    // Composer mode should show the mobile tab layout at this width.
    const mobileComposerVisible = await page.locator('.composer-mobile').isVisible().catch(() => false);
    expect(mobileComposerVisible).toBe(true);

    // Scenes tab is active by default; click Content (enabled only when a block is selected).
    const contentTab = page.getByRole('tab', {name: 'Content'});
    if (await contentTab.isEnabled()) {
      await contentTab.click();
      await page.waitForTimeout(200);
    }

    const {scrollWidth, clientWidth} = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('mobile palette sheet opens and searches', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await gotoComposer(page);

    const addBlockButton = page.getByRole('button', {name: /add block/i}).first();
    await addBlockButton.click();
    await page.waitForTimeout(300);

    const sheet = page.locator('.palette-sheet');
    await expect(sheet).toBeVisible();

    const search = page.getByRole('searchbox', {name: /search blocks/i});
    await search.fill('brand');
    await page.waitForTimeout(200);

    // Only matching block cards remain (name/description/category contains "brand").
    const visibleCards = await page.locator('.palette-sheet .block-card').count();
    expect(visibleCards).toBeGreaterThanOrEqual(1);

    const hasNonMatching = await page
      .locator('.palette-sheet .block-card')
      .evaluateAll((cards) =>
        cards.some((card) => !card.textContent?.toLowerCase().includes('brand')),
      );
    expect(hasNonMatching).toBe(false);
  });
});
