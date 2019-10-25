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
    const marginTop = 24;
    const marginBottom = 32;
    const marginLeft = 64;
    const marginRight = 32;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLinear();

    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;
    let $defs = null;

    const STROKE_W = 8;
    const STROKE_W_LOL = 24;

    // helper functions
    function slugify(str) {
      return str.replace(/\s/g, '-');
    }

    function enter(sel) {
      const $g = sel.append('g');
      $g.attr('class', d => `laugh laugh--${slugify(d.key)}`);

      $g.each(d => {
        $defs.append('path').attr('id', `text-path--${slugify(d.key)}`);
      });

      $g.append('path').attr('class', 'path--bg');
      $g.append('path').attr('class', 'path--fg');
      $g.append('text')
        .append('textPath')
        .attr('xlink:href', d => `#text-path--${slugify(d.key)}`)
        .attr('startOffset', '100%')
        .style('text-anchor', 'end')
        .text(d => d.key);

      return $g;
    }

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg').attr('class', 'pudding-chart');

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');
        $axis.append('g').attr('class', 'axis--x');
        $axis.append('g').attr('class', 'axis--y');

        // setup viz group
        $vis = $svg.append('g').attr('class', 'g-vis');
        $vis.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        $defs = $svg.append('defs');

        Chart.resize();
        Chart.render();
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height = $sel.node().offsetHeight - marginTop - marginBottom;

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

        nested.sort((a, b) =>
          d3.ascending(a.values[9].share, b.values[9].share)
        );

        const extentX = d3.extent(data, d => d.year);
        const extentY = [0, d3.max(data, d => d.share) + 0.05];

        scaleX.domain(extentX);
        scaleY.domain(extentY);

        const axisX = d3
          .axisBottom(scaleX)
          .tickFormat(d3.format('.0f'))
          .ticks(width < 480 ? 5 : 10);
        $axis
          .select('.axis--x')
          .call(axisX)
          .attr(
            'transform',
            `translate(${marginLeft}, ${height +
              marginTop +
              marginBottom * 0.25})`
          );

        const axisY = d3
          .axisLeft(scaleY)
          .tickFormat(d3.format('.0%'))
          .ticks(5)
          .tickSize(-width - marginLeft * 0.25);
        $axis
          .select('.axis--y')
          .call(axisY)
          .attr('transform', `translate(${marginLeft * 0.75}, ${marginTop})`);

        const line = d3
          .line()
          .curve(d3.curveMonotoneX)
          .x(d => scaleX(d.year))
          .y(d => scaleY(d.share));

        const $laugh = $vis
          .selectAll('.laugh')
          .data(nested, d => d.key)
          .join(enter);

        $laugh.classed('is-noise', d => d.values[9].share < 0.1);

        $laugh.selectAll('path').attr('d', d => line(d.values));

        $laugh.each(d => {
          d3.select(`#text-path--${slugify(d.key)}`)
            .datum(d.values)
            .attr('d', line);
        });

        $laugh.select('text').attr('transform', d => {
          const y = d.key === 'lol' ? -STROKE_W_LOL : -STROKE_W;
          const x = 0;
          return `translate(${x},${y})`;
        });

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
