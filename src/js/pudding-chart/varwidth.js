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
    let sortType = 'usage';
    const marginTop = 0;
    const marginBottom = 0;
    const marginLeft = 0;
    const marginRight = 0;
    const borderSize = 0;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleBand();
    const scaleH = d3.scaleLinear();

    // dom elements
    let $vis = null;

    const DUR = 1000;
    const EASE = d3.easeCubicInOut;
    const MIN_H = 24;

    let animationDuration = 0;

    // helper functions
    function enter(sel) {
      const top = sortType === 'usage' ? `${-height}px` : `0px`;
      const $laugh = sel
        .append('li')
        .attr('class', d => `laugh family--${d.laughs[0].family}`)
        .style('top', top)
        .style('opacity', 0);

      const $div = $laugh
        .selectAll('div')
        .data(d => d.laughs, d => d.case)
        .join('div')
        .attr('class', d => d.case);

      const $p = $div.append('p');

      $p.append('span')
        .attr('class', 'label')
        .text(d => d.id);
      $p.append('span')
        .attr('class', 'share')
        .text(d => d3.format('.2%')(d.sumShare));

      return $laugh;
    }

    function exit(sel) {
      sel.each((d, i, n) => {
        const $laugh = d3.select(n[i]);
        const t = +$laugh.style('top').replace('px', '');
        // const h = +$laugh.style('height').replace('%', '');
        const top = sortType === 'usage' ? `${t - height}px` : `${t}px`;
        const left = sortType === 'usage' ? 0 : '-100%';
        const opacity = sortType === 'usage' ? 0 : 0;
        $laugh
          .transition()
          .duration(animationDuration * 0.67)
          .ease(EASE)
          .style('top', top)
          .style('left', left)
          .style('opacity', opacity)
          .remove();
      });
    }

    function showText(d) {
      const h = (d.sumCount / d.countTotal) * height;
      return h >= MIN_H;
    }

    function showStripe(d) {
      const h = (d.sumCount / d.countTotal) * height;
      return h >= MIN_H * 0.5;
    }

    function sort(a, b) {
      if (sortType === 'usage') return d3.descending(a.sumShare, b.sumShare);

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
        const borderTotal = borderSize * data.length;
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height =
          $sel.node().offsetHeight - marginTop - marginBottom - borderTotal;

        scaleX.range([0, width]);
        scaleY.range([0, height]);
        scaleH.range([0, width]);

        maxFontSize = Math.floor(width * 0.0825);

        return Chart;
      },
      // update scales and render chart
      render(shouldAnimate) {
        animationDuration = shouldAnimate ? DUR : 500;

        data.sort(sort);

        const countTotal = d3.sum(data, d => d.sumCount);

        // add y position
        let tallyH = 0;

        const dataPos = data.map((d, i) => {
          const h = Math.ceil((d.sumCount / countTotal) * height);
          const r = {
            ...d,
            countTotal,
            top: tallyH,
            height: h,
          };
          tallyH += h + (h >= 4 ? -4 : 0);
          return r;
        });

        const $laugh = $vis
          .selectAll('.laugh')
          .data(dataPos, d => d.id)
          .join(enter, u => u, exit);

        $laugh
          .classed('is-text', showText)
          .classed('is-stripe', showStripe)
          .transition()
          .duration(animationDuration)
          .ease(EASE)
          .delay(sortType === 'usage' ? 0 : animationDuration * 0.0)
          .style('top', d => `${d.top}px`)
          .style('height', d => `${d.height}px`)
          .style(
            'font-size',
            d =>
              `${Math.min(
                Math.floor((d.sumCount / d.countTotal) * height * 0.5),
                maxFontSize
              )}px`
          )
          .style('opacity', 1);

        $laugh
          .selectAll('div')
          .style('width', d => d3.format('.2%')(d.count / d.sumCount + 0.001));

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
      sort(val) {
        if (!arguments.length) return sortType;
        sortType = val;
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
