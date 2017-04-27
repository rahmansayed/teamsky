angular.module('starter.controllers')
  .controller('addListCtrl', function ($scope, $state, dbHandler, serverHandlerListV2, localListHandlerV2, contactHandler) {
    $scope.dynamicTitle = 'Create new list';


    /*Share with Contact */

    $scope.getAllContacts = function (list) {
      /* $state.go('contact');*/
      contactHandler.pickContact(list);
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

    $scope.saveList = function (list) {
              if    (!list)  {
           document.getElementById('listError').innerHTML = "*You must enter list name.";
    
      }  
        else{    
         document.getElementById('listError').innerHTML = "";
      console.log('aalatief - Entered List: '+JSON.stringify(list));
      localListHandlerV2.addNewList(list)
        .then(function (insertId) {
            console.log('aalatief: List insertId:' + JSON.stringify(insertId));
            list.listLocalId = insertId;
            //Server Call for Create List in Server DB
            serverHandlerListV2.createList(list)
              .then(function (result) {
                  console.log('aalatief: List Server create success:' + JSON.stringify(result));
                },
                function (error) {
                  console.log('aalatief: List Server create fail:' + JSON.stringify(error));
                }
              );
            console.log('04/02/2017 - aalatief - : Lists array after create:' + JSON.stringify(list));
            $state.go('lists');
          },
          function (err) {
            console.log('23/2/2017 - aalatief: List Server create fail:' + JSON.stringify(err));

          });


    }
    };
  });

