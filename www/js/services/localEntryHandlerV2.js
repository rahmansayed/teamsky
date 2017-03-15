angular.module('starter.services')

  .factory('localEntryHandlerV2', function ($q, $timeout, dbHandler, $state, global, serverHandlerEntryV2) {

    var selected = [];
    var items = [];

    /*Return all entries in array selectedItems*/
    function getAllEntry(listId) {
      var defer = $q.defer();
      var query = "SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag,e.retailerLocalId, e.language " +
        " FROM ( " +
        " (masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) " +
        " INNER JOIN masterItem_tl AS itl on e.language = itl.language and itl.itemlocalId = i.itemLocalId " +
        " INNER JOIN list AS l ON e.listLocalId = l.listLocalId) " +
        " INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId " +
        " where l.listLocalId = ? " +
        " and ifnull(e.deleted,'N')  !='Y'" +
        " and e.entryCrossedFlag = 0";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [listId], function (tx, result) {
          console.log("localEntryHandlerV2.getAllEntry query res = " + JSON.stringify(result));
          var entries = [];
          for (var i = 0; i < result.rows.length; i++) {
            entries.push(result.rows.item(i));
          }
          defer.resolve(entries);
        }, function (err) {
          console.error("localEntryHandlerV2.getAllEntry query err = " + err.message);
          defer.reject();
        });

        //update seen status
        global.db.transaction(function (tx) {
            var query2 = "update entry set seenFlag = 1 where origin = 'S' and seenFlag = 0 and listLocalId = ?";
            tx.executeSql(query2, [listId]);
            var query3 = "update list set newCount =0, deliverCount = 0, seenCount = 0, crossCount = 0 , updateCount = 0 where listLocalId = ?";
            tx.executeSql(query3, [listId]);
          }, function (err) {
            console.error("localEntryHandlerV2.getAllEntry query err = " + err.message);
          },
          function () {
            serverHandlerEntryV2.syncSeensUpstream();
          });
      }, function (err) {
        console.error("localEntryHandlerV2.getAllEntry query err = " + err.message);
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
        var query = "SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag, e.language" +
          " FROM ( " +
          "(masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) " +
          " INNER JOIN masterItem_tl AS itl on e.language = itl.language and itl.itemlocalId = i.itemLocalId " +
          " INNER JOIN list AS l ON e.listLocalId = l.listLocalId) " +
          " INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId " +
          " where l.listLocalId = ? and ifnull(e.deleted,'N')  !='Y'" +
          " and entryCrossedFlag = 1";

        tx.executeSql(query, [listLocalId], function (tx, res) {
          console.log("localEntryHandlerV2.getCheckedItem query res = " + JSON.stringify(res));
          var crossedEntries = [];
          for (var i = 0; i < res.rows.length; i++) {
            crossedEntries.push(res.rows.item(i));
          }
          console.log("localEntryHandlerV2.getCheckedItem crossedEntries = " + JSON.stringify(crossedEntries));
          deferred.resolve(crossedEntries);
        }, function (err) {
          console.error("localEntryHandlerV2.getCheckedItem query err = " + err.message);
        });
      }, function (err) {
        console.error("localEntryHandlerV2.getCheckedItem query err = " + err.message);
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
    /*check if item exit already in a list
     function itemExitInList(selectedItem) {
     for (var j = 0; j < selectedItems.length; j++) {
     if (selectedItems[j].listLocalId == selectedItem.listLocalId && selectedItems[j].itemName.toLowerCase() == selectedItem.itemName.toLowerCase()) {
     return true;
     }
     }
     ;
     return false;
     };
     */
    function itemExitInList(itemLocalId, entryList) {
      var idx = -1;
      for (var i = 0; i < entryList.length; i++) {
        if (entryList[i].itemLocalId == itemLocalId) {
          idx = i;
          break;
        }
      }
      return idx;
    }

    /*******************************************************************************************************************
     * add item to list and increment item usage, there are three cases:
     * 1. there is no entry in either crossed or not crossed undeleted for the item.
     * 2. there is a fresh entry for the item.
     * 3. there is a crossed entry for the item.
     * @param mySelectedItem
     */
    function addItemToList(mySelectedItem, listOpenEntries, listCrossedEntries) {
      console.log('addItemToList mySelectedItem = ' + JSON.stringify(mySelectedItem));
      console.log('addItemToList listOpenEntries = ' + JSON.stringify(listOpenEntries));
      console.log('addItemToList listCrossedEntries = ' + JSON.stringify(listCrossedEntries));
      var deferred = $q.defer();
      //search the item in the listOpen Entries
      var openIdx = itemExitInList(mySelectedItem.itemLocalId, listOpenEntries);
      console.log("addItemToList openIdx = " + openIdx);
      if (openIdx == -1) {
        //SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag,e.retailerLocalId
        global.db.transaction(function (tx) {
          var query = "INSERT INTO entry (entryLocalId,listLocalId,itemLocalId,entryServerId,quantity,uom,retailerLocalId,entryCrossedFlag,lastUpdateDate, origin, flag, deliveredFlag, seenFlag, language) " +
            "VALUES (null,?,?,'',1,'','',0,'', 'L', 'N', 0, 1, ?)";
          //SELECT i.itemLocalId, itl.itemName, itl.lowerItemName, c.categoryName , itl.language
          tx.executeSql(query, [mySelectedItem.listLocalId, mySelectedItem.itemLocalId, mySelectedItem.language], function (tx, res) {
            listOpenEntries.push({
              entryLocalId: res.insertId,
              listLocalId: mySelectedItem.listLocalId,
              itemLocalId: mySelectedItem.itemLocalId,
              itemName: mySelectedItem.itemName,
              categoryName: mySelectedItem.categoryName,
              quantity: 0,
              uom: '',
              retailerLocalId: '',
              language: mySelectedItem.language
            });
          }, function (err) {
            console.error('addItemToList insert error  = ' + err.message);
          });
          var updateQuery = "update masterItem set itemPriority = IFNULL(itemPriority,0)+1 where itemLocalId =  ?";
          tx.executeSql(updateQuery, [mySelectedItem.itemLocalId]);
          deferred.resolve({
            listOpenEntries: listOpenEntries,
            listCrossedEntries: listCrossedEntries
          });
        }, function (err) {
          console.error('addItemToList db error  = ' + err.message);
          deferred.reject(err);
        }, function () {
        });
      }

      var crossedIdx = itemExitInList(mySelectedItem.itemLocalId, listCrossedEntries);
      console.log("addItemToList crossedIdx = " + crossedIdx);

      if (crossedIdx != -1) {
        //SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag,e.retailerLocalId
        global.db.transaction(function (tx) {
          var query = "update entry set deleted = 'Y' " +
            "where entryLocalId = ?";
          //SELECT i.itemLocalId, itl.itemName, itl.lowerItemName, c.categoryName , itl.language
          tx.executeSql(query, [listCrossedEntries[crossedIdx].entryLocalId]);
          listCrossedEntries.splice(crossedIdx, 1);
        }, function (err) {
          console.error('addItemToList db error  = ' + err.message);
          deferred.reject(err);
        }, function () {
          deferred.resolve();
        });
      }
      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Mark item as crossed*/
    function crossEntry(entry, listOpenEntries, listCrossedEntries) {
      console.log('crossEntry entry = ' + JSON.stringify(entry));
      var deferred = $q.defer();
      var query = "update entry  set entryCrossedFlag='1', flag = 'E', lastUpdateDate=? where itemLocalId =? and listLocalId = ?";
// splicing the listOpenEntries
      console.log("crossEntry listOpenEntries before = " + JSON.stringify(listOpenEntries));
      for (var i = 0; i < listOpenEntries.length; i++) {
        if (listOpenEntries[i].entryLocalId == entry.entryLocalId) {
          listOpenEntries.splice(i, 1);
        }
      }
      console.log("crossEntry listOpenEntries after = " + JSON.stringify(listOpenEntries));
      //e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, c.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.seenFlag, e.language" +
      var newEntry = {
        entryLocalId: entry.entryLocalId,
        listLocalId: entry.listLocalId,
        itemLocalId: entry.itemLocalId,
        itemName: entry.itemName,
        categoryName: entry.categoryName,
        quantity: entry.quantity,
        uom: entry.uom,
        entryCrossedFlag: 1,
        language: entry.language
      };

      listCrossedEntries.push(newEntry);
      global.db.transaction(function (tx) {
        tx.executeSql(query, [new Date().getTime(), entry.itemLocalId, entry.listLocalId], function (response) {
          //Success Callback
          console.log('Update Entry with Check Flag!!!' + JSON.stringify(response));
          //checkedItems.push(listItem);
          serverHandlerEntryV2.syncCrossingsUpstream().then(function () {
            deferred.resolve({
              listOpenEntries: listOpenEntries,
              listCrossedEntries: listCrossedEntries
            });
          });
        }, function (err) {
          console.error(error);
          deferred.reject(error);
        });
      }, function (error) {
        console.error(error);
        deferred.reject(error);
      });

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Mark item as uncrossed*/
    function repeatEntry(entry, listOpenEntries, ListCrossedEntries) {
      console.log('repeatEntry entry = ' + JSON.stringify(entry));

      var deferred = $q.defer();

      global.db.transaction(function (tx) {
        var insert_query = "INSERT INTO entry " +
          "(entryLocalId,listLocalId,itemLocalId,entryCrossedFlag, entryServerId, origin, flag, deliveredFlag, seenFlag, language) " +
          "VALUES (null,?,?,0,'','L', 'N', 0, 1, ?)";

        var mark_query = "update entry set deleted = 'Y' where entryLocalId = ?";
        tx.executeSql(insert_query, [entry.listLocalId, entry.itemLocalId, entry.language], function(tx, res){
          var newEntry = {
            entryLocalId: res.insertId,
            listLocalId: entry.listLocalId,
            itemLocalId: entry.itemLocalId,
            itemName: entry.itemName,
            categoryName: entry.categoryName,
            quantity: entry.quantity,
            uom: entry.uom,
            language: entry.language
          };
          listOpenEntries.push(newEntry);
        });
        tx.executeSql(mark_query, [entry.entryLocalId]);
      }, function (error) {
        //Error Callback
        console.error('repeatEntry db error = ' + error);
        deferred.reject(error);
      }, function () {
        console.log('repeatEntry insert success');
        serverHandlerEntryV2.syncEntriesUpstream().then(function () {
          deferred.resolve();
        }, function (err) {
          deferred.reject(err);
        });

      });

      for (var k = 0; k < ListCrossedEntries.length; k++) {
        if (ListCrossedEntries[k].entryLocalId == entry.entryLocalId) {
          ListCrossedEntries.splice(k, 1);
          break;
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
      var query = "DELETE FROM entry WHERE listLocalId = ? and entryLocalId = ?";
      dbHandler.runQuery(query, [listItem.listLocalId, listItem.entryLocalId], function (response) {
        //Success Callback
        console.log(response);
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.error(error);
        deferred.reject(error);
      });

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Retrun entries for list*/
    function selectedItem(listLocalId) {
      return getAllEntry(listLocalId);
    };
    /*-------------------------------------------------------------------------------------*/
    /*Retrun crossed entries for list*/
    function checkedItem(listLocalId) {
      return getCheckedItem(listLocalId);
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
    function deactivateItem(entry) {
      var deferred = $q.defer();
      global.db.transaction(function (tx) {

          var deleteQuery = "update entry set deleted = 'Y' where entryLocalId = ?";
          tx.executeSql(deleteQuery, [entry.entryLocalId], function (tx, res) {
            console.log("localEntryHandlerV2.deactivateItem  deleteQuery res " + JSON.stringify(res));
            /* ret.rowsAffected = res.rowsAffected;*/
            deferred.resolve(res);
          }, function (err) {
            console.error("localEntryHandlerV2.deactivateItem  deleteQuery err " + err.message);
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
    /*******************************************************************************************************************
     *
     * @param entry
     */
    function updateEntry(entry) {
      var deferred = $q.defer();
      global.db.transaction(function (tx) {

          var updateQuery = "update entry set quantity = ?, uom=?, retailerLocalId = ?, flag = 'E' where entryLocalId = ?";
          tx.executeSql(updateQuery, [entry.quantity, entry.uom, entry.retailerLocalId, entry.entryLocalId], function (tx, res) {
            console.log("updateEntry res " + JSON.stringify(res));
            deferred.resolve(res);
            serverHandlerEntryV2.syncUpdatesUpstream();
          }, function (err) {
            console.error("updateEntry  updateQuery err " + err.message);
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
      deactivateItem: deactivateItem,
      updateEntry: updateEntry

    };
  });
