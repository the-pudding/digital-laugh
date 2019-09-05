/* global d3 */
import * as noUiSlider from 'nouislider';
import db from './db';
const $section = d3.select('#perception');

function resize() { }

function setupSlider() {
	const $slider = $section.select('.slider');

	noUiSlider.create($slider.node(), {
		start: [20, 80],
		connect: true,
		range: {
			'min': 0,
			'max': 100
		}
	});
}

function init() {
	setupSlider();	
	db.setup();
	const returner = db.getReturner();
	console.log({ returner })

	db.update({ key: 'lol', min: 5, max: 9 });
	const value = db.getAnswer('lol');
	console.log(value)
	// db.setReturner();
	// db.finish();
	
}

export default { init, resize };
