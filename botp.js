import puppeteer from 'puppeteer-extra';
import os from 'os';
import prompt from 'prompt';
import SimpleNodeLogger from 'simple-node-logger';
import path from 'path';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(pluginStealth());

const currentClaimLinks = fs.readFileSync('currentLINKS.db', 'utf8');
const usedClaimLinks = fs.readFileSync('usedLINKS.db', 'utf8');

const linkPattern = /https?:\/\/.*?( |\n)/gms;
const currentClaimLinksArr = currentClaimLinks.match(linkPattern)
  ? [...currentClaimLinks.match(linkPattern)].map((link) => link.slice(0, -1))
  : [];
let usedClaimLinksArr = usedClaimLinks.match(linkPattern)
  ? [...usedClaimLinks.match(linkPattern)].map((link) => link.slice(0, -1))
  : [];
let memClaimLinksArr = currentClaimLinksArr.filter((link) => !usedClaimLinksArr.includes(link));
let memUsedClaimLinksArr = [];

const gatherSpace = 'https://gather.town/app/kjTwR9YguIVWMylX/Yup';

const flushUsedClaimLinks = () => {
  memUsedClaimLinksArr = [...usedClaimLinksArr, ...memUsedClaimLinksArr];
  fs.writeFileSync('usedLINKS.db', memUsedClaimLinksArr.join('\n'), {
    encoding: 'utf8',
    flag: 'w+',
  });
  memUsedClaimLinksArr = [];
  const usedClaimLinks = fs.readFileSync('usedLINKS.db', 'utf8');
  usedClaimLinksArr = usedClaimLinks.match(linkPattern)
    ? [...usedClaimLinks.match(linkPattern)].map((link) => link.slice(0, -1))
    : [];
  memClaimLinksArr = currentClaimLinksArr.filter((link) => !usedClaimLinksArr.includes(link));
};

function createLogger(enableConsole, opts) {
  // opts is the normal opts you'd pass in like logFilePath or timestampFormat
  const manager = new SimpleNodeLogger(opts);
  if (enableConsole) {
    manager.createConsoleAppender(opts);
  }
  if (opts.logFilePath) {
    manager.createFileAppender(opts);
  }
  return manager.createLogger();
}

const fileName = new Date().toISOString().replace(/T/, ' ').replace(/:/g, '-').replace(/\..+/, '');

const logger = createLogger(false, {
  logFilePath: path.join(path.resolve(), `logs/${fileName}.log`),
  timestampFormat: 'YY-MM-DD HH:mm:ss.SSS',
});

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

const isUserListOpen = async (page) => {
  return (await page.$$('.LeftBarChatRecipientModal-root > button')).length !== 0;
};

const toogleUserList = async (page) => {
  const dropdown = await page.waitForSelector('.LeftBarChatInput-dropdown');
  await dropdown.click();
  await page.waitForTimeout(450);
};

const sendPoapMsgFn = async (page, skip = '') => {
  let skipArr = [];
  if (skip.length > 0) skipArr = skip.split(' ');
  if (!(await isUserListOpen(page))) await toogleUserList(page);
  const buttons = await page.$$('.LeftBarChatRecipientModal-root > button');
  let lenght = buttons.length;
  for (let i = 3; i < lenght + 1; i++) {
    if (i !== 3) await toogleUserList(page);
    const button = await page.$(`.LeftBarChatRecipientModal-root > button:nth-child(${i})`);
    const userEl = await button.$('div p');
    let user = await page.evaluate((el) => el.textContent, userEl);
    lenght = (await page.$$('.LeftBarChatRecipientModal-root > button')).length;
    if (skipArr.includes(user)) {
      logger.info(`Skipping user: ${user}`);
      await toogleUserList(page);
      continue;
    }
    await button.click();
    await page.waitForTimeout(200);
    const link = memClaimLinksArr[i - 3];
    memUsedClaimLinksArr.push(link);
    const code = link.substring(link.lastIndexOf('/') + 1);
    const msg = ` [ATTENTION: ${user} ] Unique POAP claim links is: [ ${link} ] Code [ ${code} ] is automatically used for claim. `;
    logger.info(msg);
    await typeInInputElement(page, 'input[placeholder="Message..."]', msg);
    const input = await page.waitForSelector('input[placeholder="Message..."]');
    await input.focus();
    await page.keyboard.press('Enter');
  }
  flushUsedClaimLinks();
};

const sendPoapToUserName = async (page, userName) => {
  if (!(await isUserListOpen(page))) await toogleUserList(page);
  const buttons = await page.$$('.LeftBarChatRecipientModal-root > button');
  let userButton = false;
  for (const button of buttons) {
    const userEl = await button.$('div p');
    let user = await page.evaluate((el) => el.textContent, userEl);
    if (user === userName) {
      userButton = button;
      break;
    }
  }
  if (userButton) {
    await userButton.click();
    await page.waitForTimeout(200);
    const link = memClaimLinksArr.shift();
    memUsedClaimLinksArr.push(link);
    const code = link.substring(link.lastIndexOf('/') + 1);
    const msg = ` [ATTENTION: ${userName} ] Unique POAP claim links is: [ ${link} ] Code [ ${code} ] is automatically used for claim. `;
    logger.info(msg);
    await typeInInputElement(page, 'input[placeholder="Message..."]', msg);
    const input = await page.waitForSelector('input[placeholder="Message..."]');
    await input.focus();
    await page.keyboard.press('Enter');
    flushUsedClaimLinks();
    console.log(`Sent poap to user ${userName}`);
  } else {
    logger.error(`User ${userName} not found`);
    console.log(`User ${userName}  not found`);
    const dropdown = await page.waitForSelector('.LeftBarChatInput-dropdown');
    await dropdown.click();
    await page.waitForTimeout(500);
  }
  await isUserListOpen(page);
};

const dance5Sec = async (page) => {
  if (await isUserListOpen(page)) await toogleUserList(page);
  await page.keyboard.down('z');
  await page.waitForTimeout(5000);
  await page.keyboard.up('z');
};

(async (_) => {
  const osType = os.type();
  let executablePath, userDataDir;
  if (osType === 'Windows_NT') {
    executablePath = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe`;
    userDataDir = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\User Data`;
  } else if (osType === 'Linux') {
    executablePath = '/usr/bin/microsoft-edge-dev';
    userDataDir = '~/.config/microsoft-edge-dev';
  }

  //  userDataDir: './tmp/chrome'
  const options = {
    executablePath,
    headless: false,
    args: ['--no-sandbox', '--mute-audio'],
    userDataDir,
    ignoreDefaultArgs: ['--enable-automation'],
  };
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  await page.goto(gatherSpace);

  const jonBtn = await page.waitForSelector('button[kind="primary"]');
  await jonBtn.click();
  await page.waitForNavigation();

  const commentsBtn = await page.waitForSelector('svg[data-icon="comments"]');
  await commentsBtn.click();
  await page.waitForTimeout(700);

  prompt.start();

  for (;;) {
    const { command } = await prompt.get(['command']);

    switch (command) {
      case 'exit':
        await browser.close();
        process.exit();
      case 'send-poap':
        await sendPoapMsgFn(page);
        break;
      case 'send-poap-to':
        const { user } = await prompt.get(['user']);
        await sendPoapToUserName(page, user);
        break;
      case 'send-poap-skip':
        const { users } = await prompt.get(['users']);
        await sendPoapMsgFn(page, users);
        break;
      case 'dance':
        await dance5Sec(page);
        break;
    }
  }
})();
