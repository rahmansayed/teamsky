angular.module('starter.services')

  .factory('itemHandler', function ($q, $timeout, dbHandler, $state) {

    function getAllEntry(listId) {
      var defer = $q.defer();
      var query = "SELECT l.listLocalId,e.itemLocalId, i.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag    " +
        "FROM ((masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) INNER JOIN list AS l ON e.listLocalId = l.listLocalId) INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId where l.listLocalId = ? ";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [listId], function (tx, result) {
          console.log("localEntryHandlerV2.getAllEntry query res = " + JSON.stringify(res));
          defer.resolve(response.rows);
        }, function (err) {
          console.log("localEntryHandlerV2.getAllEntry query err = " + err.message);
          defer.reject();
        });
      }, function (err) {
        console.log("localEntryHandlerV2.getAllEntry query err = " + err.message);
        defer.reject();
      }, function () {

      });
      return defer.promise;
    };

    //Get Checked ITems
    function getCheckedItem() {
      var defer = $q.defer();

      global.db.transaction(function (tx) {
        var query = "SELECT i.itemName, i.itemLocalId, e.entryLocalId, e.entryCrossedFlag, e.lastUpdateDate, i.categoryLocalId, e.listLocalId FROM entry AS e INNER JOIN masterItem AS i ON e.itemLocalId = i.itemLocalId WHERE e.listLocalId= ? and e.entryCrossedFlag='1'";
        tx.executeSql(query, [$state.params.listId], function (tx, res) {
          console.log("localEntryHandlerV2.getCheckedItem query res = " + JSON.stringify(res));
          checkedItem = response.rows;
          deferred.resolve(response);
        }, function (err) {
          console.log("localEntryHandlerV2.getCheckedItem query err = " + err.message);
        });
      }, function (err) {
        console.log("localEntryHandlerV2.getCheckedItem query err = " + err.message);
      }, function () {
      });

      return defer.promise;
    };


    function getCheckedSuccessCB(response) {

      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          checkedItems.push({
            listLocalId: response.rows.item(i).listLocalId,
            itemLocalId: response.rows.item(i).itemLocalId,
            itemName: response.rows.item(i).itemName,
            entryCrossedFlag: response.rows.item(i).entryCrossedFlag,
            entryLocalId: response.rows.item(i).entryLocalId
          });
          console.log('Item Handler create item:' + checkedItems);
        }
      } else {
        var message = "No Checked items created till now.";
      }
    };

    function getCheckedErrorCB(error) {
      var message = "Some error occurred in fetching Checekd items";
    }
    ;

    items = items.sort(function (a, b) {

      var itemA = a.itemName.toLowerCase();
      var itemB = b.itemName.toLowerCase();

      if (itemA > itemB) return 1;
      if (itemA < itemB) return -1;
      return 0;
    });
    //Setting selectem Item Array


    function getEntrySuccessCB(response) {

      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          selectedItems.push({
            listLocalId: response.rows.item(i).listLocalId,
            itemLocalId: response.rows.item(i).itemLocalId,
            itemName: response.rows.item(i).itemName,
            categoryName: response.rows.item(i).categoryName,
            retailerName: response.rows.item(i).retailerName,
            vendorName: response.rows.item(i).vendorName,
            quantity: response.rows.item(i).quantity,
            uom: response.rows.item(i).uom,
            entryCrossedFlag: response.rows.item(i).entryCrossedFlag
          });
        }
      } else {
        var message = "No entry created till now.";
      }
    };

    function getEntryErrorCB(error) {
      var loadingLists = false;
      var message = "Some error occurred in fetching entry";
    }
    ;


    //var selectedItems = angular.fromJson(window.localStorage['selectedItems']||[]);

    // var checkedItems = angular.fromJson(window.localStorage['checkedItems']||[]);

    function saveToLocalStorage() {

      window.localStorage['entry'] = angular.toJson(selectedItems);
    };


    function initcap(name) {
      var returnedName = name.substring(0, 1).toUpperCase()
        + name.substring(1, name.length).toLowerCase();
      return returnedName;
    };


    function isItemChecked(listItem) {
      for (var j = 0; j < checkedItems.length; j++) {
        if (checkedItems[j].listLocalId == listItem.listLocalId && checkedItems[j].itemLocalId == listItem.itemLocalId) {
          return true;
        }
      }
      ;
      return false;
    };

    function itemExitInList(selectedItem) {
      for (var j = 0; j < selectedItems.length; j++) {
        if (selectedItems[j].listLocalId == selectedItem.listLocalId && selectedItems[j].itemName.toLowerCase() == selectedItem.itemName.toLowerCase()) {
          return true;
        }
      }
      ;
      return false;
    };

    function addItemToList(mySelectedItem) {
      console.log('Add Item to List Case: ' + JSON.stringify(mySelectedItem));
      if (!itemExitInList(mySelectedItem)) {
        selectedItems.push(mySelectedItem);
        saveToLocalStorage();
        console.log('item added in list ' || mySelectedItem.categoryName);

        //Sqlite
        var deferred = $q.defer();
        var query = "INSERT INTO entry (entryLocalId,listLocalId,itemLocalId,entryServerId,quantity,uom,retailerLocalId,entryCrossedFlag,lastUpdateDate) VALUES (?,?,?,?,?,?,?,?,?)";
        dbHandler.runQuery(query, [null/*new Date().getTime()*/, mySelectedItem.listLocalId, mySelectedItem.itemLocalId, '', 1, '', '', '0', new Date().getTime()], function (response) {
          //Success Callback
          console.log(response);
          deferred.resolve(response);
        }, function (error) {
          //Error Callback
          console.log(error);
          deferred.reject(error);
        });

        return deferred.promise;
      }
      console.log('item exist in list');
    };


    function checkItem(listItem) {
      console.log('Is Item Checked: ' + isItemChecked(listItem));
      if (!isItemChecked(listItem)) {
        checkedItems.push(listItem);
        //window.localStorage['checkedItems'] = angular.toJson(checkedItems) ;

        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemLocalId == listItem.itemLocalId) {
            console.log('Item Checked in array: ' + listItem.itemLocalId);
            selectedItems[i].entryCrossedFlag = '1';
            console.log('entryCrossedFlag after array update' + selectedItems[i].entryCrossedFlag);
            //saveToLocalStorage();
            /*return;*/
            var deferred = $q.defer();
            var query = 'update entry  set entryCrossedFlag=1,lastUpdateDate=? where itemLocalId =? and listLocalId = ?';

            dbHandler.runQuery(query, [new Date().getTime(), listItem.itemLocalId, listItem.listLocalId], function (response) {
              //Success Callback
              console.log('Update Entry with Check Flag!!!');
              console.log(response);
              deferred.resolve(response);
            }, function (error) {
              //Error Callback
              console.log(error);
              deferred.reject(error);
            });

            return deferred.promise;

          }
        }
        ;

      }
    };

    function unCheckItem(checkedItem) {
      console.log('Is Item Checked: ' + isItemChecked(checkedItem));
      if (isItemChecked(checkedItem)) {
        var deferred = $q.defer();
        var query = 'update entry  set entryCrossedFlag=0,lastUpdateDate=? where itemLocalId =? and listLocalId = ?';

        dbHandler.runQuery(query, [new Date().getTime(), checkedItem.itemLocalId, checkedItem.listLocalId], function (response) {
          //Success Callback
          console.log('Update Entry with uncheck Flag!!!');
          console.log(response);
          deferred.resolve(response);
        }, function (error) {
          //Error Callback
          console.log(error);
          deferred.reject(error);
        });

        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemName == checkedItem.itemName) {
            selectedItems[i].entryCrossedFlag = '0';
            //saveToLocalStorage();

          }
        }
        for (var k = 0; k < checkedItems.length; k++) {
          if ((checkedItems[k].itemName == checkedItem.itemName) && (checkedItems[k].listLocalId == checkedItem.listLocalId)) {
            checkedItems.splice(k, 1);
            //window.localStorage['checkedItems'] = angular.toJson(checkedItems) ;
            //return;
          }
        }
        ;
        return deferred.promise;


      }
    };
    function removeListItem(listItem) {
      for (var k = 0; k < selectedItems.length; k++) {
        if ((selectedItems[k].itemName == listItem.itemName) && (selectedItems[k].listLocalId == listItem.listLocalId)) {
          selectedItems.splice(k, 1);
          //saveToLocalStorage();
          // return;
        }
      }
      ;
      var deferred = $q.defer();
      var query = "DELETE FROM entry WHERE listLocalId = ? and itemLocalId = ?";
      dbHandler.runQuery(query, [listItem.listLocalId, listItem.itemLocalId], function (response) {
        //Success Callback
        console.log(response);
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.log(error);
        deferred.reject(error);
      });

      return deferred.promise;
    }

    return {
      item: function () {

        return items;
      },

      selectedItem: function () {
        selectedItems = [];

        x = getAllEntry($state.params.listId)
          .then(getEntrySuccessCB, getEntryErrorCB);
        console.log('Entry Items from selectedItem function: ' + JSON.stringify(selectedItems));
        return selectedItems;
      },

      getAllEntry: getAllEntry,
      searchItems: searchItems,
      initcap: function (name) {
        return initcap(name);
      },
      checkedItem: function () {
        return checkedItems;
      },
      selectedItemByListId: function (listId) {
        var specificList = [];
        for (var i = 0; i < selectedItems.length; i++) {
          if (selectedItems[i].listLocalId == listId) {
            specificList.push(selectedItems[i]);
          }
        }
        ;
        return specificList;
      },

      isItemChecked: function (listItem) {
        isItemChecked(listItem);
      },

      addItemToList: addItemToList,

      checkItem: checkItem,

      unCheckItem: unCheckItem,
      getLocalItemId: getLocalItemId,


      removeListItem: removeListItem,

      AddMasterItem: addMaserItem,

      deleteAll: function () {

        for (var i = 0; i < selectedItems.length; i++) {

          selectedItems.splice(i, 1);
          saveToLocalStorage();
        }
      }
      ,
      categoryName: function (itemName) {
        /*console.log(itemName);*/
        for (var i = 0; i < items.length; i++) {

          if (items[i].itemName == itemName) {
            console.log('Category Name Function: ' + items[i].categoryName);
            return items[i].categoryName;
          }
        }

      }
      ,

      getItemById: function (itemId) {
        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemLocalId == itemId) {
            return selectedItems[i];
          }
        }
        return undefined;
      },
      allListItemCategoryCrossed: function (category) {
        /*console.log(itemName);*/
        for (var i = 0; i < selectedItems.length; i++) {
          /* console.log(selectedItems.length);*/
          if (selectedItems[i].categoryName != category) {
            /*console.log('Item: '+selectedItems[i].itemName+'Category: ' + selectedItems[i].categoryName );*/
            continue;
          }
          /*console.log(selectedItems[i].categoryName);
           console.log(selectedItems[i].itemCrossed);*/
          if (selectedItems[i].categoryName == category && selectedItems[i].entryCrossedFlag == 0) {
            /*console.log('Item: '+selectedItems[i].itemName+'Category: ' + selectedItems[i].categoryName + 'Crossed: '+selectedItems[i].itemCrossed);
             console.log(false);*/
            return false;
            break;
          }

        }
        /*console.log(true);*/
        return true;

      },
      updateListItem: function (listItem) {

        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemLocalId === listItem.itemLocalId) {
            selectedItems[i] = listItem;
            saveToLocalStorage();
            console.log('Update List item Call' + JSON.stringify(selectedItems[i]));
            return;
          }
        }
        ;
      }

    };
  });
