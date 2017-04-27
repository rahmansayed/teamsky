angular.module('starter.controllers')
  .controller('listCtrl', function ($scope, $state, $ionicPopup, $cordovaContacts, dbHandler, contactHandler, $timeout, $http, global, localListHandlerV2, $filter, $ionicHistory, $ionicSideMenuDelegate, $ionicGesture,$ionicPopover,$translate) {


    /* $ionicHistory.nextViewOptions({
     disableBack: true

     });*/
      $scope.data = {
        showDelete: false
      };

    $scope.myUserId = global.userServerId;

    /*Retrieve all lists from localListHandlerV2*/

    $scope.lists = {};
    localListHandlerV2.getAllLists()
      .then(function (lists) {
          $scope.lists = lists;
          console.log('listCtrl - localListHandlerV2 $scope.lists :' + JSON.stringify($scope.lists));
        },
        function (error) {
          console.log('listCtrl - localListHandlerV2 ERROR $scope.lists:' + JSON.stringify(error));
        });


    $scope.data = {selectedContacts: []};
    /*-----------------------------------------------------------------------------------

     /*Route to Edit List Page*/
    $scope.editList = function (list) {
      global.currentList = list;
      $state.go('edit');
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
          $translate.instant('CONFIRM_DELETE') + list.listName + $translate.instant('QUESTION_MARK'), // the message
          function (index) {
            switch (index) {
              case 1:
                localListHandlerV2.deactivateList(list)
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
          $translate.instant('DELETE_LIST'), // a title
          [$translate.instant('DELETE'), $translate.instant('CANCEL')]    // text of the buttons
        );
      });
      /*Handle the case for delete from Browser*/
      if (!(window.cordova)) {
        var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('DELETE_LIST'),
          template:  $translate.instant('CONFIRM_DELETE') + list.listName +$translate.instant('QUESTION_MARK')
        });

        confirmPopup.then(function (res) {
          if (res) {
            localListHandlerV2.deactivateList(list)
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

      $scope.lists.lists.splice(fromIndex, 1);
      $scope.lists.lists.splice(toIndex, 0, list);
    };
    $scope.reorderFlag = false;
    $scope.toggleReorder = function () {
      $scope.reorderFlag = !$scope.reorderFlag;
    };
    /*--------------------------------------------------------------------------------*/

    /*Route to Add item Page*/
    $scope.addItem = function (list) {
      console.log('list id sent : ' + JSON.stringify(list));
      global.currentList = list;
      $state.go('item');
    };
    /*--------------------------------------------------------------------------------*/

    /*Share with Contact */

    $scope.getAllContacts = function (list) {
      /* $state.go('contact');*/
      contactHandler.pickContact(list);
    };
    /*----------------------------------------------------------------------------------------*/
    /*set the color of the contact shown based on status*/
    $scope.setColor = function (status, element) {

      if (element == 'color') {
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
      else if (element == 'border') {
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
    $scope.showListDetails = true;

    $scope.showHideListDetails = function (){

        $scope.showListDetails=!$scope.showListDetails;
        /*alert ($scope.showListDetails);*/
    };

    $scope.gesture = {
      used: ''
    };

    /*   --------------------Show Details based on gesture ------------------------*/
/*    $scope.onGesture = function (gesture, listName) {
      $scope.gesture.used = gesture;
        alert(gesture+' '+listName);
      console.log(gesture);

      if (gesture == 'Swipe Down') {
        $scope.showListDetails = true;
        $scope.showList = listName;
      }
      ;

      if (gesture == 'Swipe Up') {
        $scope.showListDetails = false;
        $scope.showList = listName;
      }
      ;

    };*/
    /*---------------------------------------------------------------------------*/
    /*set the border color of the contact shown based on status*/
    $scope.account = function () {
      $ionicSideMenuDelegate.toggleLeft();
      $state.go('account');
    };


    $ionicPopover.fromTemplateUrl('templates/listPopover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;

  });
  /*$scope.openPopover = function($event) {

    alert('Popover Show: '+JSON.stringify($event)   );
   $scope.popover.show($event);

  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };
 // Perform Action on destroy
   $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
  // Perform action on hide popover
  $scope.$on('popover.hidden', function() {
    // Perform action
  });
  // Perform action on remove popover
  $scope.$on('popover.removed', function() {
    // Perform action
  });*/

  });
