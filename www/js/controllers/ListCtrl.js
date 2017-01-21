angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, listHandler, $state, $ionicPopup,$cordovaContacts,serverListHandler,dbHandler) {


    dbHandler.runQuery() ;

    $scope.lists = listHandler.list();

    console.log($scope.message);
    console.log('Returned list from DB = ')+JSON.stringify($scope.lists);

    $scope.editList=function(listLocalId){

        $state.go('edit',{'listId':listLocalId});
    };

    $scope.removeList=function(listLocalId){

       var confirmPopup = $ionicPopup.confirm({
         title: 'Delete List',
         template: 'Are you sure you want to delete this list'
       });

       confirmPopup.then(function(res) {
         if(res) {
                  listHandler.remove(listLocalId);
                  $state.reload();
         }
       });
     };

    $scope.move = function (list,fromIndex,toIndex){

            listHandler.move(list,fromIndex,toIndex);

    };
    $scope.reorderFlag = false;
    $scope.toggleReorder = function(){
        $scope.reorderFlag = !$scope.reorderFlag;
    };


    $scope.addItem = function(listId){
        console.log('list id sent : ' + listId);
        $state.go('item',{'listId':listId});
    };

    $scope.getContacts = function() {
          $scope.phoneContacts = [];
          function onSuccess(contacts) {
            for (var i = 0; i < contacts.length; i++) {
              var contact = contacts[i];
              $scope.phoneContacts.push(contact);
            }
          };
          function onError(contactError) {
            alert(contactError);
          };
          var options = {};
          options.multiple = true;
          $cordovaContacts.find(options).then(onSuccess, onError);
        };



    $scope.addUserToList = function(){


    };
  });
