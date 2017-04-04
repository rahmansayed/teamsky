angular.module('starter.services')

  .factory('localEntryHandlerV2', function ($q, $timeout, dbHandler, $state, global, serverHandlerEntryV2) {

      var selected = [];
      var items = [];

      function pushUnique(categoryList, category) {
        if (categoryList.indexOf(category) == -1)
          categoryList.push(category);
      }

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
//          console.log("localEntryHandlerV2.getAllEntry query res = " + JSON.stringify(result));
            var openEntryList = {
              entries: [],
              categories: []
            };

            for (var i = 0; i < result.rows.length; i++) {
              if (openEntryList.categories.indexOf(result.rows.item(i).categoryName) == -1)
                openEntryList.categories.push(result.rows.item(i).categoryName);
              openEntryList.entries.push(result.rows.item(i));
            }
            defer.resolve(openEntryList);
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
//          console.log("localEntryHandlerV2.getCheckedItem query res = " + JSON.stringify(res));
            var crossedEntries = [];
            for (var i = 0; i < res.rows.length; i++) {
              crossedEntries.push(res.rows.item(i));
            }
//          console.log("localEntryHandlerV2.getCheckedItem crossedEntries = " + JSON.stringify(crossedEntries));
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

      /*-------------------------------------------------------------------------------------*/
      /*Mark item as crossed*/
      /*-------------------------------------------------------------------------------------*/
      /*Mark item as uncrossed*/
      function repeatEntry(entry) {
        serverHandlerEntryV2.addEntry(entry, 'L').then(function (res) {
          console.log('repeatEntry res = ' + JSON.stringify(res));
          serverHandlerEntryV2.syncEntriesUpstream();
        });
        serverHandlerEntryV2.maintainGlobalEntries(entry, 'CROSSED', 'DELETE');
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
      function buildListEntries(listLocalId) {
        var defer = $q.defer();
        $q.all([getAllEntry(listLocalId), getCheckedItem(listLocalId)]).then(function (res) {
          global.currentListLocalId = listLocalId;
          global.currentListEntries.listOpenEntries = res[0];
          global.currentListEntries.listCrossedEntries = res[1];
          console.log('buildListEntries global.currentListEntries = ' + JSON.stringify(global.currentListEntries));
          defer.resolve();
        });

        return defer.promise;
      }

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

      /**************************************************************************************************
       * this function checks if all the entries belonging to the category are crossed
       * @param selectedItems
       * @param category
       * @returns {boolean}
       */
      function allCategoryEntriesCrossed(entryList, category) {

        for (var i = 0; i < entryList.length; i++) {
          if (entryList[i].categoryName == category && entryList[i].entryCrossedFlag == 0) {
            return false;
            break;
          }
        }
        return true;
      }

      /*-------------------------------------------------------------------------------------*/
      /* deactivate item from list from the local db*/
      function deleteEntry(entry, list) {
        var deferred = $q.defer();
        //hiding the entry from display
        global.db.transaction(function (tx) {
            var deleteQuery = "update entry set deleted = 'Y' where entryLocalId = ?";
            tx.executeSql(deleteQuery, [entry.entryLocalId], function (tx, res) {
              //console.log("localEntryHandlerV2.deactivateItem  deleteQuery res " + JSON.stringify(res));
              /* ret.rowsAffected = res.rowsAffected;*/
              serverHandlerEntryV2.maintainGlobalEntries(entry, list, 'DELETE');
              deferred.resolve(res);
            }, function (err) {
              console.error("localEntryHandlerV2.deleteEntry  deleteQuery err " + err.message);
              deferred.reject(err);
            });
          }
          ,
          function (err) {
            deferred.reject(err);
          }
        );
        return deferred.promise;
      }

      /*******************************************************************************************************************
       *
       * @param entry
       */
      function updateEntry(entry) {
        console.log('4/4/2017 - localEntryHandlerV2 - aalatief - Entry: '+JSON.stringify(entry));  
        var deferred = $q.defer();
        global.db.transaction(function (tx) {

            var updateQuery = "update entry set quantity = ?, uom=?, retailerLocalId = ?, flag = 'E' where entryLocalId = ?";
            tx.executeSql(updateQuery, [entry.quantity, entry.uom, entry.retailerLocalId, entry.entryLocalId], function (tx, res) {
              //console.log("updateEntry res " + JSON.stringify(res));
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
        addItemToList: serverHandlerEntryV2.addEntry,
        allListItemCategoryCrossed: allCategoryEntriesCrossed,
        checkItem: serverHandlerEntryV2.crossLocalEntry,
        unCheckItem: repeatEntry,
        deactivateItem: deleteEntry,
        updateEntry: updateEntry,
        buildListEntries: buildListEntries

      };
    }
  )
;
