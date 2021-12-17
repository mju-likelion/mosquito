import dotenv from "dotenv";
import { chromium, Page } from "playwright";

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

  return await browser.newPage();
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

async function crawl() {
  checkEnvs();
  const page = await createPage();
  await login(page);
  const links = await getIndividualLink(page);
  console.log(links);
}

crawl();
