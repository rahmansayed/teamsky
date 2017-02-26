angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, $state, $ionicPopup,$cordovaContacts,serverListHandler,dbHandler,contactHandler,$timeout,$http,global,localListHandlerV2,$filter) {


/*Retrieve all lists from localListHandlerV2*/
    
    localListHandlerV2.getAllLists()
    .then(function(lists)
		{
        $scope.lists = lists;
        console.log('21/02/2017 - listCtrl - localListHandlerV2 get all lists:'+$scope.lists);
       },
      function(error){
        console.log('21/02/2017 - listCtrl - localListHandlerV2 ERROR get all lists:'+JSON.stringify(error));
    });
    
    
    $scope.data = {selectedContacts : []};
/*-----------------------------------------------------------------------------------

/*Route to Edit List Page*/
    $scope.editList=function(listLocalId){

             $state.go('edit',{'listId':listLocalId});
        }
/*-------------------------------------------------------------------------------------

/*Pull to refresh */    
$scope.refresh = function() {
    
    console.log('Refreshing!');
    $timeout( function() {
        $state.reload();
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    
    }, 1000);
      
  };
/*-----------------------------------------------------------------------------------*/
/*Remove list Function*/    
    $scope.removeList=function(list){
/*Handle the case of elete from Device*/        
       document.addEventListener("deviceready", function () {
       navigator.notification.confirm(
        "Are you sure you want to delete the list "+list.listName+"?", // the message
        function( index ) {
            switch ( index ) {
                case 1:
                 localListHandlerV2.deactivateList(list.listLocalId)
                 .then(function(ret){
                     console.log('22/02/2017 - listCtrl - aalatief - Rows affected: '+ JSON.stringify(ret));
                      $state.reload();
                 },function(err){
                      console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: '+ JSON.stringify(err));
                 });
                    break;
                case 2:
                    // The second button was pressed
                    break;
            }
        },
        "Delete List", // a title
        [ "Delete", "Cancel" ]    // text of the buttons
    );
    });
/*Handle the case for delete from Browser*/   
    if (!(window.cordova)) {    
        var confirmPopup = $ionicPopup.confirm({
         title: 'Delete List',
         template: 'Are you sure you want to delete this list '+list.listName+"?"
       });

       confirmPopup.then(function(res) {
         if(res) {
                 localListHandlerV2.deactivateList(list.listLocalId)
                 .then(function(ret){
                     console.log('22/02/2017 - listCtrl - aalatief - Rows affected: '+ JSON.stringify(ret));
                      $state.reload();
                 },function(err){
                      console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: '+ JSON.stringify(err));
                 });
                 
         }
       })};
     };
/*-------------------------------------------------------------------------*/
/*Order list*/
    
    
    $scope.move = function (list,fromIndex,toIndex){

        $scope.lists.splice(fromIndex, 1);
        $scope.lists.splice(toIndex, 0, list);
    };
    $scope.reorderFlag = false;
    $scope.toggleReorder = function(){
        $scope.reorderFlag = !$scope.reorderFlag;
    };
/*--------------------------------------------------------------------------------*/

/*Route to Add item Page*/    
    $scope.addItem = function(listId){
        console.log('list id sent : ' + listId);
        $state.go('item',{'listId':listId});
    };
/*--------------------------------------------------------------------------------*/

  /*Share with Contact */  
 
       $scope.getAllContacts = function(listLocalId) {
        /* $state.go('contact');*/
       
           contactHandler.pickContact()
        .then(function(response){
           $scope.phoneNumbers = []; 
           
            $scope.contact = contactHandler.reorderContact(response);
                


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
                        
                        localListHandlerV2.getSpecificList(listLocalId)
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
  };
/*----------------------------------------------------------------------------------------*/    
});