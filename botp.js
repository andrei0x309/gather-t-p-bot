import puppeteer from 'puppeteer-extra';
import os from 'os';
import prompt from 'prompt';
import SimpleNodeLogger from 'simple-node-logger';
import path from 'path';
import pluginStealth from 'puppeteer-extra-plugin-stealth';

puppeteer.use(pluginStealth());

const claimLinks = `
http://localhost:4002/code/57024
http://localhost:4002/code/82879
http://localhost:4002/code/34596
http://localhost:4002/code/97161
http://localhost:4002/code/50566
http://localhost:4002/code/60637
http://localhost:4002/code/32187
http://localhost:4002/code/67941
http://localhost:4002/code/94316
http://localhost:4002/code/59194
http://localhost:4002/code/21202
http://localhost:4002/code/76950
http://localhost:4002/code/82996
http://localhost:4002/code/58127
http://localhost:4002/code/71221
http://localhost:4002/code/30306
http://localhost:4002/code/41087
http://localhost:4002/code/76105
http://localhost:4002/code/30287
http://localhost:4002/code/51459
http://localhost:4002/code/21728
`;
const claimLinksArr = [...claimLinks.match(/https?:\/\/.*?( |\n)/g)].map((link) => link.slice(0, -1));

const gatherSpace = 'https://gather.town/app/kjTwR9YguIVWMylX/Yup';

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

const sendPoapMsgFn = async (page) => {
  const dropdown = await page.waitForSelector('.LeftBarChatInput-dropdown');
  await dropdown.click();
  await page.waitForTimeout(700);

  const buttons = await page.$$('.LeftBarChatRecipientModal-root > button');
  //console.log(buttons);
  let lenght = buttons.length;
  for (let i = 3; i < lenght + 1; i++) {
    const button = await page.$(`.LeftBarChatRecipientModal-root > button:nth-child(${i})`);
    await button.click();
    await page.waitForTimeout(200);
    const userEl = await button.$('div p');
    let user = await page.evaluate((el) => el.textContent, userEl);
    const link = claimLinksArr[i - 3];
    const code = link.substring(link.lastIndexOf('/') + 1);
    const msg = ` [ATTENTION: ${user} ] Unique POAP claim links is: [ ${link} ] Code [ ${code} ] is automatically used for claim. `;
    logger.info(msg);
    await typeInInputElement(page, 'input[placeholder="Message..."]', msg);
    const input = await page.waitForSelector('input[placeholder="Message..."]');
    await input.focus();
    await page.keyboard.press('Enter');
    const dropdown = await page.waitForSelector('.LeftBarChatInput-dropdown');
    await dropdown.click();
    await page.waitForTimeout(250);
    lenght = (await page.$$('.LeftBarChatRecipientModal-root > button')).length;
  }
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
    args: ['--no-sandbox'],
    userDataDir,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation', '--mute-audio'],
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
    }
  }
})();
