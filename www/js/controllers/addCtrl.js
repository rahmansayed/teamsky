angular.module('starter.controllers.addCtrl', [])
  .controller('addCtrl', function ($scope, $state, listHandler,serverListHandler) {
        $scope.dynamicTitle = 'New List';
        $scope.list= {

            id: new Date().getTime().toString(),
            title: '',
            description: '',
            serverListId:''
        };

        $scope.saveList=function(){

            listHandler.create($scope.list);
            
            $state.go('lists');
        };
  });

