'use strict';

/**
 * @ngdoc function
 * @name gridTestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gridTestApp
 */
angular.module('gridTestApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
