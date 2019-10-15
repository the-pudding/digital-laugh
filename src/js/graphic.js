/* global d3 */
import Share from './part-share';
import Lol from './part-lol';
import Rank from './part-rank';
import Review from './part-review';

function resize() {
  Share.resize();
  Lol.resize();
  Rank.resize();
  Review.resize();
}

function init() {
  Share.init();
  Lol.init();
  Rank.init();
  Review.init();
}

export default { init, resize };
