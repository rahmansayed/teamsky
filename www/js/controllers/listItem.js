angular.module('starter.controllers')
  .controller('listItem', function ($scope, $state, $ionicModal, $ionicPopup, $timeout, serverHandlerEntryV2, serverHandlerItemsV2, localItemHandlerV2, localEntryHandlerV2, localListHandlerV2, $ionicHistory, global, localRetailerHandlerV2,$ionicSideMenuDelegate,$ionicGesture) {

    $scope.items = [];
    $scope.entries = {
      listOpenEntries: {},
      listCrossedEntries: []
    };
    // $scope.listItems = [];
    // $scope.checkedItems = [];
    $scope.retailers = [];

    /*Drag to refresh functionality*/
    $scope.refresh = function () {

      console.log('Refreshing!');
      console.log('$scope.entries = ' + JSON.stringify($scope.entries));
      $timeout(function () {
        $state.reload();
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');

      }, 100);

    };
    localListHandlerV2.getSpecificList($state.params.listId)
      .then(function (response) {
        $scope.dynamicListTitle = response.listName;
      }, function (error) {
        console.log('Error');
      });


    /*------------------------------------------------------------------*/
    /*Load all Master Items*/
    if (global.masterItems) {
      $scope.items = global.masterItems;
    }
    else {
      localItemHandlerV2.getAllMasterItem().then(function (res) {
        $scope.items = res;
      })
    }

    localEntryHandlerV2.buildListEntries($state.params.listId).then(function () {
      $scope.entries = global.currentListEntries;
    });

    /*------------------------------------------------------------------*/
    /*Search for existing master item*/
    $scope.data = {"items": [], "search": ''};
    $scope.search = function () {
      /*console.log('Search pressed : ' + $scope.data.search);*/
      localItemHandlerV2.searchItems($scope.data.search).then(
        function (matches) {

          $scope.data.items = matches;
          console.log('Search Result after promise: ' + $scope.data.items);
        }
      )
};

    /*------------------------------------------------------------------*/
    /*Edit List Item*/
    $scope.editListItem = function (listItem) {
      $scope.selectedForEdit = listItem;
      console.log($scope.selectedForEdit.itemId);
      console.log($scope.selectedForEdit.listId);
      $state.go('edit-list-item', {'listItemId': listItem.itemId, 'listId': listItem.listId});
    };
    /*------------------------------------------------------------------*/
    /*Add searched item to current list*/
    $scope.selectItems = function (item) {
      $scope.selectedItem =
        {
          listLocalId: $state.params.listId,
          itemLocalId: item.itemLocalId,
          itemName: item.itemName,
          categoryName: localItemHandlerV2.categoryName(item.itemName),
          itemQuatity: 0,
          itemUom: "",
          itemRetailer: "",
          //entryCrossedFlag: item.entryCrossedFlag,
          language: item.language
        };
      console.log('Master Item Searched: ' + JSON.stringify($scope.entries.listOpenEntries));
      localEntryHandlerV2.addItemToList($scope.selectedItem, 'L')
        .then(function (res) {
          $scope.data.items = [];
          $scope.data.search = '';
          console.log('selectItem $scope.entries.listOpenEntries' + JSON.stringify($scope.entries.listOpenEntries));
          serverHandlerEntryV2.syncEntriesUpstream();
          //$scope.listItems = res.listOpenEntries;
          //$scope.checkedItems = res.listCrossedEntries;
          //$state.reload();
        }, function (error) {
          console.error('24/2/2017 - aalatief - Selected Item error: ' + JSON.stringify(error));
        });
    };
    /*------------------------------------------------------------------*/
    /*Check if all items in category are checked*/
    $scope.allListItemCategoryCrossed = function (category) {
      return localEntryHandlerV2.allListItemCategoryCrossed($scope.entries.listOpenEntries, category);
    };
    /*------------------------------------------------------------------*/
    /*Check item in list*/
    $scope.itemChecked = function (listItem) {
      console.log('24/2/2017 - aalatief - checked item: ' + JSON.stringify(listItem));
      localEntryHandlerV2.checkItem(listItem, $scope.entries).then(function (res) {
        console.log("listOpenEntries global.currentListEntries = " + JSON.stringify(global.currentListEntries));
        /*$scope.$apply(function () {
         $scope.selectedItems = res.listOpenEntries;
         $scope.checkedItems = res.listCrossedEntries;
         });*/
      });

      /*        .then(function (response) {
       $state.reload();
       }, function (error) {

       });*/


    };
    /*------------------------------------------------------------------*/

    /*UnCheck item in list*/
    $scope.unCheckItem = function (checkedItem) {
      console.log('24/2/2017 - aalatief - uncheck item: ' + JSON.stringify(checkedItem));
      localEntryHandlerV2.unCheckItem(checkedItem);

    };
    /*------------------------------------------------------------------*/

    /*Search Item Part*/
    $scope.data = {"items": [], "search": ''};

    $scope.search = function () {

      localItemHandlerV2.searchItems($scope.data.search).then(
        function (matches) {
          $scope.data.items = matches;
        }
      )
    };

    /*------------------------------------------------------------------*/


    /*Case item does not exist add Master Item*/
    $scope.addMasterItem = function (itemName) {

      console.log('Add Master Item Case: ' + itemName);
      $scope.enteredItem =
        {
          itemLocalId: new Date().getTime().toString(),
          itemName: localItemHandlerV2.initcap(itemName),
          categoryName: 'Uncategorized'
        };
      localItemHandlerV2.addMasterItem($scope.enteredItem)

        .then(function (response) {
            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item added' + JSON.stringify(response));
            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id' + JSON.stringify(response) + 'Entered Item Name: ' + $scope.enteredItem.itemName);

            $scope.selectedItem =
              {
                listLocalId: $state.params.listId,
                itemLocalId: response,
                itemName: localItemHandlerV2.initcap(itemName),
                categoryName: localItemHandlerV2.categoryName(itemName),
                itemCrossed: false,
                itemQuatity: 0,
                itemUom: "",
                itemRetailer: "",
                language: localItemHandlerV2.isRTL(itemName) ? 'AR' : 'EN'
              };
            localEntryHandlerV2.addItemToList($scope.selectedItem, 'L');
            $scope.data.items = [];
            $scope.data.search = '';
            serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
              serverHandlerEntryV2.syncEntriesUpstream();
//              $state.reload();
            }, function (err) {

            });

            //$state.reload();
            //$scope.$apply();
          },
          function (error) {

            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item errored' + JSON.stringify(error));
          }
        );
    }
    /*-----------------------------------------------------------------------------------------------*/
    /*Deactivate item from list*/
    $scope.removeFromList = function (listItem) {

      /*Handle the case of elete from Device*/
      document.addEventListener("deviceready", function () {
        navigator.notification.confirm(
          "Are you sure you want to delete item: " + listItem.itemName + "?", // the message
          function (index) {
            switch (index) {
              case 1:
                localEntryHandlerV2.deactivateItem(listItem, 'OPEN')
                  .then(function (ret) {
                    console.log('25/02/2017 - listItem - aalatief - Rows affected: ' + JSON.stringify(ret));
                    $state.reload();
                  }, function (err) {
                    console.log('25/02/2017 - listItem - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
                  });
                break;
              case 2:
                // The second button was pressed
                break;
            }
          },
          "Delete Item", // a title
          ["Delete", "Cancel"]    // text of the buttons
        );
      });
      /*Handle the case for delete from Browser*/
      if (!(window.cordova)) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Delete List',
          template: 'Are you sure you want to delete item: ' + listItem.itemName + "?"
        });

        confirmPopup.then(function (res) {
          if (res) {
            localEntryHandlerV2.deactivateItem(listItem, 'OPEN')
              .then(function (ret) {
                console.log('25/02/2017 - listItem - aalatief - Rows affected: ' + JSON.stringify(ret));
                //$state.reload();
                //$scope.$apply();
              }, function (err) {
                console.log('25/02/2017 - listItem - aalatief - ERROR Rows affected: ' + JSON.stringify(err));
              });

          }
        })
      }
      ;

    };
    /*-----------------------------------------------------------------------------------------------*/
    $scope.addQuickItem = function () {
      $state.go('item', {'listId': 1});
    };


    //This will hide the DIV by default.
    $scope.showItemDetails = false;
    
    $scope.show = function (listItem) {
      //If DIV is visible it will be hidden and vice versa.
      $scope.showItemDetails = true;
      $scope.entryLocalId = listItem.entryLocalId;
    };
    
    $scope.hide = function (entry) {
      //If DIV is visible it will be hidden and vice versa.
           setTimeout(function () {
           $scope.$apply(function(){
                    $scope.showItemDetails = false;
           });
         }, 1);
       
      $scope.entryLocalId = entry.entryLocalId;    

      console.log('11/03/2017 - listItem - aalatief - Entry Obj: ' + JSON.stringify(entry));
      localEntryHandlerV2.updateEntry(entry);

    };

    $scope.retailerList = null;
    //Declaring the function to load data from database
    $scope.fillretListetailerList = function () {
      localRetailerHandlerV2.getAllRetailers()
        .then(function (result) {
          $scope.retailerList = result;
          console.log('11/03/2017 - listItem - aalatief - Retailer: ' + JSON.stringify($scope.retailerList));
          $scope.retailerList.selected = $scope.retailerList[0];
        }, function (error) {

        });
    };
    //Calling the function to load the data on pageload
    $scope.fillretListetailerList();

    /*------------------------------------------------------------------*/
    /*Search for existing retailer*/
    $scope.retailerData = {"retailers": [], "search": ''};
    $scope.searchRetailer = function () {
      /*console.log('Search pressed : ' + $scope.data.search);*/
      localRetailerHandlerV2.search($scope.retailerData.search, $scope.retailerList).then(
        function (matches) {

          $scope.retailerData.retailers = matches;
          console.log('13/3/2017 - aalatief -Search Result after promise: ' + JSON.stringify($scope.retailerData.retailers));
        }
      )
    };
    
    $scope.getRetailerName = function(retailerLocalId){
       for (var i = 0; i <  $scope.retailerList.length ; i++) {
          if ( $scope.retailerList[i].retailerLocalId == retailerLocalId) {
           retailerName=$scope.retailerList[i].retailerName;
           return retailerName;
          }
           else{
               
               return 'anywhere'
           }
       }
        
    };

     /*-----------------------------------------------------------------------------------------*/

    /*set the border color of the contact shown based on status*/
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
      console.log('20/03/2017 - listItem -aalatief - menu Pressed')
    };
/*------------------------------------------------------------------*/

    

    //$scope.retailerList.selected = {retailerLocalId:1};
    /* vm.selected = $scope.retailerList[0];*/


    /* vm.selected = vm.values[0];*/
    /* $ionicModal.fromTemplateUrl('templates/searchItem.html', {
     scope: $scope
     }).then(function (modal) {
     $scope.modal = modal;
     });
     $scope.createContact = function (u) {
     $scope.contacts.push({name: u.firstName + ' ' + u.lastName});
     $scope.modal.hide();
     };*/


  })
;



