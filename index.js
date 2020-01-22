const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('./config');

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://mls2.gsmls.com/member/');

  await page.click('#usernametxt');
  await page.keyboard.type(config.user);

  await page.click('#passwordtxt');
  await page.keyboard.type(config.pass);

  var navPromise = page.waitForNavigation();
  await page.click('#login-btn');
  await navPromise;

  await page.click('#navigation-container > div.inner > nav > label');
  
  var linkHandlers = await page.$x("//a[contains(text(), 'HOTSHEETS')]");

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }

  linkHandlers = await page.$x("//a[contains(text(), 'My Standard')]");

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }

  navPromise = page.waitForNavigation();
  await navPromise;

  linkHandlers = await page.$x("//a[contains(text(), 'Current')]");

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }

  navPromise = page.waitForNavigation();
  await navPromise;

  await page.screenshot({ path: 'screenshots/hotsheet.png', fullPage: true });
  
  await page.evaluate("logout('')");
  navPromise = page.waitForNavigation();
  await navPromise;
  browser.close();

  var mailer = nodemailer.createTransport(smtpTransport({
    host: config.ses_host,
    secureConnection: true,
    port: 465,
    auth: {
      user: config.ses_user,
      pass: config.ses_pass
    }
  }));

  var mailOptions = {
    from: config.from,
    to: config.to,
    subject: 'GSMLS Hotsheet',
    text: 'Your Standard GSMLS Hotsheet',
    attachments: [{ path: './screenshots/hotsheet.png' }]
  };

  mailer.sendMail(mailOptions, function(err, res) {
    if(err) {
      console.log(err);
    }
    mailer.close();
  });
}

run();
