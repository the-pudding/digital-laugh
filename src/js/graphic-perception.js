/* global d3 */
import * as noUiSlider from 'nouislider';
import db from './db';
import './pudding-chart/ridgeline';

const $section = d3.select('#perception');
const $survey = $section.select('.section__survey');
const $instructions = $survey.select('.survey__instructions');
// const $instructions1 = $instructions.select('.instructions--1');
// const $instructions2 = $instructions.select('.instructions--2');
const $terms = $survey.select('.survey__terms');
const $termLi = $terms.selectAll('.survey__terms li');
const $slider = $survey.select('.survey__slider');
const $scale = $survey.select('.survey__scale');
const $figure = $survey.select('.survey__figure');
const $nav = $survey.select('.survey__nav');

const $submitButton = $nav.select('.btn--submit');
const $skipButton = $nav.select('.btn--skip');
const $anotherButton = $nav.select('.btn--another');
const $scaleItem = $scale.selectAll('.scale__item');

const VERSION = Date.now();
const RESULTS_URL = `https://pudding.cool/2019/09/digital-laugh-data/data.json?version=${VERSION}`;
const SLIDER_MIN = 1;
const SLIDER_MAX = 5;
const SLIDER_STEP = 0.05;

let resultsData = [];
let chart = null;

function resize() {}

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
  $submitButton.classed('is-hidden', true);
  const term = $submitButton.attr('data-term');
  chart.highlight(term);
  $figure.classed('is-visible', true);
}

function handleTermClick() {
  const el = this.parentNode;
  const $li = d3.select(el);
  const $btn = $li.select('button');
  const term = $btn.text();
  $termLi.classed('is-active', false);
  $termLi.classed('is-hidden', true);
  $slider.classed('is-disabled', false).attr('disabled', null);
  $scale.classed('is-disabled', false);
  $instructions.classed('is-answering', true);
  $submitButton.classed('is-hidden', false).attr('data-term', term);
  $figure.classed('is-visible', false);

  moveButton(el);
}

function handleSliderChange([a, b]) {
  const min = +a;
  const max = +b;
}

function handleSliderSlide([a, b]) {
  const min = Math.round(+a);
  const max = Math.round(+b);
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

  const s = noUiSlider.create($slider.node(), {
    start: [SLIDER_MIN, SLIDER_MAX],
    connect: true,
    step: SLIDER_STEP,
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
    // pips: {
    // 	mode: 'steps',
    // 	density: 10
    // }
  });

  s.on('change', handleSliderChange);
  s.on('slide', handleSliderSlide);
}

function setupTermButtons() {
  $termLi.select('button').on('click', handleTermClick);
}

function setupDB() {
  db.setup();
  const returner = db.getReturner();
  console.log({ returner });

  db.update({ key: 'ha', min: '4.05', max: '4.75' });
  // db.setReturner();
  // db.finish();
}

function setupResults() {
  // create the charts
  chart = $figure.puddingChartRidgeline();

  $submitButton.on('click', handleSubmitClick);

  d3.json(RESULTS_URL)
    .then(raw => {
      console.log(raw.updated);
      resultsData = raw.results;

      chart
        .data(resultsData)
        .resize()
        .render();
    })
    .catch(console.error);
}

function init() {
  setupScale();
  setupSlider();
  setupTermButtons();
  setupDB();
  setupResults();
}

export default { init, resize };
