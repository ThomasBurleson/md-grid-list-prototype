'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridItem
 * @description
 * # mdGridItem
 */
angular.module('gridTestApp')
  .directive('mdGridItem', function() {
    return {
      template: '<div></div>',
      restrict: 'E',
      require: '^mdGridList',
      link: function postLink(scope, element, attrs, gridCtrl) {

      }
    };
  });
