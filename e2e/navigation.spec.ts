import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to EDA page from header', async ({ page }) => {
    await page.goto('/');
    // The button text is "Open EDA" based on components/app/eda-link.tsx
    const edaLink = page.locator('header').getByRole('link', { name: /Open EDA/i });
    await edaLink.click();
    await expect(page).toHaveURL(/\/eda/);
    await expect(page.getByText(/Exploratory Data Analysis/i)).toBeVisible();
  });

  test('should navigate to Explanation page from Hero', async ({ page }) => {
    await page.goto('/');
    const learnMoreButton = page.getByRole('link', { name: /Learn More/i });
    await learnMoreButton.click();
    await expect(page).toHaveURL(/\/explanation/);
    await expect(page.getByText(/From Raw Data to Actionable Insights/i)).toBeVisible();
  });

  test('should navigate to EDA page from Hero', async ({ page }) => {
    await page.goto('/');
    const exploreButton = page.getByRole('link', { name: /Explore the Workspace/i });
    await exploreButton.click();
    await expect(page).toHaveURL(/\/eda/);
  });

  test('should navigate back to Home from Explanation page', async ({ page }) => {
    await page.goto('/explanation');
    const homeButton = page.getByRole('link', { name: /Open Dashboard/i });
    await homeButton.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
