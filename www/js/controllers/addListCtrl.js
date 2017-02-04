angular.module('starter.controllers')
  .controller('addListCtrl', function ($scope, $state, listHandler,serverListHandler,dbHandler,serverHandlerListV2) {
        $scope.dynamicTitle = 'New List';
        $scope.list= {

            listLocalId: new Date().getTime().toString(),
            listName: '',
            listDescription: '',
            listServerId:''
        };

        $scope.saveList=function(){

           /* listHandler.create($scope.list); -- Old Create Local Storage*/
            listHandler.addNewList($scope.list);
            //Server Call for Create List in Server DB
            serverHandlerListV2.createList($scope.list)
            .then(function(result){
                console.log('aalatief: List Server create success:'+JSON.stringify(result));
            },
            function(error){
                console.log('aalatief: List Server create fail:'+JSON.stringify(error));
            }      
        );
            console.log('04/02/2017 - aalatief - : Lists array after create:'+JSON.stringify($scope.lists));
            $state.go('lists');
        };
  });

