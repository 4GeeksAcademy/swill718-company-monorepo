import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [375, 768, 1440]) {
  for (const path of ['/', '/application.html', '/privacy.html']) {
    test(`${path} is accessible and responsive at ${width}px`, async ({ page }, testInfo) => {
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('response', response => {
        if (response.status() >= 400) failures.push(`${response.status()}: ${response.url()}`);
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator('h1').count()).toBe(1);
      expect(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
      expect(failures).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`page-${width}.png`), fullPage: true });
    });
  }
}

test('mobile navigation opens with keyboard, follows links, and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('#menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Our services' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#services$/);
});

test('invalid inquiry exposes specific accessible errors, live correction, and reset', async ({ page }) => {
  await page.goto('/application.html');
  await page.getByRole('button', { name: 'Start the conversation' }).click();
  await expect(page.locator('#error-summary')).toBeVisible();
  await expect(page.locator('#error-summary')).toBeFocused();
  await expect(page.locator('#error-list li')).toHaveCount(7);
  await expect(page.locator('#success-panel')).toBeHidden();
  await expect(page.locator('#fullName')).toHaveAttribute('aria-invalid', 'true');
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.locator('#error-list a').first().click();
  await expect(page.locator('#fullName')).toBeFocused();
  await page.locator('#fullName').fill('Alex Morgan');
  await expect(page.locator('#fullName-error')).toBeHidden();
  await expect(page.locator('#error-list li')).toHaveCount(6);
  await page.locator('#email').fill('not-an-email');
  await page.locator('#phone').fill('123');
  await page.locator('#monthlyShipments').fill('1.5');
  await page.locator('#message').fill('Sample inquiry');
  await expect(page.locator('#message-count')).toHaveText('14');
  await page.getByRole('button', { name: 'Clear form' }).click();
  await expect(page.locator('#error-summary')).toBeHidden();
  await expect(page.locator('#fullName')).toHaveValue('');
  await expect(page.locator('#email')).toHaveValue('');
  await expect(page.locator('#message-count')).toHaveText('0');
  expect(await page.locator('[aria-invalid="true"]').count()).toBe(0);
});

test('service links preselect a choice and valid inquiry stays local', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const transmissions = [];
  page.on('request', request => {
    if (request.method() !== 'GET') transmissions.push(request.url());
  });
  await page.goto('/application.html?service=returns');
  await expect(page.locator('#service-returns')).toBeChecked();
  await page.locator('#fullName').fill('Alex Morgan');
  await page.locator('#email').fill('alex@example.com');
  await page.locator('#company').fill('Sample Brand');
  await page.locator('#country').selectOption('ES');
  await page.locator('#monthlyShipments').fill('1500');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: 'Start the conversation' }).click();
  await expect(page.locator('#success-panel')).toBeVisible();
  await expect(page.locator('#success-panel')).toBeFocused();
  await expect(page.locator('#application-form')).toBeHidden();
  expect(transmissions).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Start another inquiry' }).click();
  await expect(page.locator('#fullName')).toBeFocused();
  await expect(page.locator('#fullName')).toHaveValue('');
  await expect(page.locator('#service-returns')).not.toBeChecked();
  await expect(page.locator('#consent')).not.toBeChecked();
});

test('an empty date with native badInput blocks submission until corrected', async ({ page }) => {
  await page.goto('/application.html?service=returns');
  await page.locator('#fullName').fill('Alex Morgan');
  await page.locator('#email').fill('alex@example.com');
  await page.locator('#company').fill('Sample Brand');
  await page.locator('#country').selectOption('ES');
  await page.locator('#monthlyShipments').fill('1500');
  await page.locator('#consent').check();
  const date = page.locator('#startDate');
  await date.evaluate(control => {
    Object.defineProperty(control, 'validity', { configurable: true, value: { badInput: true } });
    control.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
  await expect(date).toHaveValue('');
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#startDate-error')).toContainText('Choose today or a future date');
  await page.getByRole('button', { name: 'Start the conversation' }).click();
  await expect(page.locator('#success-panel')).toBeHidden();
  await expect(page.locator('#error-list li')).toHaveCount(1);
  await date.evaluate(control => {
    delete control.validity;
    control.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#startDate-error')).toBeHidden();
  await expect(page.locator('#error-summary')).toBeHidden();
  await page.getByRole('button', { name: 'Start the conversation' }).click();
  await expect(page.locator('#success-panel')).toBeVisible();
});

test('landing page has accurate organization schema and working local links', async ({ page, request }) => {
  await page.goto('/');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema['@type']).toBe('Organization');
  expect(schema.name).toBe('TrackFlow');
  expect(schema.foundingDate).toBe('2009');
  expect(schema.location.map(location => location.address.addressLocality)).toEqual(['Los Angeles', 'Zaragoza']);
  const links = await page.locator('a').evaluateAll(elements => [...new Set(elements.map(element => element.getAttribute('href')))]);
  for (const link of links) {
    if (link.startsWith('#')) expect(await page.locator(link).count()).toBe(1);
    else expect((await request.get(link)).ok()).toBe(true);
  }
});