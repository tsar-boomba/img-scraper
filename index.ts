const playwright = require('playwright');
const Fs = require('fs');
const Path = require('path');
const isValidFilename = require('./filename-validation');
import Axios from 'axios';

/* URL AND NAME OF OUTPUT DIRECTORY HERE */
const targetUrl = 'https://www.twitch.tv/';
const outDir = 'output';
/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

const fileExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'];
const getFileExtension = (url: string) => {
	for (const extension of fileExtensions) {
		if (url.toLowerCase().includes(extension)) {
			return extension;
		}
	}
};

const downloadImage = async (url: string, name: string) => {
	const imagePath = Path.resolve(__dirname, outDir, `${name}.${getFileExtension(url)}`);
	const writer = Fs.createWriteStream(imagePath);
	console.log(getFileExtension(url), ' : ', url);
	const res = await Axios.get(url, { method: 'GET', responseType: 'stream' });

	res.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
};

const getImages = async (url: string) => {
	const browser = await playwright.chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url);
	await page.waitForLoadState('domcontentloaded');
	await page.evaluate(() =>
		window.scrollBy({ behavior: 'smooth', top: document.body.scrollHeight })
	);
	await page.waitForLoadState('networkidle');
	const images = await page.$$eval('img', (selected) => {
		return selected.map((img) => ({ src: img.src, alt: img.alt }));
	});
	Fs.mkdir(`${__dirname}/${outDir}`, () => {
		images.forEach(async (img, index) => {
			try {
				await downloadImage(img.src, isValidFilename(img.alt) ? img.alt : `img${index}`);
			} catch (err) {}
		});
	});
	await browser.close();
};

getImages(targetUrl);
