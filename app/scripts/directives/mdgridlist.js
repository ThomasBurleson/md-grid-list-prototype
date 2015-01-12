(function() {
'use strict';

function MdGridListController($timeout) {
  this.invalidated = false;
  this.$timeout_ = $timeout;
  this.renderDelegate;
}

MdGridListController.prototype.invalidate = function(tile) {
  if (this.invalidated) {
    return;
  }
  this.invalidated = true;
  this.$timeout_(angular.bind(this, this.render));
};

MdGridListController.prototype.render = function() {
  try {
    this.renderDelegate();
  } finally {
    this.invalidated = false;
  }
};

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridList
 * @description
 * # mdGridList
 */
angular.module('gridTestApp')
  .directive('mdGridList', function() {
    return {
      restrict: 'E',
      controller: MdGridListController,
      link: function postLink(scope, element, attrs, ctrl) {
        element.prepend('<div class="grid-sizer"></div>')

        var mason = new Masonry(element[0], {
          columnWidth: '.grid-sizer',
          itemSelector: 'md-grid-tile',
          transitionDuration: 0
        });

        ctrl.renderDelegate = function() {
          mason.layout();
        };
      }
    };
  });

})();