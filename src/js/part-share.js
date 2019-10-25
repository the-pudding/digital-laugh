/* global d3 */

import * as noUiSlider from 'nouislider';
import loadData from './load-data';
import puddingChartTreeMap from './pudding-chart/treemap';
import puddingChartVarWidth from './pudding-chart/varwidth';

const REM = 16;
const MIN_SHARE = 0.0001;
const SLIDER_MULT = 1000;
let shareData = [];
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
    // chartCase.resize();
  }
}

function setupSlider(data) {
  const l = data.length;
  const max = data[0].sumShare * SLIDER_MULT;
  const min = data[Math.floor(l * 0.8)].sumShare * SLIDER_MULT;
  const q3 = data[Math.floor(l * 0.2)].sumShare * SLIDER_MULT;
  const q2 = data[Math.floor(l * 0.4)].sumShare * SLIDER_MULT;
  const start = max;

  slider = noUiSlider.create($slider.node(), {
    start: [start],
    connect: false,
    direction: 'rtl',
    range: { min: [min], '50%': q2, '75%': q3, max: [max] },
  });

  slider.on('set', handleSliderSet);
  // slider.on('slide', handleSliderSlide);
}

function setupToggle() {
  $chartCase.selectAll('.header__toggle button').on('click', handleToggleClick);
}

function setupCase(data) {
  shareData = data.map(d => ({
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
        sumShare,
        sumCount,
        laughs,
      };
    })
    .entries(shareData)
    .map(d => d.value)
    .filter(d => d.sumShare >= MIN_SHARE);

  nestedData.sort((a, b) => d3.descending(a.sumShare, b.sumShare));

  chartCase = $figureCase.datum(nestedData).puddingChartVarWidth();

  setupSlider(nestedData);
  setupToggle();
}

function setupLower(data) {
  const clean = data
    .map(d => ({
      ...d,
      count: +d.count_2019,
      share: +d.share_2019,
    }))
    .filter(d => d.share >= MIN_SHARE);

  const nested = d3
    .nest()
    .key(d => d.family)
    .entries(clean)
    .map(d => ({
      name: d.key,
      children: d.values,
    }));

  const extent = d3.extent(clean, d => d.share);

  const treeData = { name: 'all', children: nested, extent };
  chartLower = $figureLower.datum(treeData).puddingChartTreeMap();
}

function setup([all, lower]) {
  setupLower(lower);
  setupCase(all);
}

function init() {
  if ($content.size()) {
    updateFigureDimensions();

    loadData(['share--all.csv', 'share--case-insensitive.csv'])
      .then(setup)
      .catch(console.log);
  }
}

export default { init, resize };
