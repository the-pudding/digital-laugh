/* global d3 */
import * as noUiSlider from 'nouislider';
import db from './db';
const $section = d3.select('#perception');
const $ui = $section.select('.section__ui');
const $figure = $section.select('.section__figure');
const $scale = $ui.select('.ui__scale');
const $slider = $ui.select('.ui__slider');
const $termButton = $ui.selectAll('.ui__terms button');
const $instructionsLaugh = $ui.select('.instructions--2 span');

function resize() { }

function handleTermClick() {
	const $btn = d3.select(this);
	const term = $btn.text();
	$termButton.classed('is-active', false);
	$btn.classed('is-active', true);
	$slider.classed('is-disabled', false).attr('disabled', null);
	$scale.classed('is-disabled', false);
	$instructionsLaugh.text(`${term}`).classed('is-active', true);
}

function handleSliderChange([a, b]) {
	const min = +a;
	const max = +b;
}

function handleSliderSlide([a, b]) {
	const min = +a;
	const max = +b;
	
}

function setupSlider() {
	$slider.attr('disabled', true).classed('is-disabled', true);
	$scale.classed('is-disabled', true);

	const s = noUiSlider.create($slider.node(), {
		start: [0, 10],
		connect: true,
		step: 1,
		range: {
			'min': 0,
			'max': 10
		},
		// pips: {
		// 	mode: 'steps',
		// 	density: 10
		// }
	});

	s.on('change', handleSliderChange);
	s.on('slide', handleSliderSlide);
}

function setupTermButtons() {
	$termButton.on('click', handleTermClick);
}

function setupDB() {
	db.setup();
	const returner = db.getReturner();
	console.log({ returner })

	db.update({ key: 'lol', min: 5, max: 9 });
	const value = db.getAnswer('lol');
	console.log(value)
	// db.setReturner();
	// db.finish();
}

function init() {
	setupSlider();
	setupTermButtons();	
	setupDB();
}

export default { init, resize };
