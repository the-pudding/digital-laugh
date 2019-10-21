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
    const marginTop = 24;
    const marginBottom = 24;
    const marginLeft = 24;
    const marginRight = 24;
    const tile = 'treemapBinary';

    // scales
    const scaleF = d3.scalePow().exponent(0.5);

    // dom elements
    let $svg = null;
    let $vis = null;

    const MIN_FONT_SIZE = 8;

    // helper functions

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg').attr('class', 'pudding-chart');
        const $g = $svg.append('g');

        // offset chart for margins
        $g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

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
        width = w - marginLeft - marginRight;
        height = h - marginTop - marginBottom;

        const maxF = Math.floor(sz * 0.125);
        const minF = Math.max(MIN_FONT_SIZE, Math.floor(maxF * 0.05));
        scaleF.domain(data.extent).range([minF, maxF]);

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

        $svg
          .style('width', `${width + marginLeft + marginRight}px`)
          .style('height', `${height + marginTop + marginBottom}px`);

        const $leafRect = $vis
          .selectAll('.leaf-rect')
          .data(root.leaves(), d => d.data.id)
          .join(enter => {
            const $g = enter.append('g');
            $g.append('rect');
            return $g;
          })
          .attr('transform', d => `translate(${d.x0},${d.y0})`)
          .attr('class', d => `leaf leaf-rect leaf--${d.data.family}`);

        $leafRect
          .select('rect')
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0);

        const $leafText = $vis
          .selectAll('.leaf-text')
          .data(root.leaves(), d => d.data.id)
          .join(enter => {
            const $g = enter.append('g');
            $g.append('text')
              .attr('class', 'text-id text-id--bg')
              .text(d => d.data.id)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'middle');

            $g.append('text')
              .attr('class', 'text-id text-id--fg')
              .text(d => d.data.id)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'middle');

            $g.append('text')
              .attr('class', 'text-share text-share--bg')
              .text(d => {
                const post = d.data.id === 'lol' ? ' of all laughs' : '';
                return `${d3.format('.1%')(d.data.share)}${post}`;
              })
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging');

            $g.append('text')
              .attr('class', 'text-share text-share--fg')
              .text(d => {
                const post = d.data.id === 'lol' ? ' of all laughs' : '';
                return `${d3.format('.1%')(d.data.share)}${post}`;
              })
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging');

            $g.append('text')
              .attr('class', 'text-count text-count--bg')
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging')
              .text(d => {
                const pre = d.data.id === 'lol' ? 'found in ' : '';
                const post = d.data.id === 'lol' ? ' comments' : '';
                return `${pre}${d3.format(',')(d.data.count)}${post}`;
              });

            $g.append('text')
              .attr('class', 'text-count text-count--fg')
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging')
              .text(d => {
                const pre = d.data.id === 'lol' ? 'found in ' : '';
                const post = d.data.id === 'lol' ? ' comments' : '';
                return `${pre}${d3.format(',')(d.data.count)}${post}`;
              });

            return $g;
          })
          .attr('transform', d => `translate(${d.x0},${d.y0})`)
          .attr('class', d => `leaf leaf-text leaf--${d.data.family}`);

        $leafText
          .select('.text-id--bg')
          .style('font-size', d => scaleF(d.data.share))
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .style('opacity', d => (d.data.share < 0.001 ? 0 : 1));

        $leafText
          .select('.text-id--fg')
          .style('font-size', d => scaleF(d.data.share))
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .style('opacity', d => (d.data.share < 0.001 ? 0 : 1));

        $leafText
          .select('.text-share--bg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + scaleF(d.data.share) * 0.5 + 4)
          .style('opacity', d => (d.data.share < 0.005 ? 0 : 1));

        $leafText
          .select('.text-share--fg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + scaleF(d.data.share) * 0.5 + 4)
          .style('opacity', d => (d.data.share < 0.005 ? 0 : 1));

        $leafText
          .select('.text-count--bg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + scaleF(d.data.share) * 0.5 + 20)
          .style('opacity', d => (d.data.share < 0.1 ? 0 : 1));

        $leafText
          .select('.text-count--fg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2 + scaleF(d.data.share) * 0.5 + 20)
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
