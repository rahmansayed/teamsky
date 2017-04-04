angular.module('starter.controllers')
  .controller('editCtrl', function ($scope, $state,dbHandler,serverHandlerListV2,localListHandlerV2,$ionicPopup,contactHandler, global) {

    $scope.dynamicTitle = 'Edit List';
    console.log('Edit List: ' + 'global.currentList' + JSON.stringify(global.currentList));

    $scope.dynamicTitle = 'Edit List: '+ global.currentList.listName;
    $scope.list = angular.copy(global.currentList);
/*
    localListHandlerV2.getSpecificList($state.params.listId)
    .then(function(res){
        console.log('23/02/2017 - aalatief: specific List success:'+JSON.stringify(res));
        $scope.list=angular.copy(res);

    },
    function(error){
        console.log('aalatief: specific List fail:'+JSON.stringify(error));

    });
*/

    $scope.listUsers = global.currentList.contacts;
/*
    localListHandlerV2.getListUsers($state.params.listId)
    .then(function(res){
        console.log('23/03/2017 - aalatief: List userssuccess:'+JSON.stringify(res));
        $scope.listUsers=/!*angular.copy(*!/res/!*)*!/;
    },
    function(error){
        console.log('aalatief: specific List fail:'+JSON.stringify(error));

    });
*/
    /*Save List */
    $scope.saveList=function(){

        localListHandlerV2.update($scope.list)
        .then(function(response){
            $state.go('lists');
            console.log('23/2/2017 - aalatief: List local update success:'+JSON.stringify($scope.list)+' , '+JSON.stringify(response));
        },function(error){
            console.log('23/2/2017 - aalatief: List local update fail:'+JSON.stringify($scope.list)+' , '+JSON.stringify(error));
        },function(error){
        });

        serverHandlerListV2.updateList($scope.list)
        .then(function(result){
            console.log('23/2/2017 - aalatief: List Server update success:'+JSON.stringify(result));
        },
        function(error){

             console.log('aalatief: List Server update fail:'+JSON.stringify(error));
        });


    };
    /*-----------------------------------------------------------------------------------*/
    /*Remove list user Function*/
    $scope.removeListUser = function (list) {
      /*Handle the case of elete from Device*/
      document.addEventListener("deviceready", function () {
        navigator.notification.confirm(
          "Are you sure you want to remove this contact from list " + list.listName + "?", // the message
          function (index) {
            switch (index) {
              case 1:
/*                localListHandlerV2.deactivateList(list.listLocalId)
                  .then(function (ret) {
                    console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + JSON.stringify(ret));
                    $state.reload();
                  }, function (err) {
                    console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
                  });*/
                    alert('delete'+list.contactName);
                break;
              case 2:
                // The second button was pressed
                break;
            }
          },
          "Delete user from list", // a title
          ["Delete", "Cancel"]    // text of the buttons
        );
      });
      /*Handle the case for delete from Browser*/
      if (!(window.cordova)) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Delete user from list',
          template: 'Are you sure you want to remove this contact from list  ' + list.listName + "?"
        });

        confirmPopup.then(function (res) {
            alert('delete'+list.contactName);
/*          if (res) {
            localListHandlerV2.deactivateList(list.listLocalId)
              .then(function (ret) {
                console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + JSON.stringify(ret));
                $state.reload();
              }, function (err) {
                console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
              });

          }*/
        })
      }
      ;
    };

/*Share with Contact */

    $scope.getAllContacts = function (list) {
      /* $state.go('contact');*/
      contactHandler.pickContact(list);
        $state.reload();
    };
    /*----------------------------------------------------------------------------------------*/
    /*set the color of the contact shown based on status*/
    $scope.setColor = function (status,element) {

    if (element =='color') {
     if (status == 'S') {
        return {color: "blue"};
      }
      else if (status == 'P') {
        return {color: "red"};
      }
      else {
        return {color: "grey"};
      }
    }
    else if (element =='border') {
        if (status == 'S') {
        return {border: "1px solid blue"};
      }
      else if (status == 'P') {
        return {border: "1px solid red"};
      }
      else {
        return {border: "1px solid grey"};
      }
    }
    };


    /*-----------------------------------------------------------------------------------------*/
  });
