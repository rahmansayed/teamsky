angular.module('starter.controllers')
  .controller('contactCtrl', function ($scope, listHandler, $state, $ionicPopup,$cordovaContacts,serverListHandler,dbHandler,contactHandler) {

      $cordovaContacts.find({filter: '',multiple:true}).then(function(allContacts) {
      $scope.contacts = contactHandler.reorderContact(allContacts);
 
      console.log('06/02/2017 - contactCtrl - aalatief: all contacts'+JSON.stringify($scope.contacts));  
      });
    
    
});