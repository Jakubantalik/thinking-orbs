import { expect, test } from '@playwright/test';

test('state changes reuse one canvas and can interrupt', async ({ page }) => {
  await page.goto('/');
  const orb = page.getByTestId('transition-orb');
  await expect(orb).toHaveCount(1);
  await orb.evaluate((canvas) => ((canvas as HTMLCanvasElement & { original?: boolean }).original = true));
  await page.locator('[data-state-button="thinking"]').click();
  await page.locator('[data-state-button="searching"]').click();
  await expect(orb).toHaveJSProperty('original', true);
  await expect(page.getByTestId('transition-event')).toContainText('searching');
});

test('hover, focus, touch fallback and reduced motion are observable', async ({ page }) => {
  await page.goto('/');
  const orb = page.getByTestId('transition-orb');
  await page.getByTestId('reduced-motion').check();
  const before = await orb.screenshot();
  await orb.dispatchEvent('pointerenter', { pointerType: 'touch' });
  const touch = await orb.screenshot();
  expect(touch.equals(before)).toBe(true);
  await orb.hover();
  const hovered = await orb.screenshot();
  expect(hovered.equals(before)).toBe(false);
  await orb.focus();
  await expect(orb).toBeFocused();
  await page.locator('[data-state-button="error"]').click();
  await expect(page.getByTestId('transition-event')).toContainText('end');
});
