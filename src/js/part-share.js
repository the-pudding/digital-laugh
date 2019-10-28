/* global d3 */

import * as noUiSlider from 'nouislider';
import loadData from './load-data';
import puddingChartTreeMap from './pudding-chart/treemap';
import puddingChartVarWidth from './pudding-chart/varwidth';

const REM = 16;
const MIN_SHARE = 0.0001;
const SLIDER_MULT = 1000;
let nestedData = [];
let chartLower = null;
let chartCase = null;
let slider = null;

const $section = d3.select('#share');
const $content = $section.select('.section__content');
const $chartLower = $content.select('.chart-lower');
const $chartCase = $content.select('.chart-case');
const $figureLower = $chartLower.select('figure');
const $figureCase = $chartCase.select('figure');
const $slider = $chartCase.select('.slider');

function updateCase({ thresh, animate }) {
  const data = nestedData.filter(d => d.sumShare <= thresh);
  chartCase
    .data(data)
    .resize()
    .render(animate);
}

function handleToggleClick() {
  const $btn = d3.select(this);
  const val = $btn.text();
  $chartCase.selectAll('.header__toggle button').classed('is-active', false);
  $btn.classed('is-active', true);
  chartCase.sort(val);
}

function handleSliderSet([a]) {
  const thresh = +a / SLIDER_MULT;
  updateCase({ thresh, animate: true });
}

function updateFigureDimensions() {
  const w = $section.node().offsetWidth;
  const ih = window.innerHeight * 0.9;
  const sz = Math.floor(Math.min(w, ih));
  $figureLower.style('width', `${sz}px`).style('height', `${sz}px`);

  // const m = REM * 2;
  const o = $chartCase.select('.case__header').node().offsetHeight;
  const h = Math.floor(window.innerHeight - o);
  $figureCase.style('height', `${h}px`);
}

function resize() {
  if ($content.size()) {
    updateFigureDimensions();
    chartLower.resize().render();
    chartCase.resize().render();
  }
}

function setupSlider() {
  const l = nestedData.length;
  const max = nestedData[0].sumShare * SLIDER_MULT;
  const min = nestedData[Math.floor(l * 0.8)].sumShare * SLIDER_MULT;
  const q3 = nestedData[Math.floor(l * 0.2)].sumShare * SLIDER_MULT;
  const q2 = nestedData[Math.floor(l * 0.4)].sumShare * SLIDER_MULT;
  const start = max;

  slider = noUiSlider.create($slider.node(), {
    start: [start],
    connect: false,
    direction: 'rtl',
    range: { min: [min], '50%': q2, '75%': q3, max: [max] },
    pips: {
      mode: 'range',
      density: 100,
      format: {
        to: d => d3.format('.1%')(d / SLIDER_MULT),
      },
    },
  });

  slider.on('set', handleSliderSet);
  // slider.on('slide', handleSliderSlide);
}

function setupToggle() {
  $chartCase.selectAll('.header__toggle button').on('click', handleToggleClick);
}

function setupCase() {
  chartCase = $figureCase.datum(nestedData).puddingChartVarWidth();

  setupSlider();
  setupToggle();
}

function setupLower() {
  const byFamily = d3
    .nest()
    .key(d => d.family)
    .entries(nestedData)
    .map(d => ({
      name: d.key,
      children: d.values,
    }));

  const extent = d3.extent(nestedData, d => d.sumShare);

  const treeData = { name: 'all', children: byFamily, extent };
  chartLower = $figureLower.datum(treeData).puddingChartTreeMap();
}

function setup(data) {
  const shareData = data.map(d => ({
    id: d.id,
    family: d.family,
    count: +d.count_2019,
    share: +d.share_2019,
  }));

  nestedData = d3
    .nest()
    .key(d => d.id.toLowerCase())
    .rollup(values => {
      const sumCount = d3.sum(values, v => v.count);
      const sumShare = d3.sum(values, v => v.share);
      const laughs = values.map(v => ({
        ...v,
        sumCount,
        sumShare,
        case: v.id.toLowerCase() === v.id ? 'lower' : 'upper',
      }));

      laughs.sort((a, b) => d3.ascending(a.case, b.case));

      return {
        id: values[0].id.toLowerCase(),
        family: values[0].family,
        sumShare,
        sumCount,
        laughs,
      };
    })
    .entries(shareData)
    .map(d => d.value)
    .filter(d => d.sumShare >= MIN_SHARE);

  nestedData.sort((a, b) => d3.descending(a.sumShare, b.sumShare));

  setupLower();
  setupCase();
}

function init() {
  if ($content.size()) {
    updateFigureDimensions();

    loadData('share--all.csv')
      .then(setup)
      .catch(console.log);
  }
}

export default { init, resize };
