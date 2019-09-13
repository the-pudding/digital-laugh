/* global d3 */
import * as noUiSlider from 'nouislider';
import db from './db';
import './pudding-chart/ridgeline';

const $section = d3.select('#perception');
const $stepPick = $section.select('.steps__pick');
const $stepAnswer = $section.select('.steps__answer');
const $figure = $section.select('.section__figure');

const $termButton = $stepPick.selectAll('.step__terms button');
const $slider = $stepAnswer.select('.step__slider');
const $scale = $stepAnswer.select('.step__scale');
const $scaleItem = $scale.selectAll('.scale__item');
const $instructionsLaugh = $stepAnswer.select('.step__instructions span');
const $submit = $stepAnswer.select('.step__submit');
const $submitButton = $submit.select('.step__submit button');
const $answerFigure = $stepAnswer.select('.step__figure');

const RESULTS_URL = 'https://pudding.cool/2019/09/digital-laugh-data/data.json';
const SLIDER_MIN = 1;
const SLIDER_MAX = 5;
const SLIDER_STEP = 0.05;

let resultsData = [];
let answerChart = null;
let allChart = null;

function resize() {}

function handleSubmitClick() {
  $submit.classed('is-hidden', true);
  const term = $submit.attr('data-term');
  answerChart.data(resultsData.filter(d => d.key === term));
}

function handleTermClick() {
  const $btn = d3.select(this);
  const term = $btn.text();
  $termButton.classed('is-active', false);
  $btn.classed('is-active', true);
  $slider.classed('is-disabled', false).attr('disabled', null);
  $scale.classed('is-disabled', false);
  $instructionsLaugh.text(`${term}`).classed('is-active', true);
  $submit.classed('is-hidden', false).attr('data-term', term);
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
  $termButton.on('click', handleTermClick);
}

function setupDB() {
  db.setup();
  const returner = db.getReturner();
  console.log({ returner });

  // db.update({ key: 'lol', min: 1.05, max: 3.1 });
  // const value = db.getAnswer('lol');
  // console.log(value);
  // db.setReturner();
  // db.finish();
}

function setupResults() {
  // create the charts
  answerChart = $answerFigure.puddingChartRidgeline();
  allChart = null;

  $submitButton.on('click', handleSubmitClick);

  d3.json(RESULTS_URL)
    .then(raw => {
      console.log(raw.updated);
      resultsData = raw.results;
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
