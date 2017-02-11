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
    
        var formatPhoneNumber = function(EnteredPhoneNumber) {
              var formattedNumber = ' ';
              var phoneNumber = EnteredPhoneNumber.replace(/\s+/g, '')
             if (!(phoneNumber.substr(0,1) == '+' || phoneNumber.substr(0,2)=='00')){
                 if (phoneNumber.substr(0,1) == '0'){
                     
                     formattedNumber = '+966'.concat(phoneNumber.substr(1));
                     console.log('11/2/2017 - contactHandler - aalatief : Formatted No'+formattedNumber)
                 }
                 else{
                     
                     formattedNumber = '+966'.concat(phoneNumber);
                     console.log('11/2/2017 - contactHandler - aalatief : Formatted No'+formattedNumber)
                 }
                
             } 
            else 
                {
                    formattedNumber = phoneNumber
                    console.log('11/2/2017 - contactHandler - aalatief : No is in international Format'+formattedNumber)
                }
            
            return formattedNumber
        
        };

        var reorderContact = function(contacts){
            
            var arrangedContact= [];
            console.log('06/02/2017 - contactHandler - aalatief: contact passed'+JSON.stringify(contacts));
            /*for (var i = 0; i < contacts.length; i++) {*/
                
                console.log('06/02/2017 - contactHandler - aalatief:test phone no. array'+' length: '+ (contacts.phones|| []).length+' Array: ' +JSON.stringify(contacts.phones));
                for (var j = 0; j < (contacts.phones|| []).length; j++) {
                    arrangedContact.push({displayName:contacts.displayName,
                                          phoneValue:formatPhoneNumber(contacts.phones[j].value),
                                          phoneType:contacts.phones[j].type,
                                        });    

                  }
            /*}*/
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
    
        function addLocalContact(contact) {

		var deferred = $q.defer();
		var query = "insert or ignore into contact(contactLocalId,contactName,phoneNumber,phoneType,contactStatus,lastUpdateDate,lastUpdateBy) values (?,?,?,?,?,?,?)";
		dbHandler.runQuery(query,[null,contact.displayName,contact.phoneValue,contact.phoneType,'N',new Date().getTime(),'U'],function(response){
			//Success Callback
			console.log(response);
			deferred.resolve(response);
		},function(error){
			//Error Callback
			console.log(error);
			deferred.reject(error);
		});

		return deferred.promise;
	};

    function getContactLocalId(contactNo){
        var deferred = $q.defer();
        var query = "select c.contactLocalId from contact as c where c.phoneNumber = ?";
        //var query = "SELECT i.itemLocalId, i.itemName, i.categoryLocalId FROM masterItem ";
        dbHandler.runQuery(query,[contactNo],function(response){
            //Success Callback
            console.log('Contact Name: '+contactNo+'Success local conact Id ' + JSON.stringify(response.rows));
            contact = response.rows.item(0);
            console.log('contact: ' + JSON.stringify(contact));
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log('fail Master query '+error);
            deferred.reject(error);
        });
        console.log('Master Deferred Promise: '+ JSON.stringify(deferred.promise));
        return deferred.promise;
    };
    

        return {
            pickContact : pickContact,
            formatContact:formatContact,
            reorderContact:reorderContact,
            addLocalContact:addLocalContact,
            getContactLocalId:getContactLocalId,
            formatPhoneNumber:formatPhoneNumber
            
        };


});

