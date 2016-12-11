angular.module('starter.controllers')
  .controller('addListCtrl', function ($scope, $state, listHandler,serverListHandler,dbHandler) {
        $scope.dynamicTitle = 'New List';
        $scope.list= {

            listLocalId: new Date().getTime().toString(),
            listName: '',
            listDescription: '',
            listServerId:''
        };

        $scope.saveList=function(){

            listHandler.create($scope.list);
            listHandler.addNewList($scope.list);

            $state.go('lists');
        };
  });
