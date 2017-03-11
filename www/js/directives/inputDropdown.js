angular.module('starter.services')

.directive('inputDropdown', function($compile) {
    
    var template = 
        '<input ng-model="ngModel">' +
        '<div class="dropdown">' + 
            '<div ng-repeat="value in list">' +
                '<div ng-mousedown="select($event, value)">{{value}}</div>' + 
            '</div>' +
        '</div>';
    
    return {
        restrict: 'EA',
        scope: {
            ngModel: '=',
            list: '=',
            onSelect: '&'
        },
        template: template,
        link: function(scope, element, attrs) {
            element.addClass('input-dropdown');
            scope.select = function(e, value) {
                scope.ngModel = value;
                scope.onSelect({$event: e, value: value});
            };
        }
    };
});



    var searchRetailer = function (searchFilter) {

      console.log('11/03/2017 - aalatief - Searching retailer for ' + searchFilter);
      var deferred = $q.defer();
      var matches = retailers.filter(function (retailer) {
        console.log('The retailer Returned from Search: ' + retailer.retailerName.toLowerCase());
        if (retailer.retailerName.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) return true;
      })

      console.log('retialers array: ' + JSON.stringify(retailers));
      $timeout(function () {
        console.log('Matches : ' + JSON.stringify(matches));
        deferred.resolve(matches);

      }, 100);

      return deferred.promise;
    };