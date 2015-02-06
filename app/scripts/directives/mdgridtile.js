'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridTile
 * @description
 * # mdGridItem
 */
angular.module('gridTestApp')
  .directive('mdGridTile', function($mdMedia) {
    return {
      restrict: 'E',
      require: '^mdGridList',
      template: '<figure ng-transclude></figure>',
      transclude: true,
      link: function postLink(scope, element, attrs, gridCtrl) {
        // Apply semantics
        element.attr('role', 'listitem');

        // Tile registration/deregistration
        // TODO(shyndman): Kind of gross to access parent scope like this.
        //    Consider other options.
        gridCtrl.addTile(attrs, scope.$parent.$index);
        scope.$on('$destroy', function() {
          unwatchAttrs();
          gridCtrl.removeTile(attrs);
        });

        // If our colspan or rowspan changes, trigger a layout
        var unwatchAttrs = $mdMedia.watchResponsiveAttributes(
            ['colspan', 'rowspan'], attrs,
            angular.bind(gridCtrl, gridCtrl.invalidateLayout));
      }
    };
  });
