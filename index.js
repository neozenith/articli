'use strict';

const fs = require('fs');
const path = require('path');
const program = require('commander');
const request = require('request');
const cheerio = require('cheerio');
const pkg = require('./package.json');

require('dotenv').config();

const outputPath = process.env.ARTICLI_DATA_CACHE || './data/';

program
	.version(pkg.version)
	.option('-u, --url <url>', 'Base URL to use for scraping articles')
	.option('-i, --id <n>', 'Single article id to process', singleId)
	.option('-r, --range <a>..<b>', 'range of article numbers to iterate through.', range)
	.option('-s, --random-samples <n>', 'Number of random samples to try and fetch')
	.option('--offline', 'Disable fetching online and operate only on article cache')
	.option('--scored <n>', 'Only display results with a score >= n');

program.parse(process.argv);

function listFiles(directory, extension) {
	const list = {};
	fs.readdirSync(directory).forEach(file => {
		if (path.extname(file) === extension) {
			const basename = path.basename(file, extension);
			list[basename] = file;
		}
	});
	return list;
}

function range(val) {
	const endpoints = val.split('..').map(Number);

	return endpoints;
}
function singleId(val) {
	return [val];
}

function scraper(articles, offline = false) {
	for (const article in articles) {
		scrape(`${program.url}\/${articles[article]}\/`, articles[article], offline);
	}
}

function scrape(url, id, offline = false) {
	const outputHTML = outputPath + id + '.html';
	const outputResponse = outputPath + id + '.json';

	if (fs.existsSync(outputHTML)) {
		// console.log('Load from FILE: ', id);
		fs.readFile(outputHTML, function(err, data) {
			if (err) {
				throw err;
			}
			testHTML(id, data.toString());
		});
	} else if (!offline) {
		// console.log('Load from WEB: ', id);

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
				if (response.statusCode === 200 || response.statusCode === 404) {
					fs.writeFile(outputResponse, JSON.stringify(response.toJSON()), err => {
						if (err) console.log(err);
					});

					fs.writeFile(outputHTML, html, err => {
						if (err) console.log(err);
					});

					testHTML(id, html);
				} else {
					console.log('RESPONSE: ' + response.statusCode);
					console.log(response.toJSON());
				}
			} else {
				console.log('ERROR');
				console.log(error);
			}
		});
	} else {
		console.log('OFFLINE: Article ID not found in cache:', id);
	}
}

function testHTML(id, htmlBody) {
	const tests = [
		'Bachelor of Computer Science',
		'Engineering',
		'Software\\s*Engineering',
		'Bachelor of Engineering in Software Engineering',
		'Faculty of Engineering and Built Environment',
		'Univertsity of Newcastle',
		'honours',
		'Graduation',
		'graduate'
	];
	let score = 0;
	// TODO: Parse datetime
	const $ = cheerio.load(htmlBody);
	const articleText = $('div.article__body').text();
	const headline = $('h1.name.headline').text();
	const articleDate = $('div.article__datetime').text();
	// const author = $('div.signature').text();
	const category = $('a.story-section__link').text();

	for (const t in tests) {
		const test = tests[t].toLowerCase();
		const re = new RegExp(test, 'g');
		const matches = articleText.toLowerCase().match(re);
		if (matches) {
			score += matches.length;
		}
	}

	const scoredFilter = program.scored && score >= parseInt(program.scored);
	const parsableArticle = !program.scored && (score > 0 || articleDate.length > 0);
	if (scoredFilter || parsableArticle) {
		console.log(
			`${id}\t| ${score}\t| ${category.toUpperCase()}\t| ${articleDate}\t| ${headline.trim()}`
		);
	}
}

function articlesToFetch(endpoints, randomSamples = 0, offline = false, offlineCache = {}) {
	const N = endpoints.length - 1;
	const start = parseInt(endpoints[0]);
	const length = parseInt(endpoints[N] - endpoints[0] + 1);
	const cacheSize = Object.keys(offlineCache).length;

	// Random samples are a subset of range N
	if (randomSamples > length) {
		console.log('Reducing samples request to the size of the range: ', length);
		randomSamples = length;
	}
	// Offline Random samples are a subset of offlineCache
	if (offline && randomSamples > cacheSize) {
		console.log('Reducing samples request to the size of the offline cache: ', cacheSize);
		randomSamples = cacheSize;
	}

	const articles = [];
	if (randomSamples > 0) {
		// Allow 10 attempts per number in entire range
		// to guess at populating the article list and
		// no more than that.
		// TODO: Change this for situation where randomSamples == cacheSize but
		// cacheSize includes a value outside the range
		let attempts = 10 * length;
		//Random Sampling is either ONLINE ONLY or OFFLINE ONLY
		while (attempts > 0 && randomSamples - articles.length > 0) {
			const id = Math.round(length * Math.random()) + start;
			if (offline) {
				if (offlineCache.hasOwnProperty(id) && articles.indexOf(id) < 0) {
					articles.push(id);
				}
			} else {
				if (!offlineCache.hasOwnProperty(id) && articles.indexOf(id) < 0) {
					articles.push(id);
				}
			}
			attempts--;
		}
	} else {
		// Just use every number in the range
		for (let i = start; i <= endpoints[N]; i++) {
			if (offline && offlineCache.hasOwnProperty(i)) {
				articles.push(i);
			} else if (!offline) {
				articles.push(i);
			}
		}
	}
	return articles;
}

const randomSamples = program.randomSamples || 0;
const offlineCache = listFiles('./data/', '.html');
const articleRange = program.range || program.id || [];
const articleIds = articlesToFetch(articleRange, randomSamples, program.offline, offlineCache);
scraper(articleIds, program.offline);
