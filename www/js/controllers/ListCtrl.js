angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, $state, $ionicPopup, $cordovaContacts, dbHandler, contactHandler, $timeout, $http, global, localListHandlerV2, $filter, $ionicHistory, $ionicSideMenuDelegate, $ionicGesture) {


    /* $ionicHistory.nextViewOptions({
     disableBack: true

     });*/
    /*Retrieve all lists from localListHandlerV2*/

    localListHandlerV2.getAllLists()
      .then(function (lists) {
          $scope.lists = lists;
          console.log('21/02/2017 - listCtrl - localListHandlerV2 $scope.lists :' + JSON.stringify($scope.lists));
        },
        function (error) {
          console.log('21/02/2017 - listCtrl - localListHandlerV2 ERROR $scope.lists:' + JSON.stringify(error));
        });


    $scope.data = {selectedContacts: []};
    /*-----------------------------------------------------------------------------------

     /*Route to Edit List Page*/
    $scope.editList = function (listLocalId) {

      $state.go('edit', {'listId': listLocalId});
    }
    /*-----------------------------------------------------------------------------------

     /*Route to Add List Page*/
    $scope.addList = function () {

      $state.go('add');
    }


    /*-------------------------------------------------------------------------------------

     /*Pull to refresh */
    $scope.refresh = function () {

      console.log('Refreshing!');
      $timeout(function () {
        $state.reload();
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');

      }, 100);

    };
    /*-----------------------------------------------------------------------------------*/
    /*Remove list Function*/
    $scope.removeList = function (list) {
      /*Handle the case of elete from Device*/
      document.addEventListener("deviceready", function () {
        navigator.notification.confirm(
          "Are you sure you want to delete the list " + list.listName + "?", // the message
          function (index) {
            switch (index) {
              case 1:
                localListHandlerV2.deactivateList(list.listLocalId)
                  .then(function (ret) {
                    console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + JSON.stringify(ret));
                    $state.reload();
                  }, function (err) {
                    console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
                  });
                break;
              case 2:
                // The second button was pressed
                break;
            }
          },
          "Delete List", // a title
          ["Delete", "Cancel"]    // text of the buttons
        );
      });
      /*Handle the case for delete from Browser*/
      if (!(window.cordova)) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Delete List',
          template: 'Are you sure you want to delete this list ' + list.listName + "?"
        });

        confirmPopup.then(function (res) {
          if (res) {
            localListHandlerV2.deactivateList(list.listLocalId)
              .then(function (ret) {
                console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + JSON.stringify(ret));
                $state.reload();
              }, function (err) {
                console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
              });

          }
        })
      }
      ;
    };
    /*-------------------------------------------------------------------------*/
    /*Order list*/


    $scope.move = function (list, fromIndex, toIndex) {

      $scope.lists.splice(fromIndex, 1);
      $scope.lists.splice(toIndex, 0, list);
    };
    $scope.reorderFlag = false;
    $scope.toggleReorder = function () {
      $scope.reorderFlag = !$scope.reorderFlag;
    };
    /*--------------------------------------------------------------------------------*/

    /*Route to Add item Page*/
    $scope.addItem = function (listId) {
      console.log('list id sent : ' + listId);
      $state.go('item', {'listId': listId});
    };
    /*--------------------------------------------------------------------------------*/

    /*Share with Contact */

    $scope.getAllContacts = function (list) {
      /* $state.go('contact');*/
      contactHandler.pickContact(list);
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

    /*set the border color of the contact shown based on status*/
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
      console.log('20/03/2017 - listCtrl -aalatief - menu Pressed')
    };
    /*-----------------------------------------------------------------------------------------*/
    $scope.showListDetails = false;
   
      $scope.gesture = {
          used: ''
    };


/*    $scope.showListDetails = true;*/
    $scope.onGesture = function(gesture,listName) {
     $scope.gesture.used = gesture;
     alert(gesture+' '+listName);
     console.log(gesture);
        
    if  (gesture == 'Swipe Down'){
      $scope.showListDetails = !$scope.showListDetails;
  $scope.showList =  listName;
    };

    };

  });
