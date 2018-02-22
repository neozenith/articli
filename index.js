'use strict';

const program = require('commander');
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

function scrape(articles) {
	for (const article in articles) {
		console.log(`${article} ${articles[article]} ${program.url}\/${articles[article]}\/`);
	}
}

if (program.range !== undefined && program.range.length > 0) {
	scrape(program.range);
} else {
	scrape(program.id);
}
