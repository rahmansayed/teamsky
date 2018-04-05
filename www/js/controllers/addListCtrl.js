angular.module('starter.controllers')
  .controller('addListCtrl', function ($scope, $state, dbHandler, serverHandlerListV2, localListHandlerV2, contactHandler,$translate,settings,$window) {
    $scope.dynamicTitle = $translate.instant('CREATE_LIST');
    $scope.list = {};

    /*Share with Contact */

    $scope.getAllContacts = function (list) {
       $state.go('add');
      contactHandler.pickContact(list);
      $state.reload();
    };

    $scope.showAllContacts = function(){
      contactHandler.chooseContact().then(function(contact){

      },function(){

      });
      $state.reload();
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
    
    $scope.saveList = function (list) {
              if    (!list.listName)  {
                console.log('4/5/2017 - List: '+angular.toJson(list));
           document.getElementById('listError').innerHTML = "*You must enter list name.";

      }  
        else{    
           
        list.listDescription = list.listDescription||"";
         document.getElementById('listError').innerHTML = "";
      console.log('aalatief - Entered List: '+angular.toJson(list));
      localListHandlerV2.addNewList(list)
        .then(function (insertId) {
            console.log('4/5/2017 - List: '+angular.toJson(list));
            console.log('aalatief: List insertId:' + angular.toJson(insertId));
            list.listLocalId = insertId;
            //Server Call for Create List in Server DB
            serverHandlerListV2.createList(list)
              .then(function (result) {
                  console.log('aalatief: List Server create success:' + angular.toJson(result));
                },
                function (error) {
                  console.log('aalatief: List Server create fail:' + angular.toJson(error));
                }
              );
            console.log('04/02/2017 - aalatief - : Lists array after create:' + angular.toJson(list));
            $state.go('lists');
          },
          function (err) {
            console.log('23/2/2017 - aalatief: List Server create fail:' + angular.toJson(err));

          });


    }
    };
  });

