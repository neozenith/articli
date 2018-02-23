'use strict';

const fs = require('fs');
const program = require('commander');
const request = require('request');
const cheerio = require('cheerio');
const pkg = require('./package.json');

program
	.version(pkg.version)
	.option('-u, --url <url>', 'Base URL to use for scraping articles')
	.option('-i, --id <n>', 'Single article id to process', singleId)
	.option('-r, --range <a>..<b>', 'range of article numbers to iterate through.', range);

program.parse(process.argv);

function range(val) {
	const endpoints = val.split('..').map(Number);
	const start = endpoints[0];
	const length = endpoints[1] - endpoints[0];

	const range = [];
	for (let i = start; i <= start + length; i++) {
		range.push(i);
	}

	return range;
}
function singleId(val) {
	return [val];
}

function scraper(articles) {
	for (const article in articles) {
		console.log(`${article} ${articles[article]} ${program.url}\/${articles[article]}\/`);
		scrape(`${program.url}\/${articles[article]}\/`, articles[article]);
	}
}

function scrape(url, id) {
	const outputPath = './data/';
	const ua =
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';

	const customRequest = request.defaults({
		headers: { 'User-Agent': ua }
	});
	console.log(url);
	// TODO: look for locally cached file

	customRequest(url, function(error, response, html) {
		// First we'll check to make sure no errors occurred when making the request

		if (!error) {
			if (response.statusCode === 200) {
				console.log('Saving full response: ' + outputPath + id + '.json');
				fs.writeFile(outputPath + id + '.json', JSON.stringify(response.toJSON()), err => {
					if (err) console.log(err);
				});

				console.log('Saving: ' + outputPath + id + '.html');
				fs.writeFile(outputPath + id + '.html', html, err => {
					if (err) console.log(err);
				});
			} else {
				console.log('RESPONSE: ' + response.statusCode);
				console.log(response.toJSON());
			}

			const $ = cheerio.load(html);

			// Finally, we'll define the variables we're going to capture

			let title, release, rating;
			const json = { title: '', release: '', rating: '' };
		} else {
			console.log('ERROR');
			console.log(error);
		}
	});
}

if (program.range !== undefined && program.range.length > 0) {
	scraper(program.range);
} else {
	scraper(program.id);
}
