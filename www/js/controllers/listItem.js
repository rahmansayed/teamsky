angular.module('starter.controllers')
  .controller('listItem', function ($scope, $state, $ionicModal, $ionicPopup, $timeout, serverHandlerEntryV2, serverHandlerItemsV2, localItemHandlerV2, localEntryHandlerV2, localListHandlerV2, $ionicHistory,global) {

    $scope.items = [];
    $scope.selectedItems = [];
    $scope.checkedItems = [];


    /*Drag to refresh functionality*/
    $scope.refresh = function () {

      console.log('Refreshing!');
      $timeout(function () {
        $state.reload();
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');

      }, 100);

    };
    localListHandlerV2.getSpecificList($state.params.listId)
    .then(function(response){
        $scope.dynamicListTitle = response.listName;
    },function(error){
        console.log('Error');
    });


    /*------------------------------------------------------------------*/
    /*Load all Master Items*/
    $scope.items = global.masterItems||localItemHandlerV2.masterItems();
    /*------------------------------------------------------------------*/
    /*Load all entries related to specfi list*/
    $scope.listItems = localEntryHandlerV2.selectedItem($state.params.listId);


    /*------------------------------------------------------------------*/
    /*Load all checked entries related to specfi list*/
    $scope.checkedItems = localEntryHandlerV2.checkedItem($state.params.listId);


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
          entryCrossedFlag: item.entryCrossedFlag,
          language: item.language
        };
      console.log('Master Item Searched: ' + JSON.stringify($scope.selectedItem));
      localEntryHandlerV2.addItemToList($scope.selectedItem)
        .then(function (response) {
          console.log('24/2/2017 - aalatief - Selected Item success: ' + JSON.stringify($scope.selectedItem));
          serverHandlerEntryV2.syncEntriesUpstream();
          $state.reload();
        }, function (error) {
          console.log('24/2/2017 - aalatief - Selected Item error: ' + JSON.stringify(error));
        });
    };
    /*------------------------------------------------------------------*/
    /*Check if all items in category are checked*/
    $scope.allListItemCategoryCrossed = function (category) {
      return localEntryHandlerV2.allListItemCategoryCrossed($scope.listItems, category);
    };
    /*------------------------------------------------------------------*/
    /*Check item in list*/
    $scope.itemChecked = function (listItem) {
      console.log('24/2/2017 - aalatief - checked item: ' + JSON.stringify(listItem));
      localEntryHandlerV2.checkItem(listItem)
        .then(function (response) {
          $state.reload();
        }, function (error) {

        });

    };
    /*------------------------------------------------------------------*/

    /*UnCheck item in list*/
    $scope.unCheckItem = function (checkedItem) {
      console.log('24/2/2017 - aalatief - uncheck item: ' + JSON.stringify(checkedItem));
      localEntryHandlerV2.unCheckItem(checkedItem, $scope.checkedItems);
      $state.reload();
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

            localItemHandlerV2.getLocalItemId($scope.enteredItem.itemName)
              .then(function (response) {
                  console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id' + JSON.stringify(response) + 'Entered Item Name: ' + $scope.enteredItem.itemName);
                  itemLocalId = response;

                  $scope.selectedItem =
                    {
                      listLocalId: $state.params.listId,
                      itemLocalId: itemLocalId,
                      itemName: $scope.enteredItem.itemName,
                      categoryName: localItemHandlerV2.categoryName(itemName),
                      itemCrossed: false,
                      itemQuatity: 0,
                      itemUom: "",
                      itemRetailer: "",
                      language: "EN"
                    };
                  localEntryHandlerV2.addItemToList($scope.selectedItem);
                  serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
                    serverHandlerEntryV2.syncEntriesUpstream();
                  }, function (err) {

                  });

                  $state.reload();
                },
                function (error) {
                  console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id error' + JSON.stringify(error));

                }
              );

          },
          function (error) {

            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item errored' + JSON.stringify(error));
          });


    };
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
                localEntryHandlerV2.deactivateItem(listItem)
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
            localEntryHandlerV2.deactivateItem(listItem)
              .then(function (ret) {
                console.log('25/02/2017 - listItem - aalatief - Rows affected: ' + JSON.stringify(ret));
                $state.reload();
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

   /* $ionicModal.fromTemplateUrl('templates/searchItem.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.createContact = function (u) {
      $scope.contacts.push({name: u.firstName + ' ' + u.lastName});
      $scope.modal.hide();
    };*/

  });

