/* global d3 */

/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartVarWidth = function init(options) {
  function createChart(el) {
    const $sel = d3.select(el);
    let data = $sel.datum();
    // dimension stuff
    let width = 0;
    let height = 0;
    let maxFontSize = 0;
    const sortType = 'share';
    const marginTop = 0;
    const marginBottom = 0;
    const marginLeft = 0;
    const marginRight = 0;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleBand();
    const scaleH = d3.scaleLinear();

    // dom elements
    let $vis = null;

    const DUR = 1000;
    const EASE = d3.easeCubicInOut;
    const MIN_H = 12;

    // helper functions
    function enter(sel) {
      const $laugh = sel.append('li').attr('class', 'laugh');

      const $p = $laugh
        .selectAll('div')
        .data(d => d.laughs, d => d.case)
        .join('div')
        .attr('class', d => d.case);

      $p.append('span').text(d => d.id);

      return $laugh;
    }

    function exit(sel) {
      sel.each((d, i, n) => {
        const $laugh = d3.select(n[i]);
        const t = +$laugh.style('top').replace('%', '');
        // const h = +$laugh.style('height').replace('%', '');
        const top = sortType === 'share' ? `${t - 100}%` : `${t}%`;
        const left = sortType === 'share' ? 0 : '-100%';
        const opacity = sortType === 'share' ? 0 : 1;
        $laugh
          .transition()
          .duration(DUR * 0.67)
          .ease(EASE)
          .style('top', top)
          .style('left', left)
          .style('opacity', opacity)
          .remove();
      });
    }

    function tallEnough(d) {
      const h = (d.sumCount / d.countTotal) * height;
      return h >= MIN_H;
    }

    function sort(a, b) {
      if (sortType === 'share') return d3.descending(a.sumShare, b.sumShare);

      return d3.descending(
        a.laughs[0].share / a.laughs[0].sumShare,
        b.laughs[0].share / b.laughs[0].sumShare
      );
    }

    const Chart = {
      // called once at start
      init() {
        $vis = $sel.append('ul');

        Chart.resize();
        Chart.render();
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height = $sel.node().offsetHeight - marginTop - marginBottom;

        scaleX.range([0, width]);
        scaleY.range([0, height]);
        scaleH.range([0, width]);

        maxFontSize = Math.floor(width * 0.125);

        return Chart;
      },
      // update scales and render chart
      render() {
        data.sort(sort);

        const countTotal = d3.sum(data, d => d.sumCount);

        // add y position
        let tally = 0;

        const dataPos = data.map(d => {
          const r = {
            ...d,
            countTotal,
            top: tally,
          };
          tally += d.sumCount / countTotal;
          return r;
        });

        const $laugh = $vis
          .selectAll('.laugh')
          .data(dataPos, d => d.id)
          .join(enter, u => u, exit);

        $laugh
          .classed('is-visible', tallEnough)
          .transition()
          .duration(DUR)
          .ease(EASE)
          .delay(sortType === 'share' ? 0 : DUR * 0.5)
          .style('top', d => d3.format('%')(d.top))
          .style('height', d => d3.format('%')(d.sumCount / d.countTotal))
          .style(
            'font-size',
            d =>
              `${Math.min(
                Math.floor((d.sumCount / d.countTotal) * height * 0.5),
                maxFontSize
              )}px`
          );

        $laugh
          .selectAll('div')
          .style('width', d => d3.format('%')(d.count / d.sumCount));

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
