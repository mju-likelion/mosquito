import dotenv from "dotenv";
import { chromium } from "playwright";

dotenv.config();

const requiredEnvs = ["username", "password"];

function checkEnvs() {
  requiredEnvs.map(env => {
    if (!process.env[env]) {
      throw Error(`Required environment variable ${env} does not exist`);
    }
  });
}

async function login() {
  const browser = await chromium.launch({
    headless: process.env.BROWSER_HEADLESS ? process.env.BROWSER_HEADLESS === "true" : true,
  });

  const page = await browser.newPage();
  await page.goto("https://apply.likelion.org/accounts/login/?next=/apply/univ/17");

  await page.fill("#id_username", process.env.username!);
  await page.fill("#id_password", process.env.password!);
  await page.click("button[type='submit']");

  // await browser.close();
}

checkEnvs();
login();
