/* global d3 */

/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartTreeMap = function init(options) {
  function createChart(el) {
    const $sel = d3.select(el);
    let data = $sel.datum();
    // dimension stuff
    let width = 0;
    let height = 0;
    const marginTop = 16;
    const marginBottom = 16;
    const marginLeft = 16;
    const marginRight = 16;
    const tile = 'treemapBinary';

    // scales
    const scaleX = null;
    const scaleY = null;

    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;

    const MIN_VIS = 0.002;

    // helper functions

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
        const w = $sel.node().offsetWidth;
        const h = $sel.node().offsetHeight;
        const sz = Math.min(w, h);
        width = sz - marginLeft - marginRight;
        height = sz - marginTop - marginBottom;
        console.log({ width, height });
        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);
        return Chart;
      },
      // update scales and render chart
      render() {
        const treemap = d3
          .treemap()
          .tile(d3[tile])
          .size([width, height])
          .padding(0)
          .round(true);

        const hiearchy = d3
          .hierarchy(data)
          .sum(d => d.count)
          .sort((a, b) => b.count - a.count);

        const root = treemap(hiearchy);

        const font = d3
          .scalePow()
          .exponent(0.5)
          .domain(data.extent)
          .range([12, 64]);

        $svg
          .style('width', `${width + marginLeft + marginRight}px`)
          .style('height', `${height + marginTop + marginBottom}px`);

        const $leaf = $vis
          .selectAll('g')
          .data(root.leaves())
          .join('g')
          .attr('transform', d => `translate(${d.x0},${d.y0})`)
          .attr('class', d => `leaf leaf--${d.data.family}`);

        $leaf
          .append('rect')
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0);

        $leaf
          .append('text')
          .attr('class', 'text-id text-id--bg')
          .text(d => d.data.id)
          .style('font-size', d => font(d.data.share))
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .style('opacity', d => (d.data.share < MIN_VIS ? 0 : 1));

        $leaf
          .append('text')
          .attr('class', 'text-id text-id--fg')
          .text(d => d.data.id)
          .style('font-size', d => font(d.data.share))
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .style('opacity', d => (d.data.share < MIN_VIS ? 0 : 1));

        $leaf
          .append('text')
          .attr('class', 'text-share')
          .text(d => d3.format('.1%')(d.data.share))
          .style('font-size', '12px')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + font(d.data.share))
          .style('opacity', d => (d.data.share < MIN_VIS ? 0 : 1));

        $leaf
          .append('text')
          .attr('class', 'text-count')
          .text(d => d3.format(',')(d.data.count))
          .style('font-size', '12px')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + font(d.data.share) + 16)
          .style('opacity', d => (d.data.share < 0.1 ? 0 : 1));

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
