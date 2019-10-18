/* global d3 */

import * as noUiSlider from 'nouislider';
import loadData from './load-data';
import puddingChartTreeMap from './pudding-chart/treemap';
import puddingChartVarWidth from './pudding-chart/varwidth';

const REM = 16;
const MIN_SHARE = 0.0001;
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

function handleSlider([a]) {
  console.log(a);
  // min = Math.round(+a);
  // max = Math.round(+b);
  // $scaleItem.classed('is-active', d => d >= min && d <= max);
}

function updateFigureDimensions() {
  const m = REM * 2;
  const o = $chartCase.select('.case__header').node().offsetHeight;
  const h = window.innerHeight - o - m;
  $figureCase.style('height', `${h}px`);

  const w = $figureLower.node().offsetWidth;
  const h2 = window.innerHeight * 0.9;
  const sz = Math.min(w, h2);

  $figureLower.style('width', `${sz}px`).style('height', `${sz}px`);
}

function resize() {
  if ($content.size()) {
    updateFigureDimensions();
  }
}

function setupCase(data) {
  shareData = data.map(d => ({
    id: d.id,
    family: d.family,
    count: +d.count,
    share: +d['2019'],
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

  chartCase = $figureCase.datum(nestedData).puddingChartVarWidth();

  // console.table(nestedData);
  setTimeout(() => {
    chartCase
      .data(nestedData.filter(d => d.sumShare <= 0.1))
      .resize()
      .render();
  }, 4000);

  setTimeout(() => {
    chartCase
      .data(nestedData.filter(d => d.sumShare <= 0.005))
      .resize()
      .render();
  }, 8000);

  setTimeout(() => {
    chartCase
      .data(nestedData.filter(d => d.sumShare <= 0.001))
      .resize()
      .render();
  }, 12000);
}

function setupLower(data) {
  const clean = data
    .map(d => ({
      ...d,
      count: +d.count,
      share: +d['2019'],
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

function setupSlider() {
  slider = noUiSlider.create($slider.node(), {
    start: [0],
    connect: false,
    step: 1,
    range: { min: 0, max: 4 },
  });

  slider.on('set', handleSlider);
  slider.on('slide', handleSlider);
}

function setup([all, lower]) {
  setupLower(lower);
  setupCase(all);
  setupSlider();
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
