angular.module('starter.services')

  .factory('contactHandler', function ($ionicPlatform, $cordovaSQLite,$q,$ionicLoading, $location,dbHandler,$cordovaContacts) {


        var formatContact = function(contact) {

            return {
                "displayName"   : contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
                "emails"        : contact.emails || [],
                "phones"        : contact.phoneNumbers || [],
                "photos"        : contact.photos || []
            };

        };
    
        
        var reorderContact = function(contacts){
            
            var arrangedContact= [];
            
            for (var i = 0; i < contacts.length; i++) {
  /*              
                console.log('06/02/2017 - contactHandler - aalatief:test phone no. array'+' length: '+ (contacts[i].phoneNumbers|| []).length+' Array: ' +JSON.stringify(contacts[i].phoneNumbers));*/
                for (var j = 0; j < (contacts[i].phoneNumbers|| []).length; j++) {
                    arrangedContact.push({displayName:contacts[i].displayName,
                                          phoneNumbersValue:contacts[i].phoneNumbers[j].value,
                                          phoneNumbersType:contacts[i].phoneNumbers[j].type,
                                        });    

                  }
            }
        return arrangedContact;
        };
      

        var pickContact = function() {

            var deferred = $q.defer();
            if(navigator && navigator.contacts) {
                navigator.contacts.pickContact(function(contact){
                    deferred.resolve( formatContact(contact) );
                });
            } else {
                deferred.reject("No contacts in desktop browser");
            }

            return deferred.promise;
        };
    
    
    

        return {
            pickContact : pickContact,
            formatContact:formatContact,
            reorderContact:reorderContact
            
        };


});

