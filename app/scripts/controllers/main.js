'use strict';

/**
 * @ngdoc function
 * @name gridTestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gridTestApp
 */
angular.module('gridTestApp')
  .controller('MainCtrl', function($scope) {
    this.actionInvoked = function(type) {
      console.log('primary', type);
    };

    this.secondaryActionInvoked = function(type) {
      console.log('secondary', type);
    };
  });
