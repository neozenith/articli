'use strict';
console.log('Plot ENTER');

var data = [4, 8, 15, 16, 23, 42];
var margin = { top: 20, right: 30, bottom: 50, left: 40 },
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

// Define a linear scale for output geometry
var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);

var y = d3.scale.linear().range([height, margin.top]);

// Defince chart axes
var xAxis = d3.svg
	.axis()
	.scale(x)
	.orient('bottom');

var yAxis = d3.svg
	.axis()
	.scale(y)
	.orient('left')
	.ticks(10, '$');

var chart = d3
	.select('#chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.csv('data.csv', type, function(error, data) {
	//Mapp the data domain to linear scale
	x.domain(
		data
			.map(function(d) {
				return d.date;
			})
			.sort()
	);

	y.domain([
		d3.min(data, function(d) {
			return parseFloat(d.value);
		}),
		d3.max(data, function(d) {
			return parseFloat(d.value);
		})
	]);

	chart
		.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxis);

	chart
		.append('g')
		.attr('class', 'y axis')
		.call(yAxis);

	chart
		.selectAll('.bar')
		.data(data)
		.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', function(d) {
			return x(d.date);
		})
		.attr('y', function(d) {
			return y(d.value);
		})
		.attr('height', function(d) {
			return height - y(d.value);
		})
		.attr('width', x.rangeBand());

	chart
		.append('g')
		.attr('class', 'y axis')
		.call(yAxis)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 6)
		.attr('dy', '.71em')
		.style('text-anchor', 'end')
		.text('Spend');
});

function type(d) {
	d.value = +d.value; // coerce to number
	return d;
}

console.log('Plot EXIT');
