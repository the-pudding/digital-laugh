/* global d3 */
import uniq from 'lodash.uniqby';
import generateID from '../generate-id';

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
    let revealed = [];
    // dimension stuff
    const MAX_HEIGHT = 96;
    const OFFSET = 0.67;
    const YELLOW = '#FFFA5D';
    const ORANGE = '#FEA850';

    const marginTop = 32;
    const marginBottom = 32;
    const marginLeft = 32;
    const marginRight = 32;
    let width = 0;
    let height = 0;
    let term = 'tbd';

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLinear();
    const generateArea = d3.area();
    const generateLine = d3.line();

    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;
    let $linearGradient = null;

    let gradientID = null;
    let chartHeight = 0;

    // helper functions
    function setupGradient() {
      gradientID = `gradient-${generateID({ numbers: false })}`;

      $linearGradient = $svg
        .append('linearGradient')
        .attr('id', gradientID)
        .attr('gradientUnits', 'userSpaceOnUse');
    }

    function getSortVal(key) {
      if (key === term) return 0;
      if (revealed.includes(key)) return 1;
      return 2;
    }

    const Chart = {
      // called once at start
      init() {
        $axis = $sel.append('div').attr('class', 'axis');
        $axis.append('p').html('&larr; Less Funny');
        $axis.append('p').html('More Funny &rarr;');

        $svg = $sel.append('svg').attr('class', 'pudding-chart');

        setupGradient();

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
        height = chartHeight + numRidges * MAX_HEIGHT * OFFSET;

        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        $linearGradient
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', width)
          .attr('y2', 0);

        $linearGradient
          .selectAll('stop')
          .data([{ offset: 0, color: ORANGE }, { offset: 1, color: YELLOW }])
          .join('stop')
          .attr('offset', d => d.offset)
          .attr('stop-color', d => d.color);

        return Chart;
      },
      // update scales and render chart
      render() {
        if (!data.length) return null;

        const maxCount = d3.max(data, d => d3.max(d.histogram, v => v.count));
        const valueExtent = d3.extent(data[0].histogram, d => d.value);

        scaleX.domain(valueExtent).range([0, width]);

        scaleY.domain([0, maxCount]).range([MAX_HEIGHT - 10, 0]);

        generateLine.x(d => scaleX(d.value)).y(d => scaleY(d.count));

        generateArea
          .x(d => scaleX(d.value))
          .y0(scaleY(0))
          .y1(d => scaleY(d.count));

        const $term = $vis
          .selectAll('.term')
          .data(data)
          .join(enter => {
            const $t = enter.append('g').attr('class', 'term');
            $t.append('path').attr('class', 'path--area');
            $t.append('path').attr('class', 'path--line');
            $t.append('line')
              .attr('class', 'baseline')
              .attr('x1', 0);
            $t.append('text')
              .attr('x', 0)
              .attr('y', 0)
              .attr('alignment-baseline', 'hanging');

            return $t;
          });

        const $sorted = $term.sort((a, b) => {
          const aV = getSortVal(a.key);
          const bV = getSortVal(b.key);
          return d3.ascending(aV, bV);
        });

        $sorted
          .transition()
          .duration(750)
          .delay((d, i) => ($sorted.size() - i) * 250)
          .ease(d3.easeCubicInOut)
          .attr(
            'transform',
            (d, i) => `translate(0, ${i * MAX_HEIGHT * OFFSET})`
          )
          .style('opacity', d => {
            if (term) {
              if (d.key === term) return 1;
              if (revealed.includes(d.key)) return 0.5;
              return 0;
            }
            return 1;
          });

        $sorted
          .select('.path--area')
          .datum(d => d.histogram)
          .attr('d', generateArea)
          .style('fill', `url(#${gradientID})`);

        $sorted
          .select('.path--line')
          .datum(d => d.histogram)
          .attr('d', generateLine);

        $sorted
          .select('.baseline')
          .attr('x2', scaleX.range()[1])
          .attr('y1', scaleY.range()[0])
          .attr('y2', scaleY.range()[0]);

        $sorted
          .select('text')
          .text(d => d.key)
          .attr('y', scaleY.range()[0] + 8);

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
        term = val;
        revealed.push(val);
        Chart.resize();
        Chart.render();
        return Chart;
      },
      all(terms) {
        term = null;
        revealed = uniq(revealed.concat(terms));
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
