'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridTile
 * @description
 * # mdGridItem
 */
angular.module('gridTestApp')
  .directive('mdGridTile', function() {
    return {
      restrict: 'E',
      require: '^mdGridList',
      scope: {
        onAction: '&mdOnAction',
        onSecondaryAction: '&mdOnSecondaryAction'
      },
      template: '<figure ng-transclude></figure>',
      transclude: true,
      link: function postLink(scope, element, attrs, gridCtrl) {
        // Apply semantics
        element.attr('role', 'listitem');

        var secondaryContainer = element[0].querySelector('figcaption');

        element.on('click', function(e) {
          scope.$apply(function() {
            // TODO(shyndman) - Replace this with a more appropriate descendent
            // test
            if (e.target == secondaryContainer ||
                e.target.parentNode == secondaryContainer) {
              scope.onSecondaryAction({$event: e});
            } else {
              scope.onAction({$event: e});
            }
          });
        });

        // Invalidate grid when tiles are added or removed
        var layoutFn = angular.bind(gridCtrl, gridCtrl.invalidateLayout);
        layoutFn(); // initial layout
        scope.$on('$destroy', layoutFn);

        // If our colspan or rowspan changes, trigger a layout
        attrs.$observe('colspan', layoutFn);
        attrs.$observe('rowspan', layoutFn);
      }
    };
  });
