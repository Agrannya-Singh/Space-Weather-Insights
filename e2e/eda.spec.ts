import { test, expect } from '@playwright/test';

test.describe('EDA Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/eda');
  });

  test('should load with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Exploratory Data Analysis/i })).toBeVisible();
  });

  test('should have Load Data card with format selector', async ({ page }) => {
    await expect(page.getByText(/Load Data/i).first()).toBeVisible();
    
    // The select might be within the card
    const formatSelect = page.locator('select');
    await expect(formatSelect).toBeVisible();
    await expect(formatSelect).toHaveValue('json');
    
    await formatSelect.selectOption('csv');
    await expect(formatSelect).toHaveValue('csv');
  });

  test('should have a file input and textarea', async ({ page }) => {
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should analyze valid JSON data', async ({ page }) => {
    const validJson = JSON.stringify([
      { id: 1, name: 'Event 1', value: 10, date: '2023-01-01' },
      { id: 2, name: 'Event 2', value: 20, date: '2023-01-02' }
    ]);

    await page.locator('textarea').fill(validJson);
    await page.getByRole('button', { name: /Analyze/i }).click();

    // Check if tabs appear
    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Numeric/i })).toBeVisible();
    
    // Check summary card
    await expect(page.getByText(/Rows/i)).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // Two rows
    await expect(page.getByText(/Fields/i)).toBeVisible();
    await expect(page.getByText('4')).toBeVisible(); // id, name, value, date
  });

  test('should analyze valid CSV data', async ({ page }) => {
    await page.locator('select').selectOption('csv');
    
    const validCsv = 'id,name,value\n1,Event A,100\n2,Event B,200';
    await page.locator('textarea').fill(validCsv);
    await page.getByRole('button', { name: /Analyze/i }).click();

    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // Two rows
    await expect(page.getByText('3')).toBeVisible(); // id, name, value
  });
});
