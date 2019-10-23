/* global d3 */
/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartLine = function init(options) {
  function createChart(el) {
    const $sel = d3.select(el);
    let data = $sel.datum();
    // dimension stuff
    let width = 0;
    let height = 0;
    const marginTop = 32;
    const marginBottom = 32;
    const marginLeft = 32;
    const marginRight = 32;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLinear();

    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;

    // helper functions
    function enter(sel) {
      const $g = sel.append('g');
      $g.attr('class', 'laugh');
      $g.append('path');
      $g.append('text')
        .text(d => d.key)
        .attr('text-anchor', 'end')
        .attr('x', 0)
        .attr('y', 0);
      return $g;
    }

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg').attr('class', 'pudding-chart');
        const $g = $svg.append('g');

        // offset chart for margins
        $g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');

        // setup viz group
        $vis = $g.append('g').attr('class', 'g-vis');

        Chart.resize();
        Chart.render();
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height = Math.floor(width * 0.67) - marginTop - marginBottom;

        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        scaleX.range([0, width]);
        scaleY.range([height, 0]);

        return Chart;
      },
      // update scales and render chart
      render() {
        const nested = d3
          .nest()
          .key(d => d.id)
          .entries(data);

        const extentX = d3.extent(data, d => d.year);
        const extentY = [0, d3.max(data, d => d.share)];

        // const stackData = d3
        //   .nest()
        //   .key(d => d.year)
        //   .entries(data);a

        // const series = d3
        //   .stack()
        //   .keys(nested.map(d => d.key))
        //   .offset(d3.stackOffsetWiggle)
        //   .order(d3.stackOrderInsideOut)(data);

        scaleX.domain(extentX);
        scaleY.domain(extentY);

        const line = d3
          .line()
          .x(d => scaleX(d.year))
          .y(d => scaleY(d.share));

        const $laugh = $vis
          .selectAll('.laugh')
          .data(nested, d => d.key)
          .join(enter);

        $laugh
          .select('path')
          .datum(d => d.values)
          .attr('d', line);

        $laugh
          .select('text')
          .attr(
            'transform',
            d =>
              `translate(${scaleX(d.values[9].year)}, ${scaleY(
                d.values[9].share
              )})`
          );

        return Chart;
      },
      // get / set data
      data(val) {
        if (!arguments.length) return data;
        data = val;
        $sel.datum(data);
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
