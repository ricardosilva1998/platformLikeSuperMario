import { test, expect } from '@playwright/test';

test('game shell loads and health is OK', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });

  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toEqual({ ok: true });

  const scores = await request.get('/api/scores');
  expect(scores.ok()).toBe(true);
});
