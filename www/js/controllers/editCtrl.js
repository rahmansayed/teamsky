angular.module('starter.controllers')
  .controller('editCtrl', function ($scope, $state,dbHandler,serverHandlerListV2,localListHandlerV2) {

    $scope.dynamicTitle = 'Edit List';
    console.log('Edit List: ' + 'List Id:' + $state.params.listId);
    
    localListHandlerV2.getSpecificList($state.params.listId)
    .then(function(res){
        console.log('23/02/2017 - aalatief: specific List success:'+JSON.stringify(res));
        $scope.list=angular.copy(res);
         $scope.dynamicTitle = 'Edit List: '+ res.listName;
    },
    function(error){
        console.log('aalatief: specific List fail:'+JSON.stringify(error));
        
    });

    localListHandlerV2.getListUsers($state.params.listId)
    .then(function(res){
        console.log('23/03/2017 - aalatief: List userssuccess:'+JSON.stringify(res));
        $scope.listUsers=angular.copy(res);
    },
    function(error){
        console.log('aalatief: specific List fail:'+JSON.stringify(error));
        
    });    
    
    $scope.saveList=function(){

        localListHandlerV2.update($scope.list)
        .then(function(response){
            $state.go('lists');
            console.log('23/2/2017 - aalatief: List local update success:'+JSON.stringify($scope.list)+' , '+JSON.stringify(response));
        },function(error){
            console.log('23/2/2017 - aalatief: List local update fail:'+JSON.stringify($scope.list)+' , '+JSON.stringify(error));
        },function(error){
        });
        
        serverHandlerListV2.updateList($scope.list)
        .then(function(result){
            console.log('23/2/2017 - aalatief: List Server update success:'+JSON.stringify(result));
        },
        function(error){
            
             console.log('aalatief: List Server update fail:'+JSON.stringify(error));
        });

        
    };


  });
