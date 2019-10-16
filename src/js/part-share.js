/* global d3 */

import loadData from './load-data';
import puddingChartVarWidth from './pudding-chart/varwidth';

const MIN_SHARE = 0.0005;
let shareData = [];
let nestedData = [];
let chart = null;

const $section = d3.select('#share');
const $content = $section.select('.section__content');
const $figure = $content.select('figure');

function resize() {
  if ($content.size()) {
  }
}

function setup(data) {
  shareData = data.map(d => ({
    id: d.id,
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

  chart = $figure.datum(nestedData).puddingChartVarWidth();

  // console.table(nestedData);
  chart
    .data(nestedData.filter(d => !['lol', 'haha', 'lmao'].includes(d.id)))
    .resize()
    .render();
}

function init() {
  if ($content.size()) {
    loadData('share--all.csv')
      .then(setup)
      .catch(console.log);
  }
}

export default { init, resize };
