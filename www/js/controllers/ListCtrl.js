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
       
/*           contactHandler.pickContact()
        .then(function(response){*/
            
            $scope.contact = /*contactHandler.reorderContact(response);*/
                [{"displayName":"Wipro - M 1","phoneValue":"+966549183476","phoneType":"mobile"},{"displayName":"Wipro - M 1","phoneValue":"+966565508736","phoneType":"mobile"}]
            /*$scope.contactNo = $scope.conatact[0].phoneValue;*/
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
                        listUser = {
                            userServerId:'58553bb81e546ea068a1bb73',
                            contact:['+966549183476','+966565508736'],
                            listServerId:'589efba55cbfa938e44b7898'
                        };
                        $http.post( global.serverIP+ "/api/user/check" , listUser).then(function(response){
                            console.log('11/02/2017 - listCtrl - aalatief: Api Call check User:'+JSON.stringify(response));
                    },
                    function(err){
                        console.log('11/02/2017 - listCtrl - aalatief: Api Call check Error:'+JSON.stringify(err.message));
                    });
                },function(error){
                    
                    
                });
            },
            function(error){
                console.log('08/02/2017 - listCtrl - aalatief: Local Contact insert in error');
            });
/*        },
            function(error){
               console.log('07/02/2017 - listCtrl -aalatief - error show selected contact');
            
        });*/

  
  });
    
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