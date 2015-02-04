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
      $$mdGridLayout, $mdCalc, $mdConstants, $mdMedia, $mdUtil) {
    var c = $mdCalc;

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
            // TODO(shyndman): It would be nice to only layout if we have
            // instances of attributes using this media type
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
          var layoutTime;
          var totalTime =
              $mdUtil.time(function() {
                var layoutInfo;
                layoutTime = $mdUtil.time(function() {
                  layoutInfo = $$mdGridLayout({
                    tileSpans: getTileSpans(),
                    colCount: colCount
                  });
                });
                layoutInfo.positioning.forEach(function(ps, i) {
                  angular.element(tiles[i]).css(
                    getStyles(ps.position, ps.spans,
                        colCount, layoutInfo.rowCount,
                        gutter, rowMode, rowHeight));
                });
              });

          // Report layout
          scope.onLayout({
            $event: {
              performance: {
                tileCount: ctrl.tiles.length,
                totalTime: totalTime,
                layoutTime: layoutTime,
                domTime: totalTime - layoutTime
              }
            }
          });
        };

        function getStyles(position, spans, colCount, rowCount, gutter, rowMode, rowHeight) {
          var colPercentWidth = (1 / colCount) * 100;
          var colGutterStep = colCount == 1 ? 0 : (gutter * (colCount - 1) / colCount);

          // Ugh, makes you wish for operator overloading
          var unitWidth = c.subtract(
              c.percent(colPercentWidth),
              c.px(colGutterStep));
          var left = c.add(
              c.mult(position.col, unitWidth),
              c.px(position.col * gutter));
          var width = c.add(
              c.subtract(
                c.percent(spans.col * colPercentWidth),
                c.px(spans.col * colGutterStep)
              ),
              c.px((spans.col - 1) * gutter));

          var style = {
            // shared styles between row modes
            width: c.calc(width),
            left: c.calc(left),
            // resets
            paddingTop: '',
            marginTop: '',
            top: '',
            height: ''
          };

          switch (rowMode) {
            case 'fixed':
              style['top'] = c.px((position.row * rowHeight) + (position.row * gutter));
              style['height'] = c.px(spans.row * rowHeight);
              break;

            case 'ratio':
              var rowPercentHeight = colPercentWidth * (1 / rowHeight);
              var unitHeight = c.subtract(
                  c.percent(rowPercentHeight),
                  c.px(colGutterStep));
              var paddingTop = c.add(
                  c.subtract(
                    c.percent(spans.row * rowPercentHeight),
                    c.px(spans.row * colGutterStep)
                  ),
                  c.px((spans.row - 1) * gutter));
              var marginTop = c.add(
                  c.mult(position.row, unitHeight),
                  c.px(position.row * gutter));

              style['paddingTop'] = c.calc(paddingTop);
              style['marginTop'] = c.calc(marginTop);
              break;

            case 'fit':
              var rowGutterStep = rowCount == 1 ? 0 : (gutter * (rowCount - 1) / rowCount);
              var rowPercentWidth = (1 / rowCount) * 100;
              var unitHeight = c.subtract(
                  c.percent(rowPercentWidth),
                  c.px(rowGutterStep));
              var top = c.add(
                  c.mult(position.row, unitHeight),
                  c.px(position.row * gutter));
              var height = c.add(
                  c.subtract(
                    c.percent(spans.row * rowPercentWidth),
                    c.px(spans.row * rowGutterStep)
                  ),
                  c.px((spans.row - 1) * gutter));

              style['top'] = c.calc(top);
              style['height'] = c.calc(height);
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
      }
    };
  })
  .factory('$$mdGridLayout', function() {
    return layoutGrid;
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


  // Grid layout
  function layoutGrid(options) {
    var tileSpans = options.tileSpans;
    var colCount = options.colCount;
    var curCol = 0;
    var curRow = 0;
    var row = newRowArray();

    var positioning = tileSpans.map(function(spans) {
      return {
        spans: spans,
        position: reserveSpace(spans)
      };
    });
    return {
      rowCount: curRow + Math.max.apply(Math, row),
      positioning: positioning
    }

    function reserveSpace(spans) {
      var start = 0,
          end = 0;

      // TODO(shyndman): This loop isn't strictly necessary if you can determine
      // the minimum number of rows before a space opens up. To do this,
      // recognize that you've iterated across an entire row looking for space,
      // and if so fast-forward by the minimum rowSpan count. Repeat until the
      // required space opens up.
      while (end - start < spans.col) {
        if (curCol >= colCount) {
          nextRow();
          continue;
        }

        start = row.indexOf(0, curCol);
        if (start === -1) {
          nextRow();
          continue;
        }

        end = findEnd(start + 1);
        if (end === -1) {
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
        row[i] = Math.max(row[i] + by, 0);
      }
    }

    function findEnd(start) {
      var i;
      for (i = start; i < row.length; i++) {
        if (row[i] !== 0) {
          return i;
        }
      }

      if (i === row.length) {
        return i;
      }
    }

    function newRowArray() {
      var tracker = [];
      for (var i = 0; i < colCount; i++) {
        tracker.push(0);
      }
      return tracker;
    }
  }
})();