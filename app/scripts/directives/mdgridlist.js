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
      $$mdGridLayout, $mdConstants, $mdMedia, $mdUtil, $parse) {
    return {
      restrict: 'E',
      controller: MdGridListController,
      link: function postLink(scope, element, attrs, ctrl) {
        element.attr('role', 'list'); // Apply semantics
        watchMedia();

        /**
         * Watches for changes in media, invalidating layout as necessary.
         */
        function watchMedia() {
          $mdUtil.watchResponsiveAttributes(
              ['cols', 'ratio'], attrs, layoutIfMediaMatch);
          for (var mediaName in $mdConstants.MEDIA) {
            $mdMedia.queries[mediaName].addListener(
                angular.bind(ctrl, ctrl.invalidateLayout));
          }
        }

        /**
         * Performs grid layout if the provided mediaName matches the currently
         * active media type.
         */
        function layoutIfMediaMatch(mediaName) {
          if (mediaName == null) {
            // This should really check whether we're using the fallback, rather
            // than indiscriminately invalidate layout
            ctrl.invalidateLayout();
          } else if ($mdMedia.queries[mediaName].matches) {
            ctrl.invalidateLayout();
          }
        }

        // Lay out on attribute changes
        ctrl.layoutDelegate = function() {
          var tiles = element[0].querySelectorAll('md-grid-tile');
          var colCount = getColumnCount();
          var rowHeight = getRowHeight();
          console.time('layout incl. DOM');
          $$mdGridLayout({
            tileSpans: getTileSpans(),
            colCount: colCount,
            rowHeight: rowHeight
          }).forEach(function(ps, i) {
            angular.element(tiles[i]).css(
              getStyles(ps.position, ps.spans, colCount, rowHeight));
          });
          console.timeEnd('layout incl. DOM');
        };

        function getStyles(position, spans, colCount, rowHeight) {
          return {
            width: ((spans.col / colCount) * 100) + '%',
            height: spans.row * rowHeight + 'px',
            left: ((position.col / colCount) * 100) + '%',
            top: position.row * rowHeight + 'px'
          };
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

        function getRowHeight() {
          return parseInt($mdUtil.getResponsiveAttribute(attrs, 'row-height'), 10);
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

  MdGridListController.prototype.addTile = function(tileAttrs) {
    this.tiles.push(tileAttrs);
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

    console.time('grid layout');
    var positioning = tileSpans.map(function(spans) {
      return {
        spans: spans,
        position: reserveSpace(spans)
      };
    });
    console.timeEnd('grid layout');
    return positioning;

    function reserveSpace(spans) {
      var start = 0,
          end = 0;

      // TODO(shyndman): This loop isn't strictly necessary if you can determine
      // the minimum number of rows before a space opens up. To do this,
      // recognize that you've iterated across an entire row looking for space,
      // and if so fast-forward by the minimum rowSpan count. Repeat until space
      // opens up.
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