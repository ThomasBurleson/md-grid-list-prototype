(function() {
'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridList
 * @description
 * # mdGridList
 */
angular.module('gridTestApp')
  .directive('mdGridList', function(
      $$mdGridLayout, $interpolate, $mdConstants, $mdMedia, $mdUtil) {
    return {
      restrict: 'E',
      controller: MdGridListController,
      scope: {
        onLayout: '&'
      },
      link: function postLink(scope, element, attrs, ctrl) {
        element.attr('role', 'list'); // Apply semantics

        var invalidateLayout = angular.bind(ctrl, ctrl.invalidateLayout);
        var unwatchAttrs = watchMedia();
        scope.$on('$destroy', angular.bind(this, unwatchMedia, unwatchAttrs));

        /**
         * Watches for changes in media, invalidating layout as necessary.
         */
        function watchMedia() {
          for (var mediaName in $mdConstants.MEDIA) {
            $mdMedia.queries[mediaName].addListener(invalidateLayout);
          }
          return $mdUtil.watchResponsiveAttributes(
              ['cols', 'row-height'], attrs, layoutIfMediaMatch);;
        }

        function unwatchMedia(unwatchAttrs) {
          unwatchAttrs();
          for (var mediaName in $mdConstants.MEDIA) {
            $mdMedia.queries[mediaName].removeListener(invalidateLayout);
          }
        }

        /**
         * Performs grid layout if the provided mediaName matches the currently
         * active media type.
         */
        function layoutIfMediaMatch(mediaName) {
          if (mediaName == null) {
            // TODO(shyndman): It would be nice to only layout if we have
            // instances of attributes using this media type
            ctrl.invalidateLayout();
          } else if ($mdMedia.queries[mediaName].matches) {
            ctrl.invalidateLayout();
          }
        }

        /**
         * Invokes the layout engine, and uses its results to lay out our
         * tile elements.
         */
        ctrl.layoutDelegate = function() {
          var tiles = getTileElements();
          var colCount = getColumnCount();
          var rowMode = getRowMode();
          var rowHeight = getRowHeight();
          var gutter = getGutter();
          var performance =
              $$mdGridLayout(colCount, getTileSpans(), getTileElements())
                  .map(function(ps, rowCount, i) {
                    var element = angular.element(tiles[i]);
                    element.scope().$mdGridPosition = ps; // for debugging

                    // TODO(shyndman): There are style caching opportunities
                    //    here.
                    return {
                      element: element,
                      styles: getStyles(ps.position, ps.spans,
                          colCount, rowCount,
                          gutter, rowMode, rowHeight)
                    }
                  })
                  .reflow()
                  .performance();

          // Report layout
          scope.onLayout({
            $event: {
              performance: performance
            }
          });
        };

        var UNIT = $interpolate(
            "{{ share }}% - {{ gutterShare }}px");
        var POSITION = $interpolate(
            "calc(({{ unit }}) * {{ offset }} + {{ gutter }}px)");
        var DIMENSION = $interpolate(
            "calc(({{ unit }}) * {{ span }} + {{ gutter }}px)");

        // TODO(shyndman): Replace args with a ctx object.
        function getStyles(position, spans, colCount, rowCount, gutter, rowMode, rowHeight) {
          var hShare = (1 / colCount) * 100;
          var hGutterShare = colCount === 1 ? 0 : gutter * (colCount - 1) / colCount;
          var hUnit = UNIT({ share: hShare, gutterShare: hGutterShare });
          var left = POSITION({ unit: hUnit, offset: position.col,
              gutter: position.col * gutter });
          var width = DIMENSION({ unit: hUnit, span: spans.col,
              gutter: (spans.col - 1) * gutter });

          var style = {
            width: width,
            left: left,
            // resets
            paddingTop: '',
            marginTop: '',
            top: '',
            height: ''
          };

          switch (rowMode) {
            case 'fixed':
              style['top'] = (position.row * rowHeight) + (position.row * gutter) + 'px';
              style['height'] = spans.row * rowHeight + 'px';
              break;

            case 'ratio':
              // rowHeight is width / height
              var vShare = hShare * (1 / rowHeight);
              var vUnit = UNIT({ share: vShare, gutterShare: hGutterShare });
              var marginTop = POSITION({ unit: vUnit, offset: position.row,
                  gutter: position.row * gutter });
              var paddingTop = DIMENSION({ unit: vUnit, span: spans.row,
                  gutter: (spans.row - 1) * gutter});

              style['paddingTop'] = paddingTop;
              style['marginTop'] = marginTop;
              break;

            case 'fit':
              var vGutterShare = rowCount === 1 ? 0 : (gutter * (rowCount - 1) / rowCount);
              var vShare = (1 / rowCount) * 100;
              var vUnit = UNIT({ share: vShare, gutterShare: vGutterShare });
              var top = POSITION({ unit: vUnit, offset: position.row,
                  gutter: position.row * gutter });
              var height = DIMENSION({ unit: vUnit, span: spans.row,
                  gutter: (spans.row - 1) * gutter });

              style['top'] = top;
              style['height'] = height;
              break;
          }

          return style;
        }

        function getTileElements() {
          return element[0].querySelectorAll('md-grid-tile');
        }

        function getTileSpans() {
          return ctrl.tiles.map(function(tileAttrs) {
            return {
              row: parseInt(
                  $mdUtil.getResponsiveAttribute(tileAttrs, 'rowspan'), 10) || 1,
              col: parseInt(
                  $mdUtil.getResponsiveAttribute(tileAttrs, 'colspan'), 10) || 1
            };
          });
        }

        function getColumnCount() {
          return parseInt($mdUtil.getResponsiveAttribute(attrs, 'cols'), 10);
        }

        function getGutter() {
          return parseInt($mdUtil.getResponsiveAttribute(attrs, 'gutter'), 10);
        }

        function getRowHeight() {
          var rowHeight = $mdUtil.getResponsiveAttribute(attrs, 'row-height');
          switch (getRowMode()) {
            case 'fixed':
              return parseInt(rowHeight, 10);
            case 'ratio':
              var whRatio = rowHeight.split(':');
              return parseFloat(whRatio[0]) / parseFloat(whRatio[1]);
            case 'fit':
              return 0; // N/A
          }
        }

        function getRowMode() {
          var rowHeight = $mdUtil.getResponsiveAttribute(attrs, 'row-height');
          if (rowHeight == 'fit') {
            return 'fit';
          } else if (rowHeight.indexOf(':') !== -1) {
            return 'ratio';
          } else {
            return 'fixed';
          }
        }
      }
    };
  })
  .factory('$$mdGridLayout', function($mdUtil) {
    return function(colCount, tileSpans) {
      var self, layoutInfo, tiles, layoutTime, mapTime, reflowTime, layoutInfo;
      layoutTime = $mdUtil.time(function() {
        layoutInfo = calculateGridFor(colCount, tileSpans);
      });

      return self = {
        /**
         * An array of objects describing each tile's position in the grid.
         */
        layoutInfo: function() {
          return layoutInfo;
        },

        /**
         * Maps grid positioning to an element and a set of styles using the
         * provided updateFn.
         */
        map: function(updateFn) {
          mapTime = $mdUtil.time(function() {
            tiles = layoutInfo.positioning.map(function(ps, i) {
              return updateFn(ps, self.layoutInfo().rowCount, i);
            });
          });
          return self;
        },

        /**
         * Default animator simply sets the element.css( <styles> ).
         * Use the $$mdGridLayoutProvider to decorate the animator callback if
         * alternate animation scenarios are desired.
         */
        reflow: function(customAnimatorFn) {
          reflowTime = $mdUtil.time(function() {
            var animator = customAnimatorFn || defaultAnimator;
            tiles.forEach(function(it) {
              animator(it.element, it.styles);
            });
          });
          return self;
        },

        /**
         * Timing for the most recent layout run.
         */
        performance: function() {
          return {
            tileCount: tileSpans.length,
            layoutTime: layoutTime,
            mapTime: mapTime,
            reflowTime: reflowTime,
            totalTime: layoutTime + mapTime + reflowTime
          };
        }
      };
    };

    function defaultAnimator(element, styles) {
      element.css(styles);
    };

    /**
     * Calculates the positions of tiles.
     *
     * The algorithm works as follows:
     *    An Array<Number> with length columnCount (spaceTracker) keeps track of
     *    available tiling positions, where elements of value 0 represents an
     *    empty position. Space for a tile is reserved by finding a sequence of
     *    0s with length <= than the tile's colspan. When such a space has been
     *    found, the occupied tile positions are incremented by the tile's
     *    rowspan value, as those positions have become unavailable for that
     *    many rows.
     *
     *    If the end of a row has been reached without finding space for the
     *    tile, spaceTracker's elements are each decremented by 1 to a minimum
     *    of 0. Rows are searched in this fashion until space is found.
     */
    function calculateGridFor(colCount, tileSpans) {
      var curCol = 0;
      var curRow = 0;
      var spaceTracker = newSpaceTracker();

      return {
        positioning: tileSpans.map(function(spans, i) {
          return {
            spans: spans,
            position: reserveSpace(spans, i)
          };
        }),
        rowCount: curRow + Math.max.apply(Math, spaceTracker)
      };

      function reserveSpace(spans, i) {
        if (spans.col > colCount) {
          throw 'md-grid-list: Tile at position ' + i + ' has a colspan ' +
              '(' + spans.col + ') that exceeds the column count ' +
              '(' + colCount + ')';
        }

        var start = 0
        var end = 0;

        // TODO(shyndman): This loop isn't strictly necessary if you can
        // determine the minimum number of rows before a space opens up. To do
        // this, recognize that you've iterated across an entire row looking for
        // space, and if so fast-forward by the minimum rowSpan count. Repeat
        // until the required space opens up.
        while (end - start < spans.col) {
          if (curCol >= colCount) {
            nextRow();
            continue;
          }

          start = spaceTracker.indexOf(0, curCol);
          if (start === -1 || (end = findEnd(start + 1)) === -1) {
            start = end = 0;
            nextRow();
            continue;
          }

          curCol = end + 1;
        }

        adjustRow(start, spans.col, spans.row);
        curCol = start + spans.col;

        return {
          col: start,
          row: curRow
        };
      }

      function nextRow() {
        curCol = 0;
        curRow++;
        adjustRow(0, colCount, -1); // Decrement row spans by one
      }

      function adjustRow(from, cols, by) {
        for (var i = from; i < from + cols; i++) {
          spaceTracker[i] = Math.max(spaceTracker[i] + by, 0);
        }
      }

      function findEnd(start) {
        var i;
        for (i = start; i < spaceTracker.length; i++) {
          if (spaceTracker[i] !== 0) {
            return i;
          }
        }

        if (i === spaceTracker.length) {
          return i;
        }
      }

      function newSpaceTracker() {
        var tracker = [];
        for (var i = 0; i < colCount; i++) {
          tracker.push(0);
        }
        return tracker;
      }
    }
  });


  // Grid controller

  function MdGridListController($timeout) {
    this.invalidated = false;
    this.$timeout_ = $timeout;
    this.tiles = [];
    this.layoutDelegate;
  }

  MdGridListController.prototype.addTile = function(tileAttrs, idx) {
    if (angular.isUndefined(idx)) {
      this.tiles.push(tileAttrs);
    } else {
      this.tiles.splice(idx, 0, tileAttrs);
    }
    this.invalidateLayout();
  };

  MdGridListController.prototype.removeTile = function(tileAttrs) {
    var idx = this.tiles.indexOf(tileAttrs);
    if (idx === -1) {
      return;
    }
    this.tiles.splice(idx, 1);
    this.invalidateLayout();
  };

  MdGridListController.prototype.invalidateLayout = function(tile) {
    if (this.invalidated) {
      return;
    }
    this.invalidated = true;
    this.$timeout_(angular.bind(this, this.layout));
  };

  MdGridListController.prototype.layout = function() {
    try {
      this.layoutDelegate();
    } finally {
      this.invalidated = false;
    }
  };
})();