angular.module('starter.controllers')
  .controller('editCtrl', function ($scope, $state, listHandler,dbHandler,serverHandlerListV2) {

    $scope.dynamicTitle = 'Edit List';
    console.log('Edit List: ' + listHandler.get($state.params.listId)+'List Id:' + $state.params.listId);
    $scope.list=angular.copy( listHandler.get($state.params.listId));

    $scope.saveList=function(){

        listHandler.update($scope.list);
        
        serverHandlerListV2.updateList($scope.list)
        .then(function(result){
            console.log('aalatief: List Server update success:'+JSON.stringify(result));
        },
        function(error){
            
             console.log('aalatief: List Server update fail:'+JSON.stringify(error));
        });

        $state.go('lists');
    };


  });
