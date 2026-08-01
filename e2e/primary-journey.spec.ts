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
  await page.getByRole("button", { name: "Inspect" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Why this state?" }),
  ).toBeVisible();
  await expect(
    page.getByText("Usage evidence exceeds the 14-day freshness limit"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Clinics" }).click();
  await page
    .getByRole("button", { name: "Generate follow-up receipt" })
    .click();
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
