angular.module('starter.controllers.listCtrl', [])
  .controller('listCtrl', function ($scope, listHandler, $state, $ionicPopup) {

    $scope.lists = listHandler.list();

    $scope.editList = function (listId) {

      $state.go('edit', {'listId': listId});
    };

    
    $scope.addUserToList = function () {

     
          listHandler.addUser("58218e52c670eb1c2a0ce602","57cae83fff54d7ec31ced250");
          console.log("User Add Requested!!");
    };
    
    
    
    $scope.removeList = function (listId) {

      var confirmPopup = $ionicPopup.confirm({
        title: 'Delete List',
        template: 'Are you sure you want to delete this list'
      });

      confirmPopup.then(function (res) {
        if (res) {
          listHandler.remove(listId);
        }
      });
    };

    $scope.move = function (list, fromIndex, toIndex) {

      listHandler.move(list, fromIndex, toIndex);

    };
    $scope.reorderFlag = false;
    $scope.toggleReorder = function () {
      $scope.reorderFlag = !$scope.reorderFlag;
    };


    $scope.addItem = function (listId) {

      $state.go('item', {'listId': listId});
    };
  });
