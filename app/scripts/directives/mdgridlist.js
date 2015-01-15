(function() {
'use strict';

/**
 * @ngdoc directive
 * @name gridTestApp.directive:mdGridList
 * @description
 * # mdGridList
 */
angular.module('gridTestApp')
  .directive('mdGridList', function($$mdGridLayout, $parse) {
    return {
      restrict: 'E',
      controller: MdGridListController,
      link: function postLink(scope, element, attrs, ctrl) {
        // Apply semantics
        element.attr('role', 'list');

        // Lay out on attribute changes
        var layoutFn = angular.bind(ctrl, ctrl.invalidateLayout);
        attrs.$observe('cols', layoutFn);
        attrs.$observe('rowHeight', layoutFn);
        attrs.$observe('gutter', layoutFn);

        ctrl.layoutDelegate = function() {
          $$mdGridLayout({
            container: element,
            cols: $parse(attrs['cols'])(scope),
            rowHeight: $parse(attrs['rowHeight'])(scope)
          });
        };

        function getResponsiveCols() {

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
    this.layoutDelegate;
  }

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
    var tiles = Array.prototype.slice.call(
        options.container[0].querySelectorAll('md-grid-tile'));
    var numCols = options.cols;
    var curCol = 0;
    var curRow = 0;
    var row = newRowArray();

    console.profile('layout');
    tiles
        .map(function(t) {
          return angular.element(t);
        })
        .forEach(function(t) {
          var spans = getSpans(t);
          var position = reserveSpace(spans);
          t.css(getStyles(position, spans));
        });
    console.profileEnd('layout');

    function reserveSpace(spans) {
      var start = 0,
          end = 0;

      // TODO(shyndman): This loop isn't strictly necessary if you can determine
      // the minimum number of rows before a space opens up. To do this,
      // recognize that you've iterated across an entire row looking for space,
      // and if so fast-forward by the minimum rowSpan count. Repeat until space
      // opens up.
      while (end - start < spans.col) {
        if (curCol >= numCols) {
          nextRow();
          continue;
        }

        start = row.indexOf(0, curCol);
        if (start == -1) {
          nextRow();
          continue;
        }

        end = findEnd(start + 1);
        if (end == -1) {
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
      adjustRow(0, numCols, -1); // Decrement row spans by one

      console.log('row(' + curRow + '):', row);
    }

    function adjustRow(from, cols, by) {
      for (var i = from; i < from + cols; i++) {
        row[i] = Math.max(row[i] + by, 0);
      }
    }

    function findEnd(start) {
      var i;
      for (i = start; i < row.length; i++) {
        if (row[i] != 0) {
          return i;
        }
      }

      if (i == row.length) {
        return i;
      }
    }

    function newRowArray() {
      var tracker = [];
      for (var i = 0; i < numCols; i++) {
        tracker.push(0);
      }
      return tracker;
    }

    function getSpans(t) {
      return {
        col: parseInt(t.attr('colspan'), 10) || 1,
        row: parseInt(t.attr('rowspan'), 10) || 1
      };
    }

    function getStyles(position, spans) {
      return {
        width: ((spans.col / numCols) * 100) + '%',
        height: spans.row * options.rowHeight + 'px',
        left: ((position.col / numCols) * 100) + '%',
        top: position.row * options.rowHeight + 'px'
      };
    }
  }
})();