angular.module('starter.controllers.editCtrl', [])
  .controller('editCtrl', function ($scope, $state, listHandler,dbHandler) {

    $scope.dynamicTitle = 'Edit List';
    console.log('Edit List: ' + listHandler.get($state.params.listId)+'List Id:' + $state.params.listId);
    $scope.list=angular.copy( listHandler.get($state.params.listId));

    $scope.saveList=function(){

        listHandler.update($scope.list);
        
        $state.go('lists');
    };
    

  });
