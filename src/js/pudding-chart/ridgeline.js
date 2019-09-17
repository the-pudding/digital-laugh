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
    // dimension stuff
    const MAX_HEIGHT = 96;
    const OFFSET = 0.67;
    let width = 0;
    let height = 0;
    const marginTop = 32;
    const marginBottom = 32;
    const marginLeft = 32;
    const marginRight = 32;

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
          .data([
            { offset: 0, color: '#61E8E1' },
            { offset: 1, color: '#FFFA5D' },
          ])
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
            $t.append('text');
            return $t;
          });

        $term.attr(
          'transform',
          (d, i) => `translate(0, ${i * MAX_HEIGHT * OFFSET})`
        );

        $term
          .select('.path--area')
          .datum(d => d.histogram)
          .attr('d', generateArea)
          .style('fill', `url(#${gradientID})`);

        $term
          .select('.path--line')
          .datum(d => d.histogram)
          .attr('d', generateLine);

        $term.select('text').text(d => d.key);

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
    };

    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
