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

test("a website request lands on the owner's call list as an emergency", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/settings");
  const formUrl = (await page.locator("code").textContent())!.trim();

  const customer = await (await browser.newContext()).newPage(); // signed out, like a real customer
  await customer.goto(formUrl);
  await customer.getByLabel("Your name").fill("E2E Customer");
  await customer.getByLabel("Business").fill("E2E Diner");
  await customer.getByLabel("Phone").fill(`(614) 555-${String(Date.now()).slice(-4)}`);
  await customer.getByLabel("What's wrong?").fill("Reach-in cooler stopped, food at risk");
  await customer.getByLabel(/Equipment is down/).check();
  await customer.getByRole("button", { name: "Send request" }).click();
  await expect(customer.getByText("Got it, thank you")).toBeVisible();

  await page.goto("/app");
  // The demo already has one emergency (Russo's) as "Call first", so the new one is next in the Emergencies group.
  await expect(page.locator("main")).toContainText(/Emergencies[\s\S]*E2E Diner/);
});
