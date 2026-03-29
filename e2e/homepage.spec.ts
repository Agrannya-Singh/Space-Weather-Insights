import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Space Weather Insights/);
  });

  test('should display main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Space Weather Dashboard/i });
    await expect(heading).toBeVisible();
  });

  test('should have hero section with correct text', async ({ page }) => {
    const heroHeading = page.getByRole('heading', { name: /Unveiling the Mysteries of Space Weather/i });
    await expect(heroHeading).toBeVisible();
    
    const heroSubtext = page.getByText(/A dynamic dashboard for NASA DONKI data/i);
    await expect(heroSubtext).toBeVisible();
  });

  test('should have feature cards', async ({ page }) => {
    const features = [
      /Explore Space-Weather Events/i,
      /Instant, Automatic EDA/i,
      /Powered by Next\.js & TypeScript/i,
      /AI-Powered Summaries/i
    ];

    for (const feature of features) {
      await expect(page.getByText(feature).first()).toBeVisible();
    }
  });

  test('should show Tech Stack and NASA API Key cards', async ({ page }) => {
    await expect(page.getByText(/Tech Stack/i).first()).toBeVisible();
    await expect(page.getByText(/NASA API Key/i).first()).toBeVisible();
  });

  test('should have a link to the GitHub repository', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /View Repository/i });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com/);
  });

  test('should display Geomagnetic Storm Events section', async ({ page }) => {
    // This section is part of the Dashboard component
    await expect(page.getByRole('heading', { name: /Geomagnetic Storm Events/i })).toBeVisible();
  });
});
