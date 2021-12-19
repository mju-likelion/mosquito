import dotenv from "dotenv";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { unparse } from "papaparse";
import { Browser, BrowserContext, chromium, Page } from "playwright";

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
  const context = await browser.newContext();
  const page = await context.newPage();

  return { browser, context, page };
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

async function parsePage(context: BrowserContext, link: string) {
  const page = await context.newPage();
  await page.goto(link);

  const userInfo: {
    name?: string;
    sid?: string;
    major?: string;
    phone?: string;
    email?: string;
    motive?: string;
    wannaMake?: string;
    projectExperience?: string;
    overcomeExperience?: string;
    goals?: string;
  } = {};

  userInfo.name = await page.locator("#likelion_num h3").innerText();
  userInfo.sid = await page.locator(".user_information p >> nth=0").innerText();
  userInfo.major = await page.locator(".user_information p >> nth=2").innerText();
  userInfo.phone = await page.locator(".user_information p >> nth=3").innerText();
  userInfo.email = await page.locator(".user_information p >> nth=5").innerText();

  userInfo.motive = await page.locator(".m_mt >> nth=0 ").innerText();
  userInfo.wannaMake = await page.locator(".m_mt >> nth=1").innerText();
  userInfo.projectExperience = await page.locator(".m_mt >> nth=2").innerText();
  userInfo.overcomeExperience = await page.locator(".m_mt >> nth=3").innerText();
  userInfo.goals = await page.locator(".m_mt >> nth=4").innerText();

  console.log(userInfo.name);

  await page.close();

  return userInfo;
}

async function writeCsv(data: string) {
  const directory = process.cwd() + "/data";

  if (!existsSync(directory)) {
    await mkdir(directory);
  }

  const result = await writeFile(directory + "/crawl.csv", data);

  console.log(result);
}

async function closeBrowser(browser: Browser) {
  await browser.close();
}

async function crawl() {
  checkEnvs();
  const { browser, context, page } = await createPage();
  await login(page);
  const links = await getIndividualLink(page);
  const data = await Promise.all(links.map(link => parsePage(context, link)));
  const csvData = unparse(data, {
    newline: "\n",
  });
  await writeCsv(csvData);
  await closeBrowser(browser);
}

crawl();
