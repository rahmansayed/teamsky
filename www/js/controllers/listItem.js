angular.module('starter.controllers')
  .controller('listItem', function ($scope, $state, $ionicModal, $ionicPopup, $timeout, serverHandlerEntryV2, serverHandlerItemsV2, localItemHandlerV2, localEntryHandlerV2, localListHandlerV2, $ionicHistory, global, localRetailerHandlerV2, $ionicSideMenuDelegate, $ionicGesture, localUOMHandlerV2, $translate, $ionicModal, $ionicPopover) {


    $scope.uoms = [];
    $scope.retailerList = [];
    $scope.items = [];
    $scope.entries = {
      listOpenEntries: {},
      listCrossedEntries: []
    };
    // $scope.listItems = [];
    // $scope.checkedItems = [];
    $scope.retailers = [];
    $scope.suggestedItem = [];


    localUOMHandlerV2.getAllUOMs().then(function (uoms) {
      $scope.uoms = uoms;
      console.log('listItem $scope.uoms = ' + angular.toJson($scope.uoms));
    });
    $scope.myUserId = global.userServerId;
    /*Drag to refresh functionality*/

    $scope.refresh = function () {

      console.log('Refreshing!');
      console.log('$scope.entries = ' + angular.toJson($scope.entries));
      $timeout(function () {
        $state.reload();
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');

      }, 100);

    };
    $scope.dynamicListTitle = global.currentList.listName;

    console.log('$state.params = ' + angular.toJson($state.params));
    // localListHandlerV2.getSpecificList($state.params.listLocalId)
    //   .then(function (response) {
    //
    //   }, function (error) {
    //     console.log('Error');
    //   });


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

    global.status = 'foreground';
    localEntryHandlerV2.buildListEntries(global.currentList.listLocalId).then(function () {
      $scope.entries = global.currentListEntries;
      $scope.suggestedItem = global.suggestedItem.suggested;
      console.log('4/5/2017 - $scope.suggestedItem = ' + angular.toJson($scope.suggestedItem));
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
          listLocalId: global.currentList.listLocalId,
          itemLocalId: item.itemLocalId,
          itemName: item.itemName,
          categoryName: localItemHandlerV2.categoryName(item.itemName),
          quantity: 1,
          uom: "",
          retailerLocalId: "",
          retailerName: "",
          userServerId: global.userServerId,
          //entryCrossedFlag: item.entryCrossedFlag,
          language: item.language,
          flag: 1
        };
      console.log('Master Item Searched: ' + angular.toJson($scope.entries.listOpenEntries));
      localEntryHandlerV2.addItemToList($scope.selectedItem, 'L')
        .then(function (res) {
          $scope.data.items = [];
          $scope.data.search = '';
          console.log('selectItem $scope.entries.listOpenEntries' + angular.toJson($scope.entries.listOpenEntries));
          serverHandlerEntryV2.syncEntriesUpstream();
          //$scope.listItems = res.listOpenEntries;
          //$scope.checkedItems = res.listCrossedEntries;
          //$state.reload();
        }, function (error) {
          console.error('24/2/2017 - aalatief - Selected Item error: ' + angular.toJson(error));
        });
    };
    /*------------------------------------------------------------------*/
    /*Check item in list*/
    $scope.itemChecked = function (listItem) {
      console.log('24/2/2017 - aalatief - checked item: ' + angular.toJson(listItem));
      localEntryHandlerV2.checkItem(listItem, $scope.entries).then(function (res) {
        console.log("listOpenEntries global.currentListEntries = " + angular.toJson(global.currentListEntries));
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
      console.log('24/2/2017 - aalatief - uncheck item: ' + angular.toJson(checkedItem));
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
          categoryName: 'New Items'
        };
      localItemHandlerV2.addMasterItem($scope.enteredItem)

        .then(function (response) {
            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item added' + angular.toJson(response));
            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id' + angular.toJson(response) + 'Entered Item Name: ' + $scope.enteredItem.itemName);

            $scope.selectedItem =
              {
                listLocalId: global.currentList.listLocalId,
                itemLocalId: response,
                itemName: localItemHandlerV2.initcap(itemName),
                categoryName: $scope.enteredItem.categoryName,
                itemCrossed: false,
                quantity: 1,
                uom: "",
                retailerLocalId: "",
                userServerId: global.userServerId,
                retailerName: "",
                language: localItemHandlerV2.isRTL(itemName) ? 'AR' : 'EN',
                flag:1
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

            console.log('07/02/2017 - listItemCtrl - aalatief:Master Item errored' + angular.toJson(error));
          }
        );
    }
    /*-----------------------------------------------------------------------------------------------*/
    /*Deactivate item from list*/
    $scope.removeFromList = function (listItem) {

      /*Handle the case of elete from Device*/
      document.addEventListener("deviceready", function () {
        navigator.notification.confirm(
          $translate.instant('CONFIRM_DELETE_ITEM') + listItem.itemName + "?", // the message
          function (index) {
            switch (index) {
              case 1:
                localEntryHandlerV2.deactivateItem(listItem, 'OPEN')
                  .then(function (ret) {
                    console.log('25/02/2017 - listItem - aalatief - Rows affected: ' + angular.toJson(ret));
                    $state.reload();
                  }, function (err) {
                    console.log('25/02/2017 - listItem - aalatief - ERROR Rows affected: ' + angular.toJson(err));
                  });
                break;
              case 2:
                // The second button was pressed
                break;
            }
          },
          $translate.instant('DELETE_ITEM'), // a title
          [$translate.instant('DELETE'), $translate.instant('CANCEL')]    // text of the buttons
        );
      });
      /*Handle the case for delete from Browser*/
      if (!(window.cordova)) {
        var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('DELETE_ITEM'),
          template: $translate.instant('CONFIRM_DELETE_ITEM') + listItem.itemName + "?"
        });

        confirmPopup.then(function (res) {
          if (res) {
            localEntryHandlerV2.deactivateItem(listItem, 'OPEN')
              .then(function (ret) {
                console.log('25/02/2017 - listItem - aalatief - Rows affected: ' + angular.toJson(ret));
                //$state.reload();
                //$scope.$apply();
              }, function (err) {
                console.log('25/02/2017 - listItem - aalatief - ERROR Rows affected: ' + angular.toJson(err));
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
    /*-----------------------------------------------------------------------------------------*/
    $scope.updateEntry = function (entry) {
      //If DIV is visible it will be hidden and vice versa.

      setTimeout(function () {
        $scope.$apply(function () {
          $scope.showItemDetails = false;
        });
      }, 1);

      $scope.entryLocalId = entry.entryLocalId;

      console.log('11/03/2017 - listItem - aalatief - Entry Obj: ' + angular.toJson(entry));


      localRetailerHandlerV2.addRetailer(entry.retailerName)
        .then(function (response) {
          entry.retailerLocalId = response;
          console.log('4/4/2017 - listItem - aalatief - retailer local Id' + entry.retailerLocalId + ' New Retailer: ' + angular.toJson(entry.retailerName));
          console.log('4/4/2017 - listItem - aalatief - Entry' + angular.toJson(entry));
          localEntryHandlerV2.updateEntry(entry);

        }, function (error) {
          console.error('4/4/2017 - listItem - aalatief - Error: ' + angular.toJson(error));
        });


    };
    /*------------------------------------------------------------------------------------------------------*/

    //Declaring the function to load data from database
    $scope.fillretListetailerList = function () {
      localRetailerHandlerV2.getAllRetailers()
        .then(function (result) {
          $scope.retailerList = result;
          console.log('11/03/2017 - listItem - aalatief - Retailer: ' + angular.toJson($scope.retailerList));
          $scope.retailerList.selected = $scope.retailerList[0];
        }, function (error) {

        });
    };
    /*-----------------------------------------------------------------------------------------------*/
    //Calling the function to load the data on pageload
    $scope.fillretListetailerList();
    $scope.showRetailerlist = true;
    /*------------------------------------------------------------------*/
    /*Search for existing retailer*/
    $scope.retailerData = {"retailers": [], "search": ''};
    $scope.searchRetailer = function (retailerName) {
      /*console.log('Search pressed : ' + $scope.data.search);*/
      localRetailerHandlerV2.search(retailerName, $scope.retailerList).then(
        function (matches) {

          $scope.retailerData.retailers = matches;
          console.log('13/3/2017 - aalatief -Search Result after promise: ' + angular.toJson($scope.retailerData.retailers));
        }
      )
    };

    /*---------------------------------------------------------------------------*/
    $scope.slideLeft = function () {
      /*set the border color of the contact shown based on status*/
      $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
        console.log('20/03/2017 - listItem -aalatief - menu Pressed')
      };
      /*------------------------------------------------------------------*/
      // Grab the content
      var content = element[0].querySelector('.item-content');

      // Grab the buttons and their width
      var buttons = element[0].querySelector('.item-options');

      if (!buttons) {
        console.log('There are no option buttons');
        return;
      }
      var buttonsWidth = buttons.offsetWidth;

      ionic.requestAnimationFrame(function () {
        content.style[ionic.CSS.TRANSITION] = 'all ease-out .25s';

        if (!buttons.classList.contains('invisible')) {
          console.log('close');
          content.style[ionic.CSS.TRANSFORM] = '';
          setTimeout(function () {
            buttons.classList.add('invisible');
          }, 250);
        } else {
          buttons.classList.remove('invisible');
          content.style[ionic.CSS.TRANSFORM] = 'translate3d(-' + buttonsWidth + 'px, 0, 0)';
        }
      });
    };

    $scope.account = function () {
      $ionicSideMenuDelegate.toggleLeft();
      $state.go('account');
    };


    $ionicModal.fromTemplateUrl('templates/itemDetails.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.openModal = function (item) {
      $scope.selectedItem = item;
      $timeout(function () {
        $scope.modal.show();
      }, 0)
    }

    $scope.closeModal = function () {
      $scope.modal.hide();
    }


    $ionicPopover.fromTemplateUrl('templates/itemPopover.html', {
      scope: $scope
    }).then(function (popover) {
      $scope.popover = popover;

    });

    $scope.showItemDetails = true;

    $scope.showHideItemDetails = function () {

      $scope.showItemDetails = !$scope.showItemDetails;
      /*alert ($scope.showListDetails);*/
    };

    $scope.changeFoldAll = function () {

      foldStatus = $scope.entries.listOpenEntries.categories[0].foldStatus;
      for (var i = 0; i < $scope.entries.listOpenEntries.categories.length; i++) {
        console.log('Status of Zero' + foldStatus);
        console.log('Fold/Unfold: ' + i + ' ' + $scope.entries.listOpenEntries.categories[i].foldStatus);
        if (foldStatus) {
          console.log('case 1');
          $scope.entries.listOpenEntries.categories[i].foldStatus = false;
        }
        else {
          console.log('case 2');
          $scope.entries.listOpenEntries.categories[i].foldStatus = true;
        }

      }
    };

    $scope.data = {
      showDelete: false
    };

    $scope.closeButton = false;

    $scope.openSuggest = function () {

      document.getElementById('suggest').style.cssText = 'position:fixed;top:150%;left: 25%;z-index: 3;opacity: 0.95;width:80%;';
      document.getElementById('suggestButton').style.cssText = 'position:fixed;top:110px;left: 45%;z-index: 1;';
      document.getElementById('suggestContent').style.cssText = 'z-index:4;height:50%;margin-left:40%;background-color:yellow;';
      document.getElementById('suggestButtonClose').style.cssText = 'position:fixed;top:110px;left: 18%;z-index: 2;';
      document.getElementById('suggestList').style.cssText = 'margin-left:10%';
      $scope.closeButton = true;

    };
    
      $scope.getImgDirection = function () {
      $scope.language = settings.getSettingValue('language');
      /* console.log('getDirection: '+angular.toJson( $scope.language));*/
      if ($scope.language == 'english') {
        return {transform: "scaleX(-1)"};
      }

      }

    $scope.closeSuggest = function () {

      document.getElementById('suggest').style.cssText = 'position:fixed;top:150%;left: 100%;z-index: 3;opacity: 0.95;width:80%;';
      document.getElementById('suggestButton').style.cssText = 'position:fixed;top:110px;left: 80%;z-index: 2;';
      document.getElementById('suggestContent').style.cssText = 'z-index:4;height:50%;margin-left:95                                                                                                        %;background-color:yellow;';
      document.getElementById('suggestButtonClose').style.cssText = 'position:fixed;top:110px;left: 95%;z-index: 1;';
      //document.getElementById('suggestList').style.cssText ='width;';
      $scope.closeButton = false;
    };
    //This will show the entry DIV by default.


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



