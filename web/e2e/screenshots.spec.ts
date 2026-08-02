import {test} from '@playwright/test';

/**
 * Captures visual regression screenshots for Phase 1 acceptance:
 * 360x800, 390x844, 430x932, 768x1024, 1024x768, 1440x900.
 * Output: web/test-results/screenshots/<name>.png
 */
const VIEWPORTS = [
  {name: '360x800', width: 360, height: 800},
  {name: '390x844', width: 390, height: 844},
  {name: '430x932', width: 430, height: 932},
  {name: '768x1024', width: 768, height: 1024},
  {name: '1024x768', width: 1024, height: 768},
  {name: '1440x900', width: 1440, height: 900},
];

const gotoDashboard = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', {name: /get started/i}).click();
  await page.waitForTimeout(600);
};

const gotoComposer = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', {name: /scene composer/i}).click();
  await page.waitForTimeout(600);
};

test.describe('screenshots', () => {
  for (const viewport of VIEWPORTS) {
    test(`dashboard at ${viewport.name}`, async ({page}) => {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      await gotoDashboard(page);
      await page.screenshot({
        path: `test-results/screenshots/dashboard-${viewport.name}.png`,
        fullPage: true,
      });
    });

    test(`composer at ${viewport.name}`, async ({page}) => {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      await gotoComposer(page);
      await page.screenshot({
        path: `test-results/screenshots/composer-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
});
