angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, listHandler, $state, $ionicPopup,$cordovaContacts,serverListHandler,dbHandler,contactHandler) {


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
 
       $scope.getAllContacts = function() {
        /* $state.go('contact');*/
       
           contactHandler.pickContact()
        .then(function(response){
            $scope.contactName = response.displayName;
            console.log('07/02/2017 - listCtrl -aalatief - show selected contact'+JSON.stringify(response));
            
        },
            function(error){
               console.log('07/02/2017 - listCtrl -aalatief - error show selected contact');
            
        });

  
  };
    
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
  });
