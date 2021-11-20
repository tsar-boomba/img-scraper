import playwright from 'playwright';
import fs from 'fs';
import Path from 'path';
import axios from 'axios';

const fileExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif'];

const getFileExtension = (url: string) => {
	let ext = '';
	fileExtensions.forEach((extension) => {
		if (url.toLowerCase().includes(extension)) {
			ext = extension;
		}
	});
	return ext;
};

const getImages = async (url: string) => {
	const browser = await playwright.chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url);
	const images = await page.$$eval('img', (selected) => {
		return selected.map((img) => ({ src: img.src, alt: img.alt }));
	});
	fs.mkdir(`${__dirname}/output`, () => {
		images.forEach(async (img, index) => {
			const path = Path.resolve(
				__dirname,
				'output',
				`${img.alt || `img${index}`}.${getFileExtension(img.src)}`
			);
			const writer = fs.createWriteStream(path);
			const res = await axios.get(img.src, { responseType: 'stream' });
			res.data.pipe(writer);
		});
	});
	await browser.close();
};

getImages('You url here'); // change the argument to the url you wnat to use
