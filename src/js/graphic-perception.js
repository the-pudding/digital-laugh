/* global d3 */
import * as noUiSlider from 'nouislider';
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
}

export default { init, resize };
