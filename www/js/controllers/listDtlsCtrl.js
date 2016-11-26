angular.module('starter.controllers')
  .controller('listDtlsCtrl', function ($scope, global, $http, $state, $cordovaContacts, listHandler) {
    $scope.settings = {};

    $scope.pickContact = function () {
      phoneNumbers = [];
      navigator.contacts.pickContact(function (Contact) {
        for(i=0; i< Contact.phoneNumbers.length; i++){
          if (Contact.phoneNumbers[i].value.substring(0,2) != '00' &&  Contact.phoneNumbers[i].value.substring(0,1) != '+'){
            phoneNumbers[i] = '002' + Contact.phoneNumbers[i].value;
          }
          else {
            phoneNumbers[i] = Contact.phoneNumbers[i].value;
          }
        }
        var data =
        {
            phoneNumbers: phoneNumbers,
            contact_id: Contact.id,
            displayName : Contact.displayName
        };

        console.log(Contact);
        listHandler.addUser(100, data);
      });

    }
  });


