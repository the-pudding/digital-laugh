/* global d3 */
import uniq from 'lodash.uniqby';

/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartRidgeline = function init(options) {
  function createChart(el) {
    const $sel = d3.select(el);
    let data = $sel.datum() || [];
    let revealedTerms = [];
    const revealedValues = [];
    // dimension stuff
    const MAX_HEIGHT = 64;
    const OFFSET = 1;
    const TEXT_HEIGHT = 24;
    const SLIDER_R = 6;

    const marginTop = 32;
    const marginBottom = 32;
    const marginLeft = 84;
    const marginRight = 8;
    let width = 0;
    let height = 0;
    let term = null;
    let showAll = false;
    let sortVal = 'mean';

    // scales
    const scaleX = d3.scaleLinear();
    const generateArea = d3.area();
    const generateLine = d3.line();

    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;
    let chartHeight = 0;

    // helper functions

    function getSortVal(d) {
      if (term) {
        if (d.key === term) return 2;
        if (revealedTerms.includes(d.key)) return 1;
        return 0;
      }
      return d[sortVal];
    }

    const Chart = {
      // called once at start
      init() {
        $axis = $sel.append('div').attr('class', 'axis');
        $axis.append('p').html('&lt; Less Funny');
        $axis.append('p').html('Results');
        $axis.append('p').html('More Funny &gt;');

        $svg = $sel.append('svg').attr('class', 'pudding-chart');

        const $g = $svg.append('g');

        // offset chart for margins
        $g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        // setup viz group
        $vis = $g.append('g').attr('class', 'g-vis');

        generateLine.curve(d3.curveMonotoneX);

        generateArea.curve(d3.curveMonotoneX);

        Chart.resize();
        Chart.render();
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;

        chartHeight = MAX_HEIGHT;
        const numRidges = Math.max(0, data.length - 1);
        height = chartHeight + numRidges * (MAX_HEIGHT * OFFSET + TEXT_HEIGHT);

        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        return Chart;
      },
      // update scales and render chart
      render() {
        if (!data.length) return null;

        const valueExtent = d3.extent(data[0].histogram, d => d.value);

        scaleX.domain(valueExtent).range([0, width]);

        const scaleY = {};

        data.forEach(d => {
          const maxCount = d3.max(d.histogram, v => v.count);
          scaleY[d.key] = d3
            .scaleLinear()
            .domain([0, maxCount])
            .range([MAX_HEIGHT, 0]);
        });

        generateLine.x(d => scaleX(d.value)).y(d => scaleY[d.key](d.count));

        generateArea
          .x(d => scaleX(d.value))
          .y0(d => scaleY[d.key](0))
          .y1(d => scaleY[d.key](d.count));

        const $term = $vis
          .selectAll('.term')
          .data(data, d => d.key)
          .join(enter => {
            const $t = enter.append('g').attr('class', 'term');
            $t.append('path').attr(
              'class',
              d => `path--area family--${d.family}`
            );
            $t.append('path').attr('class', 'path--line');
            $t.append('line')
              .attr('class', 'baseline')
              .attr('x1', 0);
            $t.append('circle')
              .attr('class', 'slider--min')
              .attr('r', SLIDER_R);

            $t.append('circle')
              .attr('class', 'slider--max')
              .attr('r', SLIDER_R);

            $t.append('text')
              .attr('class', 'text--label')
              .attr('x', 0)
              .attr('y', 0)
              .attr('text-anchor', 'end')
              .attr('alignment-baseline', 'baseline');

            $t.append('text')
              .attr('class', 'text--count')
              .attr('x', 0)
              .attr('y', 0)
              .attr('text-anchor', 'end')
              .attr('alignment-baseline', 'baseline');
            $t.style('opacity', 0);
            return $t;
          });

        const $sorted = $term.sort((a, b) => {
          const aV = getSortVal(a);
          const bV = getSortVal(b);
          if (sortVal === 'key') return d3.ascending(aV, bV);
          return d3.descending(aV, bV);
        });

        $sorted
          .transition()
          .duration(750)
          // .delay((d, i) => ($sorted.size() - i) * 250)
          .ease(d3.easeCubicInOut)
          .attr(
            'transform',
            (d, i) => `translate(0, ${i * (MAX_HEIGHT * OFFSET + TEXT_HEIGHT)})`
          )
          .style('opacity', d => {
            if (showAll) return 1;
            if (d.key === term) return 1;
            if (revealedTerms.includes(d.key)) return 0.5;
            return 0;
          });

        $sorted
          .select('.path--area')
          .datum(d => d.histogram)
          .attr('d', generateArea);

        $sorted
          .select('.path--line')
          .datum(d => d.histogram)
          .attr('d', generateLine);

        $sorted
          .select('.baseline')
          .attr('x2', scaleX.range()[1])
          .attr('y1', d => scaleY[d.key].range()[0])
          .attr('y2', d => scaleY[d.key].range()[0]);

        $sorted
          .select('.text--label')
          .text(d => d.key)
          .attr('x', -12)
          .attr('y', d => scaleY[d.key].range()[0]);

        $sorted
          .select('.text--count')
          .text(d => `${d3.format(',')(d.count)} votes`)
          .attr('x', -12)
          .attr('y', d => scaleY[d.key].range()[0] + TEXT_HEIGHT * 0.75);

        $sorted
          .selectAll('circle')
          .attr('cy', d => scaleY[d.key].range()[0])
          .style('opacity', d =>
            revealedValues.find(v => v.term === d.key) ? 1 : 0
          );

        $sorted.select('.slider--min').attr('cx', d => {
          const match = revealedValues.find(v => v.term === d.key);
          return scaleX(match ? match.min : 0);
        });

        $sorted.select('.slider--max').attr('cx', d => {
          const match = revealedValues.find(v => v.term === d.key);
          return scaleX(match ? match.max : 0);
        });

        return Chart;
      },
      // get / set data
      data(val) {
        if (!arguments.length) return data;
        data = val;
        $sel.datum(data);
        Chart.resize();
        Chart.render();
        return Chart;
      },
      reveal(val) {
        if (!arguments.length) return term;
        term = val.term;
        revealedTerms.push(val.term);
        revealedValues.push(val);
        return Chart;
      },
      termCount() {
        return revealedTerms.length;
      },
      all(val) {
        term = null;
        showAll = true;
        revealedTerms = uniq(revealedTerms.concat(val));
        return Chart;
      },
      height() {
        return MAX_HEIGHT + TEXT_HEIGHT;
      },
      sort(val) {
        sortVal = val;
        Chart.resize();
        Chart.render();
        return Chart;
      },
    };

    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
