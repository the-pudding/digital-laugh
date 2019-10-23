/* global d3 */
import loadData from './load-data';
import './pudding-chart/lines';

const $section = d3.select('#lol');
const $content = $section.select('.section__content');
const $figure = $content.select('figure');

let chart = null;

function resize() {
  if ($content.size()) {
  }
}
function setup(data) {
  const years = d3.range(2009, 2019);

  // console.log(data);
  const clean = data
    .filter(d => d.count_2009)
    .map(d => {
      const o = { ...d };
      for (const p in d) {
        if (p.includes('count') || p.includes('share')) {
          o[p] = +d[p];
        }
      }
      return o;
    })
    .map(d =>
      years.map(year => ({
        year,
        family: d.family,
        id: d.id,
        count: d[`count_${year}`],
      }))
    );

  const flat = [].concat(...clean);

  const sumByYear = d3
    .nest()
    .key(d => d.year)
    .rollup(values => d3.sum(values, v => v.count))
    .entries(flat);

  const withShare = flat.map(d => ({
    ...d,
    share: d.count / sumByYear.find(v => +v.key === d.year).value,
  }));

  chart = $figure.datum(withShare).puddingChartLine();
}

function init() {
  if ($content.size()) {
    // updateFigureDimensions();
    loadData('share--case-insensitive.csv')
      .then(setup)
      .catch(console.error);
  }
}

export default { init, resize };
