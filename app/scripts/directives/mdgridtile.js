'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridTile
 * @description
 * # mdGridItem
 */
angular.module('gridTestApp')
  .directive('mdGridTile', function($mdUtil) {
    return {
      restrict: 'E',
      require: '^mdGridList',
      scope: {},
      template: '<figure ng-transclude></figure>',
      transclude: true,
      link: function postLink(scope, element, attrs, gridCtrl) {
        // Apply semantics
        element.attr('role', 'listitem');

        // Tile registration/deregistration
        // FIXME(shyndman): This will only handle appends. We need to consider
        //    inserts as well.
        gridCtrl.addTile(attrs);
        scope.$on('$destroy', destroy);

        // If our colspan or rowspan changes, trigger a layout
        var unwatchAttrs = $mdUtil.watchResponsiveAttributes(
            ['colspan', 'rowspan'], attrs,
            angular.bind(gridCtrl, gridCtrl.invalidateLayout));

        function destroy() {
          unwatchAttrs();
          gridCtrl.removeTile(attrs);
        }
      }
    };
  });
