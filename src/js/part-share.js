/* global d3 */

import loadData from './load-data';
import puddingChartVarWidth from './pudding-chart/varwidth';
import colors from './colors';

// const MIN_SHARE = 0.00005;
const MIN_SHARE = 0.0001;
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

function setupCase(data) {
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

  const treeData = { name: 'all', children: nested };

  const tile = 'treemapBinary';

  const margin = 16;
  const size = 960 - margin * 2;
  const treemap = d3
    .treemap()
    .tile(d3[tile])
    .size([size, size])
    .padding(0)
    .round(true);

  const hiearchy = d3
    .hierarchy(treeData)
    .sum(d => d.count)
    .sort((a, b) => b.count - a.count);

  const root = treemap(hiearchy);

  // const color = d3.scaleOrdinal(d3.schemeCategory10);
  const colorMap = {
    lol: colors.white,
    ha: colors.yellow,
    acronym: colors.orange,
    other: colors.blue,
    text: colors.black,
  };

  const extent = d3.extent(clean, d => d.share);
  const font = d3
    .scalePow()
    .exponent(0.5)
    .domain(extent)
    .range([12, 64]);

  const $svg = $figure.append('svg');

  const $g = $svg.append('g');

  $g.attr('transform', `translate(${margin}, ${margin})`);

  $svg
    .style('width', `${size + margin * 2}px`)
    .style('height', `${size + margin * 2}px`);

  const $leaf = $g
    .selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  $leaf
    .append('rect')
    .attr('fill', d => colorMap[d.data.family])
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0);

  $leaf
    .append('text')
    .attr('data-text', 'id')
    .text(d => d.data.id)
    .style('font-size', d => font(d.data.share))
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2)
    .style('opacity', d => (d.data.share < 0.001 ? 0 : 1));

  $leaf
    .append('text')
    .attr('class', 'text--share')
    .text(d => d3.format('.1%')(d.data.share))
    .style('font-size', '12px')
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2 + font(d.data.share))
    .style('opacity', d => (d.data.share < 0.001 ? 0 : 1));

  $leaf
    .append('text')
    .attr('class', 'text--count')
    .text(d => d3.format(',')(d.data.count))
    .style('font-size', '12px')
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2 + font(d.data.share) + 16)
    .style('opacity', d => (d.data.share < 0.1 ? 0 : 1));

  console.table(clean);
}

function setup([all, lower]) {
  // setupCase(all);
  setupLower(lower);
}

function init() {
  if ($content.size()) {
    loadData(['share--all.csv', 'share--case-insensitive.csv'])
      .then(setup)
      .catch(console.log);
  }
}

export default { init, resize };
