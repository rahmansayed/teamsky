angular.module('starter.controllers')
  .controller('editCtrl', function ($scope, $state,dbHandler,serverHandlerListV2,localListHandlerV2,$ionicPopup,contactHandler, global,$translate,settings,$window) {

    $scope.dynamicTitle = $translate.instant('EDIT_LIST');
    console.log('Edit List: ' + 'global.currentList' + angular.toJson(global.currentList));

    $scope.dynamicTitle = $translate.instant('EDIT_LIST')+ global.currentList.listName;
    $scope.list = angular.copy(global.currentList);
/*
    localListHandlerV2.getSpecificList($state.params.listId)
    .then(function(res){
        console.log('23/02/2017 - aalatief: specific List success:'+angular.toJson(res));
        $scope.list=angular.copy(res);

    },
    function(error){
        console.log('aalatief: specific List fail:'+angular.toJson(error));

    });
*/

    $scope.listUsers = global.currentList.contacts;
/*
    localListHandlerV2.getListUsers($state.params.listId)
    .then(function(res){
        console.log('23/03/2017 - aalatief: List userssuccess:'+angular.toJson(res));
        $scope.listUsers=/!*angular.copy(*!/res/!*)*!/;
    },
    function(error){
        console.log('aalatief: specific List fail:'+angular.toJson(error));

    });
*/
    /*Save List */
    $scope.saveList=function(){

        if    (!$scope.list.listName)  {
           document.getElementById('listError').innerHTML = "*You must enter list name.";

      }
        else{
            document.getElementById('listError').innerHTML = "";
        localListHandlerV2.update($scope.list)
        .then(function(response){
            $state.go('lists');
            console.log('23/2/2017 - aalatief: List local update success:'+angular.toJson($scope.list)+' , '+angular.toJson(response));
        },function(error){
            console.log('23/2/2017 - aalatief: List local update fail:'+angular.toJson($scope.list)+' , '+angular.toJson(error));
        },function(error){
        });

        serverHandlerListV2.updateList($scope.list)
        .then(function(result){
            console.log('23/2/2017 - aalatief: List Server update success:'+angular.toJson(result));
        },
        function(error){

             console.log('aalatief: List Server update fail:'+angular.toJson(error));
        });

    }
    };
    /*-----------------------------------------------------------------------------------*/
    /*RemoveRemove list user Function*/
    $scope.removeListUser = function (list, listUser) {
      /*Handle the case of elete from Device*/
       console.log('listUser :'+angular.toJson(listUser));
      document.addEventListener("deviceready", function () {
        navigator.notification.confirm(
          "Are you sure you want to remove this contact from list " + listUser.listName + "?", // the message
          function (index) {
            switch (index) {
              case 1:
                localListHandlerV2.kickContact(list.listLocalId,listUser.contactLocalId)
                  .then(function (ret) {
                    console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + angular.toJson(ret));
                            $scope.myGoBack();
                  }, function (err) {
                    console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + angular.toJson(err));
                  });
                    alert('delete'+listUser.contactName);

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
          template: 'Are you sure you want to remove this contact from list  ' + listUser.listName + "?"
        });

        confirmPopup.then(function (res) {
            alert('delete'+listUser.contactName);
          if (res) {
            localListHandlerV2.kickContact(listUser.listLocalId,list.contactLocalId)
              .then(function (ret) {
                console.log('22/02/2017 - listCtrl - aalatief - Rows affected: ' + angular.toJson(ret));
                $state.go('lists');
                $state.reload();
              }, function (err) {
                console.log('22/02/2017 - listCtrl - aalatief - ERROR Rows affected: ' + angular.toJson(err));
              });

          }
        })
      }
      ;

    };

/*Share with Contact */

    $scope.getAllContacts = function (list) {
       $state.go('edit');
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
    
    $scope.getDirection = function () {
//        console.log('userSetting: ' + angular.toJson(settings.userSetting));
      $scope.language = settings.getSettingValue('language');
//        console.log('getDirection: '+angular.toJson( $scope.language));
      if ($scope.language == 'english') {
        return {direction: "ltr",fontFamily:"AndikaNewBasic"};
      }
      else {
        return {direction: "rtl",fontFamily:"GessLight"};
      }

    }
      $scope.getImgDirection = function () {
      $scope.language = settings.getSettingValue('language');
      /* console.log('getDirection: '+angular.toJson( $scope.language));*/
      if ($scope.language == 'english') {
        return {transform: "scaleX(-1)"};
      }

      }
      
              $scope.myGoBack = function () {
       /*alert ('Back!!!');*/
        /*$ionicHistory.goBack();*/
            $window.history.go(-1);

    };

    /*-----------------------------------------------------------------------------------------*/
  });
