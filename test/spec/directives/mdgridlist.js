'use strict';

describe('Directive: mdGridList', function () {

  // load the directive's module
  beforeEach(module('gridTestApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<md-grid-list></md-grid-list>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the mdGridList directive');
  }));
});
