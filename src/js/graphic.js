/* global d3 */
import Share from './part-share';
import Lol from './part-lol';
import Rank from './part-rank';

function resize() {
  Share.resize();
  Lol.resize();
  Rank.resize();
}

function init() {
  Share.init();
  Lol.init();
  Rank.init();
}

export default { init, resize };
