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
      template: '<md-grid-tile-content ng-transclude></md-grid-tile-content>',
      transclude: true,
      link: function postLink(scope, element, attrs, gridCtrl) {
        var secondaryContainer = element[0].querySelector('header, footer');

        element.on('click', function(e) {
          // TODO(shyndman) - Replace this with a more appropriate descendent
          // test
          if (e.target == secondaryContainer ||
              e.target.parentNode == secondaryContainer) {
            scope.onSecondaryAction({$event: e});
          } else {
            scope.onAction({$event: e});
          }
        });

        // Invalidate grid when tiles are added or removed
        gridCtrl.invalidate();
        scope.$on('$destroy', function() {
          gridCtrl.invalidate();
        });
      }
    };
  });
