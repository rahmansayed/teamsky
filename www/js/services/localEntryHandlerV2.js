angular.module('starter.services')

  .factory('localEntryHandlerV2', function ($q, $timeout, dbHandler, $state, global, serverHandlerEntryV2) {

    var selected = [];
    var items = [];
    var selectedItems = [];
    var checkedItems = [];
    var listId;


    /*Get searched items*/
    var searchItems = function (searchFilter) {
      console.log('Searching items for ' + searchFilter);
      var deferred = $q.defer();
      var matches = items.filter(function (item) {
        console.log('The item Returned from Search: ' + item.itemName.toLowerCase());
        if (item.itemName.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) return true;
      })

      console.log('items array: ' + JSON.stringify(items));
      /*      $timeout(function () {*/
      console.log('Matches : ' + JSON.stringify(matches));
      deferred.resolve(matches);

      /*      }, 100);*/

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Return all entries in array selectedItems*/
    function getAllEntry(listId) {
      var defer = $q.defer();
      var query = "SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, i.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag   " +
        "FROM ((masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) INNER JOIN list AS l ON e.listLocalId = l.listLocalId) INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId where l.listLocalId = ? and ifnull(e.deleted,'N')  !='Y'";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [listId], function (tx, result) {
          console.log("localEntryHandlerV2.getAllEntry query res = " + JSON.stringify(result));
          for (var i = 0; i < result.rows.length; i++) {
            selectedItems.push(result.rows.item(i));
          }
          defer.resolve(selectedItems);
        }, function (err) {
          console.log("localEntryHandlerV2.getAllEntry query err = " + err.message);
          defer.reject();
        });

        //update seen status
        global.db.transaction(function (tx) {
            var query2 = "update entry set seenFlag = 1 where origin = 'S' and seenFlag = 0 and listLocalId = ?";
            tx.executeSql(query2, [listId]);
            var query3 = "update list set newCount =0, deliverCount = 0, seenCount = 0, crossCount = 0 where listLocalId = ?";
            tx.executeSql(query3, [listId]);
          }, function (err) {
            console.log("localEntryHandlerV2.getAllEntry query err = " + err.message);
          },
          function () {
            serverHandlerEntryV2.syncSeensUpstream();
          });
      }, function (err) {
        console.log("localEntryHandlerV2.getAllEntry query err = " + err.message);
        defer.reject();
      }, function () {

      });
      return defer.promise;
    };

    /*-------------------------------------------------------------------------------------*/

    /*Return all checked entries in array checkedItems*/
    function getCheckedItem(listLocalId) {
      var deferred = $q.defer();

      global.db.transaction(function (tx) {
        var query = "SELECT i.itemName, i.itemLocalId, e.entryLocalId, e.entryCrossedFlag, e.lastUpdateDate, i.categoryLocalId, e.listLocalId FROM entry AS e INNER JOIN masterItem AS i ON e.itemLocalId = i.itemLocalId WHERE e.listLocalId= ? and e.entryCrossedFlag='1' and ifnull(e.deleted,'N')  !='Y'";
        tx.executeSql(query, [listLocalId], function (tx, res) {
          console.log("localEntryHandlerV2.getCheckedItem query res = " + JSON.stringify(res));
          for (var i = 0; i < res.rows.length; i++) {
            checkedItems.push(res.rows.item(i));
          }
          deferred.resolve(checkedItems);
        }, function (err) {
          console.log("localEntryHandlerV2.getCheckedItem query err = " + err.message);
        });
      }, function (err) {
        console.log("localEntryHandlerV2.getCheckedItem query err = " + err.message);
      }, function () {
      });

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/

    /*Sort items*/
    items = items.sort(function (a, b) {

      var itemA = a.itemName.toLowerCase();
      var itemB = b.itemName.toLowerCase();

      if (itemA > itemB) return 1;
      if (itemA < itemB) return -1;
      return 0;
    });

    /*-------------------------------------------------------------------------------------*/
    /*Check if entry is crossed*/
    function isItemChecked(listItem) {
      for (var j = 0; j < checkedItems.length; j++) {
        if (checkedItems[j].listLocalId == listItem.listLocalId && checkedItems[j].itemLocalId == listItem.itemLocalId) {
          return true;
        }
      }
      ;
      return false;
    };
    /*-------------------------------------------------------------------------------------*/
    /*check if item exit already in a list*/
    function itemExitInList(selectedItem) {
      for (var j = 0; j < selectedItems.length; j++) {
        if (selectedItems[j].listLocalId == selectedItem.listLocalId && selectedItems[j].itemName.toLowerCase() == selectedItem.itemName.toLowerCase()) {
          return true;
        }
      }
      ;
      return false;
    };
    /*******************************************************************************************************************
     * add item to list and increment item usage
     * @param mySelectedItem
     */
    function addItemToList(mySelectedItem) {
      console.log('Add Item to List Case: ' + JSON.stringify(mySelectedItem));
      var deferred = $q.defer();
      if (!itemExitInList(mySelectedItem)) {
        selectedItems.push(mySelectedItem);
        console.log('item added in list ' || mySelectedItem.categoryName);

        global.db.transaction(function (tx) {
          var query = "INSERT INTO entry (entryLocalId,listLocalId,itemLocalId,entryServerId,quantity,uom,retailerLocalId,entryCrossedFlag,lastUpdateDate, origin, flag, deliveredFlag, seenFlag) " +
            "VALUES (?,?,?,?,?,?,?,?,?, 'L', 'N', 0, 1)";

          tx.executeSql(query, [null/*new Date().getTime()*/, mySelectedItem.listLocalId, mySelectedItem.itemLocalId, '', 1, '', '', '0', new Date().getTime()]);
          var updateQuery = "update masterItem set itemPriority = IFNULL(itemPriority,0)+1 where itemLocalId =  ?";
          tx.executeSql(updateQuery, [mySelectedItem.itemLocalId]);
        }, function (err) {
          deferred.reject(err);
        }, function () {
          deferred.resolve();
        });
      }
      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Mark item as crossed*/
    function crossEntry(entry) {
      console.log('crossEntry isItemChecked = ' + isItemChecked(entry));
      var deferred = $q.defer();
      var query = "update entry  set entryCrossedFlag='1', flag = 'E', lastUpdateDate=? where itemLocalId =? and listLocalId = ?";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [new Date().getTime(), entry.itemLocalId, entry.listLocalId], function (response) {
          //Success Callback
          console.log('Update Entry with Check Flag!!!' + JSON.stringify(response));
          //checkedItems.push(listItem);
          serverHandlerEntryV2.syncCrossingsUpstream().then(function () {
            deferred.resolve(response);
          });
        }, function (err) {
          console.log(error);
          deferred.reject(error);
        });
      }, function (error) {
        console.log(error);
        deferred.reject(error);
      });

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Mark item as uncrossed*/
    function repeatEntry(entry, AllCheckedItems) {
      console.log('repeatEntry entry = ' + JSON.stringify(entry));

      var deferred = $q.defer();

      global.db.transaction(function (tx) {
        var insert_query = "INSERT INTO entry " +
          "(entryLocalId,listLocalId,itemLocalId,entryCrossedFlag, origin, flag, deliveredFlag, seenFlag) " +
          "VALUES (null,?,?,0,'L', 'N', 0, 1)";

        var mark_query = "update entry set deleted = 'Y' where entryLocalId = ?";
        tx.executeSql(insert_query, [entry.listLocalId, entry.itemLocalId]);
        tx.executeSql(mark_query, [entry.entryLocalId]);
      }, function (error) {
        //Error Callback
        console.log('repeatEntry db error = ' + error);
        deferred.reject(error);
      }, function () {
        console.log('repeatEntry insert success');
        serverHandlerEntryV2.syncEntriesUpstream().then(function () {
          deferred.resolve();
        }, function (err) {
          deferred.reject(err);
        });

      });

      for (var k = 0; k < AllCheckedItems.length; k++) {
        if ((AllCheckedItems[k].entryLocalId == entry.entryLocalId) && (AllCheckedItems[k].listLocalId == entry.listLocalId)) {
          AllCheckedItems.splice(k, 1);
        }
      }

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*delete entry*/
    //TODO change the delete logic to be applicable only if the server was acknoweldged
    function removeListItem(listItem) {
      for (var k = 0; k < selectedItems.length; k++) {
        if ((selectedItems[k].itemName == listItem.itemName) && (selectedItems[k].listLocalId == listItem.listLocalId)) {
          selectedItems.splice(k, 1);
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
    };
    /*-------------------------------------------------------------------------------------*/
    /*Retrun entries for list*/
    function selectedItem(listLocalId) {
      selectedItems = [];

      getAllEntry(listLocalId)
        .then(function (result) {
            selectedItems = result;
            console.log('aalatief: list items: ' + JSON.stringify(result));
          }
          , function (error) {
            console.log('aalatief: List Item Load Fail:' + JSON.stringify(error));
            ;
          });

      return selectedItems;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Retrun crossed entries for list*/
    function checkedItem(listLocalId) {
      checkedItems = [];

      getCheckedItem(listLocalId)
        .then(function (result) {
            checkedItems = result;
            console.log('aalatief: list checked items: ' + JSON.stringify(result));
          }
          , function (error) {
            console.log('aalatief: List checked Item Load Fail:' + JSON.stringify(error));
            ;
          });
      return checkedItems;
    }

    /*-------------------------------------------------------------------------------------*/
    function allListItemCategoryCrossed(selectedItems, category) {

      for (var i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].categoryName != category) {
          continue;
        }
        if (selectedItems[i].categoryName == category && selectedItems[i].entryCrossedFlag == 0) {
          return false;
          break;
        }

      }
      return true;
    }

    /*-------------------------------------------------------------------------------------*/
    /* deactivate item from list from the local db*/
    function deactivateItem(listItem) {
      var deferred = $q.defer();
      global.db.transaction(function (tx) {

          var deleteQuery = "update entry set deleted = 'Y' where entryLocalId = ?";
          tx.executeSql(deleteQuery, [listItem.entryLocalId], function (tx, res) {
            console.log("localEntryHandlerV2.deactivateItem  deleteQuery res " + JSON.stringify(res));
            /* ret.rowsAffected = res.rowsAffected;*/
            deferred.resolve(res);
          }, function (err) {
            console.log("localEntryHandlerV2.deactivateItem  deleteQuery err " + err.message);
            deferred.reject(err);
          });
        }
        ,
        function (err) {
          deferred.reject(err);
        }
      );
      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    return {
      selectedItem: selectedItem,
      checkedItem: checkedItem,
      addItemToList: addItemToList,
      allListItemCategoryCrossed: allListItemCategoryCrossed,
      checkItem: crossEntry,
      unCheckItem: repeatEntry,
      deactivateItem: deactivateItem

    };
  });
