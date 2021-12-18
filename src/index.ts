import dotenv from "dotenv";
import { Browser, chromium, Page } from "playwright";

dotenv.config();

const requiredEnvs = ["username", "password"];

function checkEnvs() {
  requiredEnvs.map(env => {
    if (!process.env[env]) {
      throw Error(`Required environment variable ${env} does not exist`);
    }
  });
}

async function createPage() {
  const browser = await chromium.launch({
    headless: process.env.BROWSER_HEADLESS ? process.env.BROWSER_HEADLESS === "true" : true,
  });

  return { browser, page: await browser.newPage() };
}

async function login(page: Page) {
  await page.goto("https://apply.likelion.org/accounts/login/?next=/apply/univ/17");

  await page.fill("#id_username", process.env.username!);
  await page.fill("#id_password", process.env.password!);
  page.click("button[type='submit']");
  await page.waitForNavigation();
}

async function getIndividualLink(page: Page) {
  return await page.evaluate(() => {
    const links = [];
    const aTags = document.querySelectorAll(".applicant_page > a");
    console.log(aTags);
    for (const aTag of aTags) {
      // @ts-ignore
      links.push(aTag.href);
    }
    return links;
  });
}

async function printApplicant(page: Page, link: string) {
  await page.goto(link);

  const name = await page.locator("#likelion_num h3").innerText();
  const sid = await page.locator(".user_information p >> nth=0").innerText();
  const major = await page.locator(".user_information p >> nth=2").innerText();
  const phone = await page.locator(".user_information p >> nth=3").innerText();
  const email = await page.locator(".user_information p >> nth=5").innerText();
  console.log(name, sid, major, phone, email);

  const motive = await page.locator(".m_mt >> nth=0 ").innerText();
  const wannaMake = await page.locator(".m_mt >> nth=1").innerText();
  const projectExperience = await page.locator(".m_mt >> nth=2").innerText();
  const overcomeExperience = await page.locator(".m_mt >> nth=3").innerText();
  const goals = await page.locator(".m_mt >> nth=4").innerText();
  console.log(motive, wannaMake, projectExperience, overcomeExperience, goals);
}

async function closeBrowser(browser: Browser) {
  await browser.close();
}

async function crawl() {
  checkEnvs();
  const { browser, page } = await createPage();
  await login(page);
  const links = await getIndividualLink(page);
  for (const link of links) {
    await printApplicant(page, link);
  }
  await closeBrowser(browser);
}

crawl();
