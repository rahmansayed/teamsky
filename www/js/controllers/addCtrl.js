angular.module('starter.controllers.addCtrl', [])
  .controller('addCtrl', function ($scope, $state, listHandler) {
    $scope.dynamicTitle = 'New List';
    $scope.list = {

      id: new Date().getTime().toString(),
      title: '',
      description: ''
    };

    $scope.saveList = function () {

      listHandler.create($scope.list);
      $state.go('lists');
    };

  });

