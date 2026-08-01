import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("operator traces adoption evidence and creates a held clinic receipt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /What is adopted/ }),
  ).toBeVisible();
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  await page.screenshot({
    path: "public/adoption-dashboard.png",
    fullPage: true,
  });
  const firstInspector = page.getByRole("button", { name: "Inspect" }).first();
  await firstInspector.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Why this state?" }),
  ).toBeVisible();
  await expect(
    page.getByText("Usage evidence exceeds the 14-day freshness limit"),
  ).toBeVisible();
  const dialog = page.getByRole("dialog");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(firstInspector).toBeFocused();

  for (const counter of [
    "Stale evidence",
    "Pending customer validation",
    "Verified adoption",
    "Proof eligible, held",
  ]) {
    const control = page.getByRole("button", {
      name: new RegExp(counter, "i"),
    });
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await control.click();
    await expect(page.locator("tbody tr")).toHaveCount(3);
  }

  const clinicsLink = page.getByRole("link", { name: "Clinics" });
  await clinicsLink.focus();
  await page.keyboard.press("Enter");
  const generateReceipt = page.getByRole("button", {
    name: "Generate follow-up receipt",
  });
  await generateReceipt.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("clinic-receipt")).toContainText(
    "Draft generated; no external send",
  );
  await expect(page.getByTestId("clinic-receipt")).toContainText(
    "Held: facilitator review and customer confirmation",
  );
  const violations = await new AxeBuilder({ page }).analyze();
  expect(
    violations.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "public/recruiter-console.png",
    fullPage: true,
  });
});

test("390px layout has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
});
