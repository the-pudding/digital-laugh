/* global d3 */
import * as noUiSlider from 'nouislider';
import MoveTo from 'moveto';
import loadData from './load-data';
import db from './db';
import './pudding-chart/ridgeline';

const $section = d3.select('#rank');
const $content = $section.select('.section__content');
const $instructions = $content.select('.content__instructions');
const $terms = $content.select('.content__terms');
const $termLi = $terms.selectAll('.content__terms li');
const $slider = $content.select('.content__slider');
const $scale = $content.select('.content__scale');
const $figure = $content.select('.content__figure');
const $figureInner = $figure.select('.figure__inner');
const $nav = $content.select('.content__nav');

const $submitButton = $nav.select('.btn--submit');
const $anotherButton = $nav.select('.btn--another');
const $skipButton = $nav.select('.btn--skip');
const $scaleItem = $scale.selectAll('.scale__item');
const $spacer = $nav.select('.spacer');

const VERSION = Date.now();
const RESULTS_URL = `https://pudding.cool/2019/09/digital-laugh-data/data.json?version=${VERSION}`;
const SLIDER_MIN = 1;
const SLIDER_MAX = 5;
const SLIDER_STEP = 0.05;

const mt = new MoveTo();

let resultsData = [];
let chart = null;
let slider = null;
let min = null;
let max = null;

function resize() {
  if ($content.size()) {
    chart.resize().render();
  }
}

function moveButton(el) {
  const $li = d3.select(el);
  const bboxLi = el.getBoundingClientRect();
  const bboxTerms = $terms.node().getBoundingClientRect();

  const leftStart = bboxLi.left - bboxTerms.left;
  const topStart = bboxLi.top - bboxTerms.top;
  $li
    .style('top', `${topStart}px`)
    .style('left', `${leftStart}px`)
    .classed('is-active', true);

  const centerX = bboxTerms.width / 2;
  const centerY = bboxTerms.height / 2;

  const leftStop = centerX - bboxLi.width / 2;
  const topStop = centerY - bboxLi.height / 2;

  $li
    .transition()
    .delay(0)
    .duration(750)
    .ease(d3.easeCubicInOut)
    .style('top', `${topStop}px`)
    .style('left', `${leftStop}px`)
    .style('transform', 'scale(2)');
}

function handleSubmitClick() {
  $submitButton.classed('is-disabled', true);
  const term = $submitButton.attr('data-term');
  chart.reveal(term);
  $figure.classed('is-visible', true);

  $terms.select(`[data-term='${term}']`).classed('is-complete', true);
  $slider.classed('is-disabled', true).attr('disabled', 'disabled');

  mt.move($spacer.node());
  db.update({ key: term, min, max });
  // TODO all submitted
}

function handleAnotherClick() {
  $termLi
    .style('transform', 'scale(1)')
    .style('top', 0)
    .style('left', 0)
    .classed('is-active', false)
    .classed('is-hidden', false);

  $slider.classed('is-disabled', true).attr('disabled', 'disabled');
  $scale.classed('is-disabled', true);
  $instructions.classed('is-answering', false);
  $submitButton.classed('is-hidden', true);

  slider.set([1, 5]);
  $scaleItem.classed('is-active', false);

  mt.move($content.node());
}

function handleSkipClick() {
  const terms = [];
  $termLi.each((d, i, n) => {
    terms.push(d3.select(n[i]).text());
  });
  chart.all(terms);
  $skipButton.classed('is-invisible', true);
  $figure.classed('is-visible', true);

  mt.move($spacer.node());
}

function handleTermClick() {
  const el = this.parentNode;
  const $li = d3.select(el);
  const $btn = $li.select('button');
  const term = $btn.text();

  $termLi.classed('is-active', false).classed('is-hidden', true);
  $slider.classed('is-disabled', false).attr('disabled', null);
  $scale.classed('is-disabled', false);
  $instructions.classed('is-answering', true);
  $submitButton
    .classed('is-disabled', false)
    .classed('is-hidden', false)
    .attr('data-term', term);
  $anotherButton.classed('is-disabled', false);

  min = null;
  max = null;
  mt.move($content.node());
  moveButton(el);
}

function handleSlider([a, b]) {
  min = +a;
  max = +b;
  $scaleItem.classed('is-active', d => d >= min && d <= max);
}

function setupScale() {
  $scaleItem.each((d, i, n) => {
    d3.select(n[i]).datum(i + 1);
  });
}

function setupSlider() {
  $slider.attr('disabled', true).classed('is-disabled', true);
  $scale.classed('is-disabled', true);

  slider = noUiSlider.create($slider.node(), {
    start: [SLIDER_MIN, SLIDER_MAX],
    connect: true,
    step: SLIDER_STEP,
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
  });

  slider.on('set', handleSlider);
  slider.on('slide', handleSlider);
}

function setupTermButtons() {
  $termLi.select('button').on('click', handleTermClick);
}

function setupNavButtons() {
  $submitButton.on('click', handleSubmitClick);
  $anotherButton.on('click', handleAnotherClick);
  $skipButton.on('click', handleSkipClick);
}

function setupDB() {
  db.setup();
  const returner = db.getReturner();
  console.log({ returner });

  // db.update({ key: 'ha', min: '4.05', max: '4.75' });
  // db.setReturner();
  // db.finish();
}

function cleanData({ results, data }) {
  return results
    .map(d => {
      const match = data.find(v => v.id === d.key);
      const histogram = d.histogram.map(v => ({ ...v, value: +v.value }));

      const post = { value: 5.05, count: 0 };
      const pre = { value: 0.95, count: 0 };
      histogram.push(post);
      histogram.unshift(pre);

      return {
        ...d,
        histogram,
        family: match ? match.family : null,
      };
    })
    .filter(d => d.family);
}

function setupResults(data) {
  // create the charts
  chart = $figureInner.puddingChartRidgeline();

  d3.json(RESULTS_URL)
    .then(raw => {
      console.log(raw.updated);
      resultsData = cleanData({ results: raw.results, data });
      chart
        .data(resultsData)
        .resize()
        .render();
    })
    .catch(console.error);
}

function setup(data) {
  setupScale();
  setupSlider();
  setupTermButtons();
  setupNavButtons();
  setupDB();
  setupResults(data);
}

function init() {
  if ($content.size()) {
    loadData('share--all.csv')
      .then(setup)
      .catch(console.error);
  }
}

export default { init, resize };
