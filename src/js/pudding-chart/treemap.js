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
    let marginTop = 24;
    let marginBottom = 24;
    let marginLeft = 32;
    let marginRight = 32;
    const tile = 'treemapBinary';
    const customHide = [
      { w: 640, laughs: ['hahah', 'jaja'] },
      {
        w: 0,
        laughs: ['haahahha', 'ha', 'ha ha', 'hahah', 'hehehe', 'jaja'],
      },
    ];

    // scales
    const scaleF = d3.scalePow().exponent(0.5);

    // dom elements
    let $svg = null;
    let $vis = null;

    const MIN_FONT_SIZE = 10;
    const isTouch = d3.select('body').classed('is-mobile');

    // helper functions
    function resetTextOpacity() {
      $vis
        .selectAll('.leaf-text text')
        .style('opacity', (v, i, n) => d3.select(n[i]).attr('data-opacity'));
    }

    function handleRectEnter(d) {
      $vis.selectAll('.leaf-rect').classed('is-hidden', true);
      d3.select(this).classed('is-hidden', false);

      $vis
        .selectAll('.leaf-text')
        .classed('is-hidden', v => v.data.id !== d.data.id)
        .each((v, i, n) => {
          const $t = d3.select(n[i]);
          if (v.data.id === d.data.id) {
            $t.selectAll('.text-id').style('opacity', 1);
            if (v.data.sumShare >= 0.001)
              $t.selectAll('.text-share').style('opacity', 1);
            if (v.data.sumShare >= 0.005)
              $t.selectAll('.text-count').style('opacity', 1);
          }
        });
    }

    function handleRectOut() {
      resetTextOpacity();
      $vis.selectAll('.leaf').classed('is-hidden', false);
    }

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg').attr('class', 'pudding-chart');
        const $g = $svg.append('g');

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

        const maxF = Math.floor(sz * 0.125);
        const minF = Math.max(MIN_FONT_SIZE, Math.floor(maxF * 0.05));
        marginTop = Math.min(24, minF * 2);
        marginLeft = Math.min(24, minF * 2);
        marginBottom = Math.min(24, minF * 2);
        marginRight = Math.min(24, minF * 2);

        scaleF.domain(data.extent).range([minF, maxF]);

        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        return Chart;
      },
      // update scales and render chart
      render() {
        // offset chart for margins
        $svg
          .select('g')
          .attr('transform', `translate(${marginLeft}, ${marginTop})`);

        const treemap = d3
          .treemap()
          .tile(d3[tile])
          .size([width, height])
          .padding(0)
          .round(true);

        const hiearchy = d3
          .hierarchy(data)
          .sum(d => d.sumCount)
          .sort((a, b) => b.sumCount - a.sumCount);

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

        if (!isTouch)
          $leafRect
            .on('mouseenter', handleRectEnter)
            .on('mouseout', handleRectOut);

        $leafRect
          .select('rect')
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0);

        const hideB = customHide.find(d => width >= d.w).laughs;

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
                const pre = d.data.id === 'lol' ? 'laugh share: ' : '';
                return `${pre}${d3.format('.1%')(d.data.sumShare)}`;
              })
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging');

            $g.append('text')
              .attr('class', 'text-share text-share--fg')
              .text(d => {
                const pre = d.data.id === 'lol' ? 'laugh share: ' : '';
                return `${pre}${d3.format('.1%')(d.data.sumShare)}`;
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
                return `${pre}${d3.format(',')(d.data.sumCount)}${post}`;
              });

            $g.append('text')
              .attr('class', 'text-count text-count--fg')
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'hanging')
              .text(d => {
                const pre = d.data.id === 'lol' ? 'found in ' : '';
                const post = d.data.id === 'lol' ? ' comments' : '';
                return `${pre}${d3.format(',')(d.data.sumCount)}${post}`;
              });

            return $g;
          })
          .attr('transform', d => `translate(${d.x0},${d.y0})`)
          .attr('class', d => `leaf leaf-text leaf--${d.data.family}`);

        $leafText
          .select('.text-id--bg')
          .style('font-size', d => `${Math.floor(scaleF(d.data.sumShare))}px`)
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.001 ? 0 : 1
          );

        $leafText
          .select('.text-id--fg')
          .style('font-size', d => `${Math.floor(scaleF(d.data.sumShare))}px`)
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.001 ? 0 : 1
          );

        $leafText
          .select('.text-share--bg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr(
            'y',
            d =>
              (d.y1 - d.y0) / 2 + Math.floor(scaleF(d.data.sumShare) * 0.5 + 4)
          )
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.005 ? 0 : 1
          );

        $leafText
          .select('.text-share--fg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr(
            'y',
            d =>
              (d.y1 - d.y0) / 2 + Math.floor(scaleF(d.data.sumShare) * 0.5 + 4)
          )
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.005 ? 0 : 1
          );

        $leafText
          .select('.text-count--bg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr(
            'y',
            d =>
              (d.y1 - d.y0) / 2 + Math.floor(scaleF(d.data.sumShare) * 0.5 + 20)
          )
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.1 ? 0 : 1
          );

        $leafText
          .select('.text-count--fg')
          .style('font-size', '12px')
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr(
            'y',
            d =>
              (d.y1 - d.y0) / 2 + Math.floor(scaleF(d.data.sumShare) * 0.5 + 20)
          )
          .attr('data-opacity', d =>
            hideB.includes(d.data.id) ? 0 : d.data.sumShare < 0.1 ? 0 : 1
          );

        resetTextOpacity();

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
