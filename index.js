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
	.option('-r, --range <a>..<b>', 'range of article numbers to iterate through.', range)
	.option('-s, --random-samples <n>', 'Number of random samples to try and fetch')
	.option('--offline', 'Disable fetching online and operate only on article cache');

//TODO: online random sample, give 10 samples and target range. If file exists try getting another.

//TODO: offline random sample, give 10 samples and target range. Only choose from cached files.

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
	const outputHTML = outputPath + id + '.html';
	const outputResponse = outputPath + id + '.json';

	console.log(url);
	// TODO: look for locally cached file

	if (fs.existsSync(outputHTML)) {
		console.log('Load from FILE');
		fs.readFile(outputHTML, function(err, data) {
			if (err) {
				throw err;
			}
			console.log('Loaded from file: ' + outputHTML);
			testHTML(data.toString());
		});
	} else {
		console.log('Load from WEB');

		// By Default user agent isn't sent so we need to shim this into the headers
		// to make content providers think we are legit.
		const ua =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';
		const customRequest = request.defaults({
			headers: { 'User-Agent': ua }
		});
		customRequest(url, function(error, response, html) {
			// First we'll check to make sure no errors occurred when making the request

			if (!error) {
				if (response.statusCode === 200) {
					console.log('Saving full response: ' + outputResponse);
					fs.writeFile(outputPath + id + '.json', JSON.stringify(response.toJSON()), err => {
						if (err) console.log(err);
					});

					console.log('Saving HTML Body: ' + outputHTML);
					fs.writeFile(outputPath + id + '.html', html, err => {
						if (err) console.log(err);
					});

					testHTML(html);
				} else {
					console.log('RESPONSE: ' + response.statusCode);
					console.log(response.toJSON());
				}
			} else {
				console.log('ERROR');
				console.log(error);
			}
		});
	}
}

function testHTML(htmlBody) {
	// TODO: test for key words
	// TODO: Parse datetime
	const $ = cheerio.load(htmlBody);
	console.log($('div.article__datetime').text());
	// Finally, we'll define the variables we're going to capture
	//
	// let title, release, rating;
	// const json = { title: '', release: '', rating: '' };
}

const articleIds = program.range || program.id || [];
scraper(articleIds);
