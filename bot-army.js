import puppeteer from 'puppeteer-extra';
import os from 'os';

import pluginStealth from 'puppeteer-extra-plugin-stealth';

puppeteer.use(pluginStealth());

const gatherSpace = 'https://gather.town/app/kjTwR9YguIVWMylX/Yup';

const botArmySize = 40;
const botBaseName = 'BOT';
const BotPages = [];

async function typeInInputElement(page, inputSelector, text) {
  await page.evaluate(
    (inputSelector, text) => {
      const inputElement = document.querySelector(inputSelector);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(inputElement, text);

      const ev2 = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(ev2);
    },
    inputSelector,
    text,
  );
}

async function joinGather(page) {
  await page.goto(gatherSpace);
  const nextSetpBtn = await page.waitForSelector('button[kind="primary"]');
  await nextSetpBtn.click();
  //const nameInput = await page.waitForSelector('input');
  const randNum = ~~((Math.random() + 10000) * 99999);
  const name = `${botBaseName}-${randNum}`;
  typeInInputElement(page, 'input', name);
  await page.waitForTimeout(300);
  for (let index = 0; index < 2; index++) {
    const joinBtn = await page.waitForSelector('button[kind="primary"]');
    await joinBtn.click();
  }
  const skipTutorial = await page.waitForSelector('button');
  await skipTutorial.click();
  await page.waitForNavigation();
}

(async (_) => {
  for (let index = 0; index < botArmySize; index++) {
    const osType = os.type();
    let executablePath, userDataDir;
    if (osType === 'Windows_NT') {
      executablePath = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe`;
      userDataDir = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\User Data\\${botBaseName}-${index}`;
    } else if (osType === 'Linux') {
      executablePath = '/usr/bin/microsoft-edge-dev';
      userDataDir = '~/.config/microsoft-edge-dev/';
    }
    const options = {
      executablePath,
      headless: true,
      args: ['--no-sandbox'],
      userDataDir,
      ignoreDefaultArgs: ['--disable-extensions', '--enable-automation', '--mute-audio'],
    };

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    page.setDefaultTimeout(0);
    BotPages.push(page);
  }

  for (const botPage of BotPages) {
    joinGather(botPage);
  }
})();
