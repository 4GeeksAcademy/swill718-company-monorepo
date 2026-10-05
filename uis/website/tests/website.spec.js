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

async function fillLead(page, volume = '501-2000') {
  await page.locator('#companyName').fill('Northstar Goods');
  await page.locator('#contactPerson').fill('Alex Morgan');
  await page.locator('#corporateEmail').fill('alex@northstar.example');
  await page.locator('#phone').fill('+1 213 555 0147');
  await page.locator('#website').fill('https://northstar.example');
  await page.locator('#country').selectOption('US');
  await page.locator('#productType').selectOption('fashion');
  await page.locator('#monthlyVolume').selectOption(volume);
  await page.locator('#service-warehousing').check();
  await page.locator('[name="current3pl"][value="evaluating"]').check();
  await page.locator('#comments').fill('We are expanding our online operations.');
  await page.locator('#privacyPolicy').check();
}

test('mobile navigation opens with keyboard, follows links, and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('#menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(navigation).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await navigation.getByRole('link', { name: 'Contact' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#contact$/);
});

test('syllabus lead form shows exact errors, supports live correction, and resets', async ({ page }) => {
  await page.goto('/application.html');
  await page.getByRole('button', { name: 'Request information' }).click();
  await expect(page.locator('#error-summary')).toBeVisible();
  await expect(page.locator('#error-summary')).toBeFocused();
  await expect(page.locator('#error-list li')).toHaveCount(10);
  await expect(page.locator('#companyName-error')).toHaveText('Company name must have at least 2 characters');
  await expect(page.locator('#contactPerson-error')).toHaveText('Enter first and last name of contact');
  await expect(page.locator('#corporateEmail-error')).toHaveText('Enter a valid corporate email (example: <name@company.com>)');
  await expect(page.locator('#phone-error')).toHaveText('Phone must include country code (example: +1 213 555 0147)');
  await expect(page.locator('#country-error')).toHaveText('Select main operating country');
  await expect(page.locator('#productType-error')).toHaveText('Select the type of product you handle');
  await expect(page.locator('#monthlyVolume-error')).toHaveText('Select estimated monthly volume');
  await expect(page.locator('#services-error')).toHaveText('Select at least one service of interest');
  await expect(page.locator('#current3pl-error')).toHaveText('Indicate if you currently work with another logistics provider');
  await expect(page.locator('#privacyPolicy-error')).toHaveText('You must accept the privacy policy to continue');
  await expect(page.locator('#success-panel')).toBeHidden();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);

  await page.locator('#error-list a').filter({ hasText: 'Current 3PL' }).click();
  await expect(page.locator('[name="current3pl"]').first()).toBeFocused();
  await page.locator('#contactPerson').fill('Alex Morgan');
  await expect(page.locator('#contactPerson-error')).toBeHidden();
  await expect(page.locator('#error-list li')).toHaveCount(9);
  await page.locator('#comments').fill('Sample note');
  await expect(page.locator('#comments-count')).toHaveText('11');
  await page.locator('#comments').evaluate(control => {
    control.value = 'x'.repeat(501);
    control.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#comments-count')).toHaveText('501');
  await expect(page.locator('#comments-error')).toHaveText('Comments cannot exceed 500 characters (0 remaining)');

  await page.getByRole('button', { name: 'Clear form' }).click();
  await expect(page.locator('#error-summary')).toBeHidden();
  await expect(page.locator('#companyName')).toHaveValue('');
  await expect(page.locator('#comments-count')).toHaveText('0');
  expect(await page.locator('[aria-invalid="true"]').count()).toBe(0);
});

test('low-volume lead receives the syllabus warning and can confirm submission', async ({ page }) => {
  const transmissions = [];
  page.on('request', request => {
    if (request.method() !== 'GET') transmissions.push(request.url());
  });
  await page.goto('/application.html');
  await fillLead(page, '0-100');
  await expect(page.locator('#comments-count')).toHaveText('39');
  await page.getByRole('button', { name: 'Request information' }).click();
  await expect(page.locator('#low-volume-warning')).toBeVisible();
  await expect(page.locator('#success-panel')).toBeHidden();
  await expect(page.locator('#low-volume-warning')).toContainText('For volumes under 100 monthly shipments, our services might not be the most efficient solution. Are you sure you want to continue?');
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Yes, continue' }).click();
  await expect(page.locator('#success-heading')).toHaveText('Thank you for your interest in TrackFlow!');
  await expect(page.locator('#success-panel')).toContainText('We have received your request. Our commercial team will review your information and contact you within the next 24-48 hours to schedule a call and learn about your logistics needs in detail.');
  await expect(page.locator('#success-panel a')).toHaveAttribute('href', 'mailto:comercial@trackflow.com');
  expect(transmissions).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Start another request' }).click();
  await expect(page.locator('#companyName')).toBeFocused();
  await expect(page.locator('#companyName')).toHaveValue('');
});

test('medium-volume lead submits without the low-volume warning', async ({ page }) => {
  await page.goto('/application.html');
  await fillLead(page, '101-500');
  await page.getByRole('button', { name: 'Request information' }).click();
  await expect(page.locator('#low-volume-warning')).toBeHidden();
  await expect(page.locator('#success-panel')).toBeVisible();
});

test('landing page follows syllabus content and exact Organization schema', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Logistics that scales with your e-commerce');
  await expect(page.getByRole('heading', { name: 'Our services' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coverage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Why TrackFlow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contact TrackFlow' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'comercial@trackflow.com' })).toHaveAttribute('href', 'mailto:comercial@trackflow.com');

  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema).toEqual({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TrackFlow',
    description: 'Warehouse management and last-mile deliveries for e-commerce',
    url: 'https://trackflow.com',
    foundingDate: '2009',
    address: [
      { '@type': 'PostalAddress', addressCountry: 'US', addressLocality: 'Los Angeles', addressRegion: 'California' },
      { '@type': 'PostalAddress', addressCountry: 'ES', addressLocality: 'Zaragoza', addressRegion: 'Aragón' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-213-555-0147',
      contactType: 'sales',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: ['https://linkedin.com/company/trackflow'],
    areaServed: [
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Spain' },
    ],
  });

  const links = await page.locator('a').evaluateAll(elements => [...new Set(elements.map(element => element.getAttribute('href')))]);
  for (const link of links) {
    if (link.startsWith('#')) expect(await page.locator(link).count()).toBe(1);
    else if (link.startsWith('/')) expect((await request.get(link)).ok()).toBe(true);
  }
});
