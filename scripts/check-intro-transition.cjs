const { chromium, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || 'playwright/test');
const fs = require('fs/promises'), path = require('path');
const output = path.resolve(process.env.QA_OUTPUT || 'work/qa-intro-transition');
const appUrl = (view = 'quiz') => process.env.QA_HTML
  ? require('node:url').pathToFileURL(path.resolve(process.env.QA_HTML)).href + '#/' + view
  : 'http://127.0.0.1:57421' + (view === 'quiz' ? '/' : '/' + view + '.html');
async function navigate(page, view = 'quiz') {
  await page.goto(appUrl(view));
  if (process.env.QA_HTML) await expect(page.locator('html')).toHaveAttribute('data-html-ready', view);
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.QA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [], errors = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      await navigate(page);
      const modal = page.locator('.product-intro');
      await expect(modal).toBeVisible();
      // Pause the real entrance animation so its actual rendered frames can be inspected.
      const entrance = await modal.evaluate(el => {
        const animation = el.getAnimations().find(a => a.animationName === 'product-intro-fade-in');
        if (!animation) return null;
        animation.pause(); animation.currentTime = 0;
        const start = Number(getComputedStyle(el).opacity);
        animation.currentTime = animation.effect.getTiming().duration / 2;
        const middle = Number(getComputedStyle(el).opacity);
        return { start, middle, duration: animation.effect.getTiming().duration };
      });
      expect(entrance, 'A real fade-in animation must run when the introduction opens').not.toBeNull();
      expect(entrance.start).toBe(0); expect(entrance.middle).toBeGreaterThan(0); expect(entrance.middle).toBeLessThan(1);
      await page.screenshot({ path: path.join(output, `fade-mid-${viewport.width}.png`), animations: 'allow' });
      await modal.evaluate(el => el.getAnimations().forEach(a => a.finish()));
      await expect(modal).toHaveCSS('opacity', '1');
      await page.screenshot({ path: path.join(output, `intro-${viewport.width}.png`) });
      for (let i = 0; i < 3; i++) {
        await expect(page.locator('.quiz-tour-layer')).toHaveCount(0);
        await modal.locator('[data-action=next]').click();
      }
      await expect(modal.locator('[data-action=next]')).toHaveText('画面の操作ガイドを始める →');
      await modal.locator('[data-action=next]').click();
      await expect(modal).toHaveCount(0);
      const tour = page.locator('.quiz-tour-layer');
      await expect(tour).toHaveCount(1);
      await expect(tour.locator('.quiz-tour-title')).toHaveText('科目を選びます');
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
      await expect(tour.locator('.quiz-tour-next')).toBeFocused();
      for (let i = 0; i < 9; i++) {
        await expect(tour.locator('.quiz-tour-step-number')).toHaveText(String(i + 1));
        await page.waitForTimeout(120);
        if (i === 8) {
          const target = page.locator('#quizGuideButton');
          await expect(target).toBeInViewport();
          const actual = await target.boundingBox();
          const toolbar = await page.locator('.topbar .toolbar').boundingBox();
          expect(actual.x).toBeGreaterThanOrEqual(toolbar.x);
          expect(actual.x + actual.width).toBeLessThanOrEqual(toolbar.x + toolbar.width + 1);
          await expect.poll(async () => {
            const spotlight = await page.locator('.quiz-tour-spotlight').boundingBox();
            // The spotlight keeps an 8px viewport inset when its target touches an edge.
            return spotlight.x <= Math.max(8, actual.x) && spotlight.x + spotlight.width >= Math.min(viewport.width - 8, actual.x + actual.width);
          }).toBe(true);
        }
        const rect = await tour.locator('.quiz-tour-card').boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width); expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
        await expect(tour.locator('.quiz-tour-next')).toBeInViewport();
        await page.screenshot({ path: path.join(output, `guide-${viewport.width}-step${i + 1}.png`) });
        await tour.locator('.quiz-tour-next').click();
      }
      await expect(tour).toHaveCount(0);
      await page.locator('#quizGuideButton').click();
      await expect(modal).toBeVisible(); await modal.locator('[data-action=close]').click();
      await page.reload(); await page.waitForTimeout(900);
      await expect(modal).toBeVisible(); await modal.locator('#productIntroDoNotShow').check(); await modal.locator('[data-action=close]').click();
      await expect(tour).toHaveCount(0);
      for (const method of ['close', 'escape']) {
        await page.evaluate(() => window.quizZenIntro.open());
        if (method === 'close') await modal.locator('[data-action=close]').click();
        else await page.keyboard.press('Escape');
        await expect(modal).toHaveCount(0); await expect(tour).toHaveCount(0);
      }
      // A completed walkthrough can still be opened again through the complete presentation.
      await page.evaluate(() => window.quizZenIntro.open());
      await modal.locator('[data-step="2"]').click(); await modal.locator('[data-action=next]').click();
      await expect(tour.locator('.quiz-tour-step-number')).toHaveText('1');
      await tour.locator('.quiz-tour-skip').click();
      results.push({ viewport, entrance, passed: true, checks: ['fade actual opacity frames', 'complete introduction starts exactly one guide', 'all nine guide steps displayed and operable', 'completion persists', 'close and Escape do not start guide', 'guide can be repeated'] });
      console.log('PASS', JSON.stringify(viewport));
      await context.close();
    }
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage(); await navigate(page);
    const modal = page.locator('.product-intro'); await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('animation-name', 'none'); await expect(modal).toHaveCSS('opacity', '1');
    await modal.locator('[data-step="2"]').click(); await modal.locator('[data-action=next]').click();
    await expect(page.locator('.quiz-tour-layer')).toBeVisible();
    results.push({ reducedMotion: true, passed: true }); await context.close();
    expect(errors).toEqual([]);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
