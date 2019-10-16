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
    const marginTop = 0;
    const marginBottom = 0;
    const marginLeft = 0;
    const marginRight = 0;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleBand();
    const scaleH = d3.scaleLinear();

    // dom elements
    const $svg = null;
    const $axis = null;
    let $vis = null;
    const $ul = null;

    // helper functions
    function enter(sel) {
      const $laugh = sel.append('li').attr('class', 'laugh');

      const $p = $laugh
        .selectAll('p')
        .data(d => d.laughs, d => d.case)
        .join('p')
        .attr('class', d => d.case);

      $p.append('span').text(d => d.id);

      return $laugh;
    }

    const Chart = {
      // called once at start
      init() {
        // $svg = $sel.append('svg').attr('class', 'pudding-chart');
        // const $g = $svg.append('g');

        // // offset chart for margins
        // $g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        // // create axis
        // $axis = $svg.append('g').attr('class', 'g-axis');

        // // setup viz group
        // $vis = $g.append('g').attr('class', 'g-vis');

        // $vis
        //   .selectAll('g')
        //   .data(data)
        //   .join(enter);

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

        // $svg
        //   .attr('width', width + marginLeft + marginRight)
        //   .attr('height', height + marginTop + marginBottom);
        return Chart;
      },
      // update scales and render chart
      render() {
        // data.sort((a, b) =>
        //   d3.descending(
        //     a.laughs[0].share / a.laughs[0].sumShare,
        //     b.laughs[0].share / b.laughs[0].sumShare
        //   )
        // );

        console.log(data);
        const $laugh = $vis
          .selectAll('.laugh')
          .data(data, d => d.id)
          .join(enter);

        const countTotal = d3.sum(data, d => d.sumCount);

        $laugh.style('height', d => d3.format('%')(d.sumCount / countTotal));

        $laugh
          .selectAll('p')
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
