angular.module('starter.services')

  .factory('localEntryHandlerV2', function ($q, $timeout, dbHandler, $state, global, serverHandlerEntryV2,
                                            settings, serverHandlerEntryEvents, serverHandlerRetailerV2) {

      var selected = [];
      var items = [];

      function pushUnique(categoryList, category) {
        if (categoryList.indexOf(category) == -1)
          categoryList.push(category);
      }

      /*Return all entries in array selectedItems*/
      function getAllEntry(listId) {
        console.log("aalatief - localEntryHandlerV2.getAllEntry - listId = " + listId);   
        var defer = $q.defer();
        var query = "SELECT e.entryLocalId, e.userServerId, l.listLocalId,e.itemLocalId, itl.itemName, ctl.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted,e.retailerLocalId, e.flag, e.updatedFlag, e.language ,ifnull(rtl.retailerName, 'Anywhere') as retailerName,e.createStatus,e.userServerId createdBy " +
        " ,strftime('%d/%m %H:%M', e.lastUpdateDate) as lastUpdate " +
          " FROM ( " +
          " (masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) " +
          " left join retailer as r on e.retailerLocalId = r.retailerLocalId " +
          " left join retailer_tl as rtl on r.retailerLocalId = rtl.retailerLocalId and rtl.language = e.language" +
          " INNER JOIN masterItem_tl AS itl on e.language = itl.language and itl.itemlocalId = i.itemLocalId " +
          " INNER JOIN list AS l ON e.listLocalId = l.listLocalId) " +
          " INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId " +
          " INNER JOIN category_tl AS ctl ON c.categoryLocalId = ctl.categoryLocalId and ctl.language = ?" +
          " where l.listLocalId = ? " +
          " and e.deleted = 0 " +
          " and e.entryCrossedFlag = 0";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [settings.getSettingValue('language').substr(0, 2).toUpperCase(), listId], function (tx, result) {
          console.log("localEntryHandlerV2.getAllEntry query res = " + angular.toJson(result));
              var openEntryList = {
                entries: [],
                categories: []
              };

              for (var i = 0; i < result.rows.length; i++) {
                if (serverHandlerEntryV2.getCategoryIndex(result.rows.item(i).categoryName, openEntryList.categories) == -1)
                  openEntryList.categories.push({
                    categoryName: result.rows.item(i).categoryName,
                    foldStatus: false
                  });
                openEntryList.entries.push(result.rows.item(i));
              }
              //var query2 = "update entry set seenFlag = 1, flag='E',lastupdatedate=datetime('now','localtime') where origin = 'S' and seenFlag = 0 and listLocalId = ?";
              var query3 = "update list set newCount =0, deliverCount = 0, seenCount = 0, crossCount = 0 , updateCount = 0 ,lastupdatedate = datetime('now','localtime') where listLocalId = ?";
              console.log("localEntryHandlerV2.getAllEntry query query3 = " + query3+' listId : '+listId);
              
        dbHandler.runQuery(query3, [listId], function (response) {
          //Success Callback
          console.log(response);
          deferred.resolve(response);
        }, function (error) {
          //Error Callback
          console.error(error);
          deferred.reject(error);
        });
              
              
              /*tx.executeSql(query3, [listId]);*/
              
              var query2 = "uddate entry set createStatus='FE_SEEN' lastupdatedate = datetime('now','localtime') where listLocalId = ? and createStatus in ('FE_CREATED','FE_SERVER_RECEIVE','FE_SENDER_RECEIVE_CONFIRM')";
               console.log("localEntryHandlerV2.getAllEntry query query2 = " + query2);
              tx.executeSql(query2, [listId]);
              

              defer.resolve(openEntryList);
            }
            ,
            function (err) {
              console.error("localEntryHandlerV2.getAllEntry query err = " + err.message);
              defer.reject();
            }
          );
        });

        return defer.promise;
      };

      /*-------------------------------------------------------------------------------------*/

      /*Return all checked entries in array checkedItems*/
      function getCheckedItem(listLocalId) {
        var deferred = $q.defer();

        global.db.transaction(function (tx) {
          var query = "SELECT e.entryLocalId,l.listLocalId,e.itemLocalId, itl.itemName, ctl.categoryName , e.quantity, e.uom, e.entryCrossedFlag ,e.deleted, e.language,e.updatedFlag" +
            " FROM ( " +
            "(masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) " +
            " INNER JOIN masterItem_tl AS itl on e.language = itl.language and itl.itemlocalId = i.itemLocalId " +
            " INNER JOIN list AS l ON e.listLocalId = l.listLocalId) " +
            " INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId " +
            " INNER JOIN category_tl AS ctl ON c.categoryLocalId = ctl.categoryLocalId and ctl.language = ?" +
            " where l.listLocalId = ? and ifnull(e.deleted,0)  = 0" +
            " and entryCrossedFlag != 0 " +
            " and entryLocalId = (select max(entryLocalId) "+
                                  " from entry "+
                                  " where entry.itemLocalId = e.itemLocalId "+
                                  " and entry.listLocalId = e.listLocalId "+
                                  " and entry.entryCrossedFlag != 0" +
                                  " )";

          console.log("localEntryHandlerV2.getCheckedItem query res = " + query);
          console.log("localEntryHandlerV2.getCheckedItem query settings.getSettingValue('language') = " + settings.getSettingValue('language').toUpperCase().substr(0, 2));

          tx.executeSql(query, [settings.getSettingValue('language').substr(0, 2).toUpperCase(), listLocalId], function (tx, res) {
//          console.log("localEntryHandlerV2.getCheckedItem query res = " + angular.toJson(res));
            var crossedEntries = [];
            for (var i = 0; i < res.rows.length; i++) {
              crossedEntries.push(res.rows.item(i));
            }
//          console.log("localEntryHandlerV2.getCheckedItem crossedEntries = " + angular.toJson(crossedEntries));
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
          console.log('repeatEntry res = ' + angular.toJson(res));
          serverHandlerEntryV2.syncEntriesUpstream();
        });
        serverHandlerEntryV2.maintainGlobalEntries(entry, 'DELETE');
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
    ////////////////////////////////////////////////////////////////////////////////
    function removeAllEntries() {

        var deferred = $q.defer();
        var query = "DELETE FROM entry ";
        dbHandler.runQuery(query, [], function (response) {
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
    
    ///////////////////////////////////////////////////////////////////////////////////
      function buildListEntries(listLocalId) {
        var defer = $q.defer();
        $q.all([getAllEntry(listLocalId), getCheckedItem(listLocalId), getSuggestedItem()]).then(function (res) {
          global.currentListLocalId = listLocalId;
          global.currentListEntries.listOpenEntries = res[0];
          global.currentListEntries.listCrossedEntries = res[1];
          global.suggestedItem.suggested = res[2];
          console.log('buildListEntries global.status = ' + global.status);
          if (global.status != 'background') {
            // getting all unseen entries, mark as seen and sync with the server
            var createPromies = [];
            var updatePromises = [];
            var crossPromises = [];
            //var deletePromises = [];

            global.currentListEntries.listOpenEntries.entries.forEach(function (entry) {
              if (/*entry.flag == 5*/entry.createStatus == 'FE_CREATED') {
                createPromies.push(serverHandlerEntryEvents.applyEvent(entry, 'CREATE-SEEN', 'local'));
              }
              if (entry.updatedFlag == 5) {
                updatePromises.push(serverHandlerEntryEvents.applyEvent(entry, 'UPDATE-SEEN', 'local'));
              }
            });
            global.currentListEntries.listCrossedEntries.forEach(function (entry) {
              if (entry.entryCrossedFlag == 5) {
                crossPromises.push(serverHandlerEntryEvents.applyEvent(entry, 'CROSS-SEEN', 'local'));
              }
            });

            $q.all(createPromies).then(function () {
              serverHandlerEntryEvents.syncEventUpstream('CREATE-SEEN');
            });

            $q.all(crossPromises).then(function () {
              serverHandlerEntryEvents.syncEventUpstream('CROSS-SEEN');
            });

            $q.all(updatePromises).then(function () {
              serverHandlerEntryEvents.syncEventUpstream('UPDATE-SEEN');
            });
            //serverHandlerEntryEvents.syncEventUpstream('DELETE-SEEN');
          }
          console.log('buildListEntries global.currentListEntries = ' + angular.toJson(global.currentListEntries));
          console.log('4/5/2017 - aalatief - suggested Items:  ' + angular.toJson(global.suggestedItem));
          defer.resolve();
        });

        return defer.promise;
      }

      /*******************************************************************************************************************
       *
       * @param entry
       */
      function updateEntry(entry) {
        console.log('updateEntry Entry = ' + angular.toJson(entry));
        var deferred = $q.defer();
        global.db.transaction(function (tx) {
            var updateQuery = "update entry set quantity = ?, uom=?, retailerLocalId = ?, updatedFlag = 1,lastupdatedate=datetime('now','localtime') where entryLocalId = ?";
            tx.executeSql(updateQuery, [entry.quantity, entry.uom, entry.retailerLocalId,entry.entryLocalId]);
          },
          function (err) {
            console.error("updateEntry  db err " + err.message);
            deferred.reject(err);
          },
          function () {
            serverHandlerRetailerV2.syncLocalRetailerUpstream().then(function () {
              serverHandlerEntryV2.syncUpdatesUpstream();
              deferred.resolve();
            }, function (err) {
              console.error("updateEntry  serverHandlerRetailerV2 err " + err.message);
              deferred.resolve();
            });
          }
        );
        return deferred.promise;
      }

//----------------------------------------------------------
      /*Return all checked entries in array checkedItems*/
      function getSuggestedItem() {
        var deferred = $q.defer();

        global.db.transaction(function (tx) {
          var query = "select * from masterItem order by itemPriority limit 20";

          console.log("localEntryHandlerV2.getSuggestedItem query res = " + query);

          //settings.getSettingValue('language').toUpperCase().substr(0, 2));

          tx.executeSql(query, [], function (tx, res) {

            var suggestedEntries = [];
            for (var i = 0; i < res.rows.length; i++) {
              suggestedEntries.push(res.rows.item(i));
            }
            deferred.resolve(suggestedEntries);
          }, function (err) {
            console.error("localEntryHandlerV2.getSuggestedItem query err = " + err.message);
          });
        }, function (err) {
          console.error("localEntryHandlerV2.getSuggestedItem query err = " + err.message);
        }, function () {
        });

        return deferred.promise;
      };
      /*-------------------------------------------------------------------------------------*/
      return {
        addItemToList: serverHandlerEntryV2.addEntry,
        checkItem: serverHandlerEntryV2.crossLocalEntry,
        unCheckItem: repeatEntry,
        deactivateItem: serverHandlerEntryV2.deleteLocalEntry,
        updateEntry: updateEntry,
        buildListEntries: buildListEntries,
        getSuggestedItem: getSuggestedItem,
        removeAllEntries:removeAllEntries

      };
    }
  )
;
