angular.module('starter.controllers.addItem', [])
  .controller('addItem', function ($scope, $state, listHandler, itemHandler, $http) {


    $http.get('https://secret-savannah-80432.herokuapp.com/api/items').success(function (data) {
      $scope.item = data;
      console.log($scope.item);


      $scope.category = //angular.fromJson(window.localStorage['category'] || []);
        ['Dairy', 'Cleaning', 'Drinks', 'Bakery'];
      $scope.selectedItems = itemHandler.selectedItem();
      /*$scope.item = //itemHandler.item();

       [{
       id: '1',
       name: 'Milk',
       category: 'Dairy'
       },
       {
       id: '2',
       name: 'Cheese',
       category: 'Dairy'
       },
       {
       id: '3',
       name: 'Soap',
       category: 'Cleaning'
       }
       ,
       {
       id: '4',
       name: 'Juice',
       category: 'Drinks'
       }
       ,
       {
       id: '5',
       name: 'Water',
       category: 'Drinks'
       }

       ];
       */
      window.localStorage['item'] = $scope.item;
      window.localStorage['category'] = angular.toJson($scope.category);

      $scope.groups = [];
      $scope.groupedItems = [];

      $scope.getGroupedItem = function (category) {
        $scope.groupedItems = [];
        for (k = 0; k < $scope.item.length; k++) {
          if ($scope.item[k].category === category) {
            $scope.groupedItems.push($scope.item[k]);
          }
        }
        ;
        return $scope.groupedItems;
      };

      for (var i = 0; i < $scope.category.length; i++) {
        $scope.groups[i] = {
          name: $scope.category[i],
          items: $scope.getGroupedItem($scope.category[i]),
          show: false
        }
        ;
        for (var j = 0; j < 3; j++) {
          $scope.groups[i].items.push(i + '-' + j);
        }
      }
    });


    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    $scope.toggleGroup = function (group) {
      group.show = !group.show;
    };
    $scope.isGroupShown = function (group) {
      return group.show;
    };
    /*itemHandler.deleteAll();*/
    var selected = [itemHandler.selected];
    $scope.selectItems = function (item) {

      $scope.selecteditem =
      {
        listId: $state.params.listId,
        itemId: item.id,
        itemName: item.name
      };
      itemHandler.addItemToList($scope.selecteditem);

      /*Multiple Mark of selected*/
      var index = selected.indexOf(item);
      if (index > -1) {
        selected.splice(index, 1);
        item.selected = false;
      }
      else {
        selected.push(item);
        item.selected = true;
      }
    };

    $scope.AddMasterItem = function () {

      $state.go('masterItem');
    };


  });

