import { test, expect } from '@playwright/test';

test.describe('Explanation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explanation');
  });

  test('should load with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /From Raw Data to Actionable Insights/i })).toBeVisible();
  });

  test('should have three data type cards', async ({ page }) => {
    await expect(page.getByText(/Coronal Mass Ejections/i)).toBeVisible();
    await expect(page.getByText(/Solar Flares/i)).toBeVisible();
    await expect(page.getByText(/Geomagnetic Storms/i)).toBeVisible();
  });

  test('should explain how automated EDA works', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /How Our Automated EDA Works/i })).toBeVisible();
    
    await expect(page.getByRole('heading', { name: 'Smart Visualizations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI-Powered Insights' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bring Your Own Data' })).toBeVisible();
  });

  test('should have CTA buttons linking to Home and EDA', async ({ page }) => {
    const dashboardBtn = page.getByRole('link', { name: /Open Dashboard/i });
    await expect(dashboardBtn).toBeVisible();
    await expect(dashboardBtn).toHaveAttribute('href', '/');

    const edaBtn = page.getByRole('link', { name: /Try EDA Workspace/i });
    await expect(edaBtn).toBeVisible();
    await expect(edaBtn).toHaveAttribute('href', '/eda');
  });
});
