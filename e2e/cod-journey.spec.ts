import { expect, test } from "@playwright/test";

test("browse, COD checkout, admin confirm, guest track", async ({ page, context }) => {
  test.setTimeout(180_000);

  await page.goto("/en");
  const accept = page.getByTestId("cookie-accept");
  if (await accept.isVisible().catch(() => false)) await accept.click();

  await page.goto("/en/product/pulse-runner-mint");
  await page.getByTestId("size-42").click();
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByText(/Added to bag|bag/i).first()).toBeVisible({ timeout: 20_000 });

  await page.goto("/en/checkout");
  await expect(page.getByTestId("checkout-form")).toBeVisible();
  await page.getByTestId("checkout-name").fill("E2E Shopper");
  await page.getByTestId("checkout-phone").fill("03019998877");
  await page.getByTestId("checkout-street").fill("12 Test Street");
  await page.getByTestId("checkout-terms").check();
  await page.getByTestId("checkout-send-otp").click();
  await expect(page.getByTestId("checkout-otp")).toHaveValue(/\d{6}/, { timeout: 20_000 });
  await page.getByTestId("checkout-place").click();
  await page.waitForURL(/number=AS-\d+/, { timeout: 40_000 });
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible({ timeout: 40_000 });
  const number = new URL(page.url()).searchParams.get("number");
  expect(number).toBeTruthy();

  const admin = await context.newPage();
  await admin.goto("/admin/login");
  await admin.getByTestId("admin-email").fill(process.env.SEED_ADMIN_EMAIL || "ivan.p@example.net");
  await admin.getByTestId("admin-password").fill(process.env.SEED_ADMIN_PASSWORD || "Admin123");
  await admin.getByTestId("admin-submit").click();
  await admin.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
  await admin.goto("/admin/orders");
  await admin.getByRole("link", { name: number! }).first().click();
  await admin.getByTestId("order-action-confirmed").click();
  await expect(admin.getByTestId("order-action-packed")).toBeVisible({ timeout: 20_000 });

  await page.goto("/en/track-order");
  await page.getByTestId("track-number").fill(number!);
  await page.getByTestId("track-phone").fill("03019998877");
  await page.getByTestId("track-submit").click();
  await expect(page.getByText(number!)).toBeVisible();
  await expect(page.getByText(/confirmed|تصدیق/i).first()).toBeVisible();
});
