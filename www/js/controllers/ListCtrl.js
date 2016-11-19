angular.module('starter.controllers.listCtrl', [])
  .controller('listCtrl', function ($scope, listHandler, $state, $ionicPopup,$cordovaContacts,serverListHandler) {

    $scope.lists = listHandler.list();
    
    $scope.editList=function(listId){

        $state.go('edit',{'listId':listId});
    };
    
    $scope.removeList=function(listId){
       
       var confirmPopup = $ionicPopup.confirm({
         title: 'Delete List',
         template: 'Are you sure you want to delete this list'
       });

       confirmPopup.then(function(res) {
         if(res) {
                  listHandler.remove(listId);
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
