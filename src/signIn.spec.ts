import {
  test,
  expect,
  chromium,
  Page,
  BrowserContext,
  Browser,
} from "@playwright/test";
import { log } from "console";

const userEmail = "ilantest133@gmail.com";
const password = "Il01adas$";
const accountsUrl = "https://accounts.google.com";
const gmailUrl = "https://mail.google.com";
const signoutUrl = "https://accounts.google.com/Logout";

test.describe("SignIn test suite", () => {
  let page: Page;
  let context: BrowserContext;
  let browser: Browser;

  test.beforeEach('Setup', async () => {
    log('launching browser in incognito mode with new context')

    browser = await chromium.launch({
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(gmailUrl);
  });

  test.afterEach('Tear down', async () => {
    log('cleanup browser & context')
    await context.close();
    await browser.close();
  });

  test("SignIn UI", async () => {
    expect(page.url()).toContain(accountsUrl);
    expect(page.getByText("Sign in", { exact: true })).toBeVisible();
    expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    expect(page.getByRole("button", { name: "Forgot email?" })).toBeVisible();
    expect(
      page.getByRole("link", { name: "Learn more about using Guest" })
    ).toBeVisible();
    expect(page.getByRole("link", { name: "Help" })).toBeVisible();
    expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
    expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  });

  test("SignIn - Happy flow", async () => {
    await signIn(page, userEmail, password);
  });

  test("SignIn - sign out", async () => {
    await signIn(page, userEmail, password);

    await signOut(page);
    expect(page.url()).toContain(signoutUrl);
  });

  test("SignIn when SignedIn", async ({ }) => {
    await signIn(page, userEmail, password);

    // Signin again
    const page2 = await context.newPage();
    await page.goto(gmailUrl);
    await signIn(page, userEmail, password);
  });

  test("SignIn - can sign up", async ({ }) => {
    expect(page.url()).toContain(accountsUrl);

    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByText("For my personal use").click();
    await expect(
      page.getByText("Create a Google Account", { exact: true })
    ).toBeVisible();
  });

  test("SignIn - can show password", async ({ }) => {
    const signInIcon = page.getByLabel("Google Account: ilan test (");

    if (await signInIcon.isVisible()) await signOut(page);

    await page.getByLabel("Email or phone").fill(userEmail);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Enter your password").fill(password);
    await page.getByText("Show password").click();
    expect(
      await page
        .locator('input[name="Passwd"]')
        .getAttribute("data-initial-value")
    ).toMatch(password);
  });

  test("SignIn - Multiple accounts", async ({   }) => {

  // Setup
  await signIn(page, userEmail, password)
  await signOut(page)

  // verify accont selection link
  const accountLink = page.getByRole('link', { name: 'ilan test ilantest133@gmail.' })
  await expect(accountLink).toBeVisible()

  // signin
  await accountLink.click();
  await page.locator('input[name="Passwd"]').fill(password);
  await page.getByRole("button", { name: "הבא" }).click();
  await expect(page.getByLabel("Google Account: ilan test (")).toBeVisible({ timeout: 10000 });
});

  test("SignIn - not found username", async ({ }) => {
    const signInIcon = page.getByLabel("Google Account: ilan test (");
    if (await signInIcon.isVisible()) await signOut(page);

    expect(page.url()).toContain(accountsUrl);

    await page.getByLabel("Email or phone").fill("blabla");
    await page.getByRole("button", { name: "Next" }).click();

    const notFoundlLocator = page.locator("div", {
      hasText: "Couldn’t find your Google",
    });
    expect(notFoundlLocator).toBeDefined();
  });

  test("SignIn - not valid username", async ({ }) => {
    const signInIcon = page.getByLabel("Google Account: ilan test (");
    if (await signInIcon.isVisible()) await signOut(page);

    expect(page.url()).toContain(accountsUrl);

    await page.getByLabel("Email or phone").fill("!@#$%^&*()");
    await page.getByLabel("Email or phone").press("Enter");

    const notValidlLocator = page.locator("div", {
      hasText: "Enter a valid email or phone number",
    });
    expect(notValidlLocator).toBeDefined();
  });

  test("SignIn - wrong password", async ({ }) => {
    const signInIcon = page.getByLabel("Google Account: ilan test (");
    if (await signInIcon.isVisible()) await signOut(page);

    expect(page.url()).toContain(accountsUrl);

    await page.getByLabel("Email or phone").fill(userEmail);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Enter your password").fill("wrongPassword");
    await page.getByRole("button", { name: "Next" }).click();

    const wrongPasswordlLocator = page.locator("span", {
      hasText:
        "Wrong password. Try again or click Forgot password to reset it.",
    });
    expect(wrongPasswordlLocator).toBeDefined();
  });
});


const signIn = async (
  page: Page,
  userEmail: string,
  password: string
): Promise<void> => {
  const signInIcon = page.getByLabel("Google Account: ilan test (");

  if (await signInIcon.isVisible()) return;

  expect(page.url()).toContain(accountsUrl);

  await page.getByLabel("Email or phone").fill(userEmail);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Enter your password").fill(password);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(signInIcon).toBeVisible({ timeout: 10000 });
};

const signOut = async (page: Page): Promise<void> => {
  await page.getByLabel("Google Account: ilan test (").click();
  await page
    .locator('iframe[name="account"]')
    .contentFrame()
    .getByRole("link", { name: "Sign out" })
    .click();
};

const checkIfSignInAndSignOut = async (page: Page) : Promise<void> => {
  const signInIcon = page.getByLabel("Google Account: ilan test (");

  if (await signInIcon.isVisible()) 
    signOut(page);
}
