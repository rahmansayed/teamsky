angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, listHandler, $state, $ionicPopup,$cordovaContacts,serverListHandler,dbHandler,contactHandler,$timeout,$http,global) {


    dbHandler.runQuery() ;

    $scope.lists = listHandler.list();
    
    $scope.data = {selectedContacts : []};

    console.log($scope.message);
    console.log('Returned list from DB = ')+JSON.stringify($scope.lists);

    $scope.editList=function(listLocalId){
/*        listHandler.get(listLocalId)
        .then(function(result){
            */
             $state.go('edit',{'listId':listLocalId});
        }/*,
        function(error){
            console.log('aalatief: List Load Error')
        });
       
    };*/
    
      $scope.refresh = function() {
    
    console.log('Refreshing!');
    $timeout( function() {
        $state.reload();
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    
    }, 1000);
      
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

/*    $scope.getContacts = function() {
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
        };*/
 
       $scope.getAllContacts = function(listLocalId) {
        /* $state.go('contact');*/
       
           contactHandler.pickContact()
        .then(function(response){
           $scope.phoneNumbers = []; 
           
            $scope.contact = contactHandler.reorderContact(response);
                

/*[{"displayName":"A badr","phoneValue":"+966540295048","phoneType":"mobile"},{"displayName":"A badr","phoneValue":"+96615;","phoneType":"mobile"}];*/
/*                [{"displayName":"Wipro - M 1","phoneValue":"+966565508736","phoneType":"mobile"},{"displayName":"Wipro - M 1","phoneValue":"+966549183476","phoneType":"mobile"}];*/
            
            for (var i = 0; i < $scope.contact.length; i++) {
              $scope.phoneNumbers.push($scope.contact[i].phoneValue);
            }
            console.log('12/02/2017 - listCtrl -aalatief - show selected contact/phone no.'+JSON.stringify($scope.phoneNumbers ));
            console.log('07/02/2017 - listCtrl -aalatief - show selected contact'+JSON.stringify($scope.contact ));
            contactHandler.addLocalContact($scope.contact)
            .then(function(res){
                console.log('08/02/2017 - listCtrl - aalatief: Local Contact Intserted successfully: '+ JSON.stringify(res));
                
           
                contactHandler.getContactLocalId(contactHandler.formatPhoneNumber($scope.contact[0].phoneValue))
                .then(function(result){
                    console.log('08/02/2017 - listCtrl - aalatief: Local Contact Id: ' + JSON.stringify(result.rows.item(0)));
                    contactLocalId = result.rows.item(0).contactLocalId;
                    contactHandler.addListContact(listLocalId,contactLocalId)
                    .then
                    (function(res){
                        
                        listHandler.getSpecificList(listLocalId)
                        .then(function(response){
                           console.log('12/02/2017 - listCtrl - aalatief: Return My List:'+JSON.stringify(response.rows.item(0))); 
                           $scope.listServerId =   response.rows.item(0).listServerId
                           listUser = {
                            userServerId:global.userServerId,
                            contact:$scope.phoneNumbers,
                            listServerId:$scope.listServerId
                        };
                        $http.post( global.serverIP+ "/api/user/check" , listUser).then(function(response){
                            console.log('11/02/2017 - listCtrl - aalatief: Api Call check User:'+JSON.stringify(response));
                            $scope.invitedUserServerId = response.data.userServerId;
                            console.log('13/02/2017 - listCtrl - aalatief: invitedUserServerId:'+JSON.stringify($scope.invitedUserServerId));
                            
                            contactHandler.updateContactStatus(contactLocalId,'S',$scope.invitedUserServerId).then(function(response){
                            console.log('13/02/2017 - listCtrl - aalatief: Update Subscribed User Status:'+JSON.stringify(response));    
                            },function(error){
                                console.log('13/02/2017 - listCtrl - aalatief: Error Update Subscribed User Status:'+JSON.stringify(Error)); 
                            });                            

                            listDetail={
                                listServerId:$scope.listServerId,
                                invitedUserServerId:$scope.invitedUserServerId
                            }
                             $http.post( global.serverIP+ "/api/list/invite" , listDetail).then(function(response){
                                 console.log('11/02/2017 - listCtrl - aalatief: Invite Api Call check:'+JSON.stringify(response));
                                 
                             },function(error){});
                    },
                    function(err){
                        console.log('11/02/2017 - listCtrl - aalatief: Api Call check Error:'+JSON.stringify(err));
                        contactHandler.updateContactStatus(contactLocalId,'P',null).then(function(response){
                        console.log('13/02/2017 - listCtrl - aalatief: Update Prospect User Status:'+JSON.stringify(response));    
                        },function(error){
                            console.log('13/02/2017 - listCtrl - aalatief: Error Update Prospect User Status:'+JSON.stringify(Error)); 
                        });
                    });    
                            
                            
                        },function(error){
                            console.log('13/02/2017 - listCtrl - aalatief: Return My List error:'+JSON.stringify(error)); 
                        });

                },function(error){
                    
                    console.log('13/02/2017 - listCtrl - aalatief: Return My List error:'+JSON.stringify(error)); 
                });
            },
            function(error){
                console.log('08/02/2017 - listCtrl - aalatief: Local Contact insert in error');
            });
        },
            function(error){
               console.log('07/02/2017 - listCtrl -aalatief - error show selected contact');
            
        });

  
  });
          
    $scope.myObj = {
        "color" : "blue",
        "background-color" : "yellow"
    };       
           
    $scope.listStyle = function (list){
        if (list.contactStatus =='S'){
        $scope.listStyle = {
                "color" : "blue",
                "background-color" : "#e6fff2"
            };
        }
        else if(list.contactStatus =='P'){
                $scope.listStyle = {
                "color" : "red",
                "background-color" : "#ffb3b3"
                };
          }
        else{
                 $scope.listStyle = {
                "color" : "grey",
                "background-color" : "#bfbfbf"
                };           
            
        }    
        return   $scope.listStyle  
       
    }   ;    
    
/*    $scope.getAllContacts = function() {

    contactHandler.pickContact().then(
        function(contact) {
            $scope.data.selectedContacts.push(contact);
            console.log("Selected contacts=");
            console.log($scope.data.selectedContacts);

        },
        function(failure) {
            console.log("Bummer.  Failed to pick a contact"+JSON.stringify(failure));
        }
    )
    };*/

    $scope.addUserToList = function(){
       /* $scope.getAllContacts();*/

    };
  };
});