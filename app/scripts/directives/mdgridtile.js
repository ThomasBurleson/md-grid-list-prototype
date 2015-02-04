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
        // TODO(shyndman): Accessing ng-repeat scope is kind of ugly...maybe
        //    we should determine insertion position based on a DOM check?
        gridCtrl.addTile(attrs, scope.$parent.$index);
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
