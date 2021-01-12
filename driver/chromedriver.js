//http://127.0.0.1:9222/json/version
const puppeteerExtra = require('puppeteer-extra');
const redbubble = require('./redbubbleconfig.json');

var wsChromeEndpointurl = null; //config.wbDriverKey;

function setWSChrome(ws) {
	wsChromeEndpointurl = ws;
}
async function setBrowser() {
	browser = await puppeteerExtra.connect({
		browserWSEndpoint: wsChromeEndpointurl,
	});
}

var browser = null;
var page = null;


async function fillWith(title, tags, description, lang) {
	var fields = [redbubble.upload.title + lang, redbubble.upload.tags + lang, redbubble.upload.description + lang];
	var data = [title, tags, description];
	var i = 0;
	await fields.reduce(async (memo, element) => {
		await memo;
		await page.waitForSelector(element, {timeout: 1000})
		var input = await page.$(element);
		await input.click({
			clickCount: 3
		});
		await input.press('Backspace');
		await page.focus(element);
		await page.keyboard.type(data[i]);
		i++;
	}, undefined)
}
async function uploadPath(path) {
	await page.waitForSelector(redbubble.upload.uploadInput);
	const element = await page.$(redbubble.upload.uploadInput);
	await element.uploadFile(path);
}
function delay(time) {
	return new Promise(function(resolve) {
		setTimeout(resolve, time)
	});
}
async function upload(oeuvre, baseUrl) {
	page = await browser.newPage();
	page.on('dialog', async dialog => {
		await dialog.dismiss();
	});

	try{
		await page.goto(baseUrl);
	}catch{
		throw "L'url de base ne fonctionne pas. Configurez la dans l'onglet 'config'."
	}
	

	await uploadPath(oeuvre.path);

	await fillWith(oeuvre.title.FR, oeuvre.tags.FR, oeuvre.description.FR, "fr");

	try {
		await page.click(redbubble.upload.labels.enlabl);
		await fillWith(oeuvre.title.EN, oeuvre.tags.EN, oeuvre.description.EN, "en");
		await page.click(redbubble.upload.labels.delabel);
		await fillWith(oeuvre.title.DK,oeuvre.tags.DK,oeuvre.description.DK,"dk");
		await page.click(redbubble.upload.labels.eslabel);
		await fillWith(oeuvre.title.ES,oeuvre.tags.ES,oeuvre.description.ES,"es");
	} catch (error) {
		
	}

	await page.click(redbubble.upload.rights);
	await page.waitForSelector(redbubble.upload.imageTest, {
		timeout: 180000
	});
	await delay(1000)
	var oldUrl = page.url()
	await page.click(redbubble.upload.submmit);
	while (page.url() == oldUrl) {
		await delay(1000);
		try {
			await page.click(redbubble.upload.submmit);
		} catch (error) {
			
		}
	}
	await delay(1000);
	page.close()
}

module.exports = {upload, setWSChrome, setBrowser};