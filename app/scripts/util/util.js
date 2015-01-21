(function() {
'use strict';

angular.module('gridTestApp')
    .factory('$mdConstants', mdConstantFactory)
    .factory('$mdMedia', mdMediaFactory)
    .factory('$mdUtil', mdUtilFactory);


function mdConstantFactory() {
  return {
    MEDIA: {
      'sm': '(max-width: 600px)',
      'gt-sm': '(min-width: 600px)',
      'md': '(min-width: 600px) and (max-width: 960px)',
      'gt-md': '(min-width: 960px)',
      'lg': '(min-width: 960px) and (max-width: 1200px)',
      'gt-lg': '(min-width: 1200px)'
    },
    MEDIA_PRIORITY: [
      'gt-lg',
      'lg',
      'gt-md',
      'md',
      'gt-sm',
      'sm'
    ]
  };
}


function mdMediaFactory($mdConstants, $window) {
  return {
    queries: buildQueries()
  };

  function buildQueries() {
    var queries = {};
    Object.keys($mdConstants.MEDIA).forEach(function(k) {
      queries[k] = $window.matchMedia($mdConstants.MEDIA[k]);
    });
    return queries;
  }
}


function mdUtilFactory($mdConstants, $mdMedia) {
  return {
    watchResponsiveAttributes: watchResponsiveAttributes,
    getResponsiveAttribute: getResponsiveAttribute
  };

  function getResponsiveAttribute(attrs, attrName) {
    for (var i = 0; i < $mdConstants.MEDIA_PRIORITY.length; i++) {
      var mediaName = $mdConstants.MEDIA_PRIORITY[i];
      if (!$mdMedia.queries[mediaName].matches) {
        continue;
      }

      var normalizedName = attrs.$normalize(mediaName + '-' + attrName);
      if (attrs[normalizedName]) {
        return attrs[normalizedName];
      }
    }

    // fallback on unprefixed
    return attrs[attrs.$normalize(attrName)];
  }

  function watchResponsiveAttributes(attrNames, attrs, watchFn) {
    var unwatchFns = [];
    attrNames.forEach(function(attrName) {
      var normalizedName = attrs.$normalize(attrName);
      if (attrs[normalizedName]) {
        unwatchFns.push(
            attrs.$observe(normalizedName, angular.bind(void 0, watchFn, null)));
      }

      for (var mediaName in $mdConstants.MEDIA) {
        normalizedName = attrs.$normalize(mediaName + '-' + attrName);
        if (!attrs[normalizedName]) {
          return;
        }

        unwatchFns.push(
            attrs.$observe(
                normalizedName, angular.bind(void 0, watchFn, mediaName)));
      }
    });

    return function unwatch() {
      unwatchFns.forEach(function(fn) { fn(); })
    };
  }
}

})();
