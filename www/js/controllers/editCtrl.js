angular.module('starter.controllers.editCtrl', [])
  .controller('editCtrl', function ($scope, $state, listHandler) {

    $scope.dynamicTitle = 'Edit List';
    $scope.list=angular.copy( listHandler.get($state.params.listId));

    $scope.saveList=function(){

        listHandler.update($scope.list);
        $state.go('lists');
    };
    

  });
