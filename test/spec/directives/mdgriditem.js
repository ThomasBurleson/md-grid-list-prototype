'use strict';

describe('Directive: mdGridItem', function () {

  // load the directive's module
  beforeEach(module('gridTestApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<md-grid-item></md-grid-item>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the mdGridItem directive');
  }));
});
