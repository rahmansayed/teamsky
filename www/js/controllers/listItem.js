angular.module('starter.controllers.listItem', [])
  .controller('listItem', function ($scope, $state, listHandler, itemHandler, $ionicPopup) {

    $scope.checkedItems = itemHandler.checkedItem();
    $scope.listItems = itemHandler.selectedItemByListId($state.params.listId);

    $scope.AddListItem = function () {

      $state.go('addItem', {'listId': $state.params.listId});

    };

    $scope.removeFromList = function (listItem) {

      var confirmPopup = $ionicPopup.confirm({
        title: 'Delete Item from List',
        template: 'Are you sure you want to delete this item?'
      });

      confirmPopup.then(function (res) {
        if (res) {
          itemHandler.removeListItem(listItem);
          $state.reload();
        }
      });

    };

    $scope.list = angular.copy(listHandler.get($state.params.listId));
    $scope.dynamicListTitle = $scope.list.title;

    $scope.itemChecked = function (listItem) {

      $scope.checkeditem =
      {
        listId: $state.params.listId,
        itemId: listItem.itemId,
        itemName: listItem.itemName
      };
      itemHandler.checkItem($scope.checkeditem);
    };
  });

