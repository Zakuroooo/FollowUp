import { expect, test } from "@playwright/test";

// The reviewer's path: landing → one-click demo → call list → work a job → see it in history.
test("guest demo: call list, move a job forward, no answer, history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/calls? to make today/);
  await expect(page.getByLabel("Next call")).toContainText("Russo's Pizzeria"); // the emergency is first

  // Move the emergency forward from its job page.
  await page.getByLabel("Next call").getByRole("link", { name: "Open job" }).click();
  await page.getByRole("button", { name: "Yes, they need a quote" }).click();
  await expect(page.getByText("Moved from New to Quote")).toBeVisible();

  // "No answer" takes a job off today's list and into Coming up.
  await page.goto("/app");
  const row = page.locator("li", { hasText: "Northside Cold Storage" });
  await row.getByRole("button", { name: "No answer" }).click();
  await expect(page.getByRole("region", { name: "Coming up" })).toContainText("Northside Cold Storage");
});

test("all jobs are separated by stage and export to CSV", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/jobs");
  for (const stage of ["New", "Waiting on quote", "Waiting on their yes", "Scheduled"]) {
    await expect(page.getByRole("heading", { level: 2, name: stage })).toBeVisible();
  }
  const csv = await page.request.get("/app/export");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Russo's Pizzeria");
});

test("signed-out visitors cannot see the app", async ({ page }) => {
  await page.goto("/app/jobs");
  await expect(page).toHaveURL(/\/login\?next=/);
});
