/* global d3 */
import * as noUiSlider from 'nouislider';
import db from './db';
const $section = d3.select('#perception');
const $stepPick = $section.select('.steps__pick');
const $stepAnswer = $section.select('.steps__answer');
const $figure = $section.select('.section__figure');

const $termButton = $stepPick.selectAll('.step__terms button');
const $slider = $stepAnswer.select('.step__slider');
const $scale = $stepAnswer.select('.step__scale');
const $scaleItem = $scale.selectAll('.scale__item');
const $instructionsLaugh = $stepAnswer.select('.step__instructions span');

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
	const min = Math.round(+a);
	const max = Math.round(+b);
	$scaleItem.classed('is-active', d => d >= min && d<= max);
}

function setupScale() {
	$scaleItem.each((d, i, n) => {
		d3.select(n[i]).datum(i + 1);
	});
}

function setupSlider() {
	$slider.attr('disabled', true).classed('is-disabled', true);
	$scale.classed('is-disabled', true);
	const min = 1;
	const max = 5;
	const s = noUiSlider.create($slider.node(), {
		start: [min, max],
		connect: true,
		// step: 1,
		range: { min, max },
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

	db.update({ key: 'lol', min: 1, max: 5 });
	const value = db.getAnswer('lol');
	console.log(value)
	// db.setReturner();
	// db.finish();
}

function init() {
	setupScale();
	setupSlider();
	setupTermButtons();	
	setupDB();
}

export default { init, resize };
