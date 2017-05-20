angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryV2', function ($http, global, $q, serverHandlerEntryEvents, serverHandlerItemsV2, $state, serverHandlerListV2, serverHandlerRetailerV2, dbHelper) {

      /*****************************************************************************************************************
       * this function syncs all entries related to a single list
       * @param listServerId
       * @returns {Promise|*}
       */
      function syncListEntries(listServerId) {
        var defer = $q.defer();
        console.log("In syncListEntries");
        global.db.transaction(function (tx) {
            var query = "select entry.*, list.listServerId, masterItem.itemServerId, masterItem.origin itemOrigin,retailer.retailerServerId, retailer.origin retailerOrigin, entry.language " +
              " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
              " where entry.entryServerId = ''" +
              " and list.listServerId = ?";
            tx.executeSql(query, [listServerId], function (tx, result) {
//                console.log("syncListEntries result = " + JSON.stringify(result));
//                console.log("syncListEntries result.rows = " + JSON.stringify(result.rows));
//                console.log("syncListEntries result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
//                console.log("syncListEntries result.rows.length = " + JSON.stringify(result.rows.length));
                if (result.rows.length > 0) {
                  var entries = {
                    listServerId: listServerId,
                    deviceServerId: global.deviceServerId,
                    userServerId: global.userServerId,
                    entries: []
                  };
                  for (i = 0; i < result.rows.length; i++) {
                    entries.entries.push({
                      entryLocalId: result.rows.item(i).entryLocalId,
                      qty: result.rows.item(i).qty,
                      uom: result.rows.item(i).uom,
                      language: result.rows.item(i).language
                    });
                    if ((result.rows.item(i).itemOrigin == 'L') || (result.rows.item(i).itemOrigin == 'O' )) {
                      entries.entries[entries.entries.length - 1].userItemServerId = result.rows.item(i).itemServerId;
                    }
                    else {
                      entries.entries[entries.entries.length - 1].itemServerId = result.rows.item(i).itemServerId;
                    }
                    if ((result.rows.item(i).retailerOrigin == 'L') || (result.rows.item(i).retailerOrigin == 'O' )) {
                      entries.entries[entries.entries.length - 1].userRetailerServerId = result.rows.item(i).retailerServerId;
                    }
                    else {
                      entries.entries[entries.entries.length - 1].retailerServerId = result.rows.item(i).retailerServerId;
                    }

                  }

                  $http.post(global.serverIP + "/api/entry/addmany", entries)
                    .then(function (response) {
//                      console.log("syncListEntries createEntries server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set entryServerId = ?, flag= 'S', seenFlag = 2 where entryLocalId = ?";
                          for (var i = 0; i < response.data.length; i++) {
                            tx.executeSql(query, [response.data[i].entryServerId, response.data[i].entryLocalId]);
                            serverHandlerEntryEvents.getEntryFromLocalDB(response.data[i].entryServerId).then(function (entry) {
                              serverHandlerEntryEvents.maintainGlobalEntries(entry, 'UPLOADED');
                            });
                          }
                        }, function (err) {
                          console.error("syncListEntries DB update Error = " + err);
                          defer.reject(err);
                        }, function () {
                          console.log("syncListEntries DB update successfull");
                          defer.resolve();
                        }
                      );
                    }, function (error) {
//                      console.error("syncListEntries Server Sync error = " + JSON.stringify(error));
                      defer.reject();
                    });
                }
                else {
                  defer.resolve();
                }
              }, function (error) {
                defer.reject();
              }
            );
          }

          ,
          function (err) {
            defer.reject();
          }

          ,
          function () {
            console.log("serverHandlerEntryV2 syncListEntries outer db");
          }
        );
        return defer.promise;
      }

      function synEntriesUpstream() {
        var defer = $q.defer();
        var promises = [];
        console.log("In synEntries");
        global.db.transaction(function (tx) {
          var query = "select list.listServerId, count(*) cnt " +
            "from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
            "where entry.entryServerId = '' " +
            "group by list.listServerId";
          tx.executeSql(query, [], function (tx, result) {
//            console.log("synEntries result = " + JSON.stringify(result));
//            console.log("synEntries result.rows = " + JSON.stringify(result.rows));
//            console.log("synEntries result.rows.length = " + JSON.stringify(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntries(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
//            console.error("synEntries error = " + JSON.stringify(err));
            defer.reject();
          });
        });
        return defer.promise;
      }

      function syncListEntriesUpdates(listServerId) {
        var defer = $q.defer();
        console.log("In syncListEntriesUpdates");
        global.db.transaction(function (tx) {
            var query = "select entry.*, list.listServerId, masterItem.itemServerId, masterItem.origin itemOrigin,retailer.retailerServerId, retailer.origin retailerOrigin" +
              " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
              " where entry.flag = 'E'" +
              " and entry.entryServerId <> ''" +
              " and list.listServerId = ?";
            tx.executeSql(query, [listServerId], function (tx, result) {
//                console.log("syncListEntriesUpdates result = " + JSON.stringify(result));
//                console.log("syncListEntriesUpdates result.rows = " + JSON.stringify(result.rows));
//                console.log("syncListEntriesUpdates result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
//                console.log("syncListEntriesUpdates result.rows.length = " + JSON.stringify(result.rows.length));
                if (result.rows.length > 0) {
                  var entries = {
                    listServerId: listServerId,
                    deviceServerId: global.deviceServerId,
                    entries: []
                  };
                  for (i = 0; i < result.rows.length; i++) {
                    var entry = {
                      entryServerId: result.rows.item(i).entryServerId,
                      qty: result.rows.item(i).quantity,
                      uom: result.rows.item(i).uom
                    };

                    if (result.rows.item(i).retailerOrigin == 'L') {
                      entry.userRetailerServerId = result.rows.item(i).retailerServerId;
                    }
                    else {
                      entry.retailerServerId = result.rows.item(i).retailerServerId;
                    }

                    entries.entries.push(entry);
                  }

                  $http.post(global.serverIP + "/api/entry/updatemany", entries)
                    .then(function (response) {
//                      console.log("syncListEntriesUpdates updatemany server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set flag= 'S', seenFlag = 2 where entryServerId = ?";
                          for (var i = 0; i < entries.entries.length; i++) {
                            tx.executeSql(query, [entries.entries[i].entryServerId]);
                          }
                        }, function (err) {
                          console.error("syncListEntriesUpdates DB update Error = " + err);
                          defer.reject(err);
                        }, function () {
                          console.log("syncListEntriesUpdates DB update successfull");
                          defer.resolve();
                        }
                      );
                    }, function (error) {
                      console.error("syncListEntriesUpdates Server Sync error = " + JSON.stringify(error));
                      defer.reject(error);
                    });
                }
                else {
                  defer.resolve();
                }
              }, function (error) {
                console.error("syncListEntriesUpdates db error = " + JSON.stringify(error));
                defer.reject(error);
              }
            );
          }
          ,
          function (err) {
            defer.reject(err);
          }
          ,
          function () {
            console.log("syncListEntriesUpdates outer db");
          }
        );
        return defer.promise;
      }

      function syncUpdatesUpstream() {

        var defer = $q.defer();
        var promises = [];
        console.log("In synEntriesUpdatesUpstream");
        global.db.transaction(function (tx) {
          var query = "select list.listServerId, count(*) cnt " +
            " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
            " where entry.flag = 'E' " +
            " and entry.entryServerId <> ''" +
            " group by list.listServerId";
          tx.executeSql(query, [], function (tx, result) {
//            console.log("synEntriesUpdatesUpstream result = " + JSON.stringify(result));
//            console.log("synEntriesUpdatesUpstream result.rows = " + JSON.stringify(result.rows));
//            console.log("synEntriesUpdatesUpstream result.rows.length = " + JSON.stringify(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntriesUpdates(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
            console.error("synEntriesUpdatesUpstream error = " + JSON.stringify(err));
            defer.reject(err);
          });
        });
        return defer.promise;
      }


      function syncBackMany(entryList) {
        var defer = $q.defer();

//        console.log("serverHandlerItemsV2.syncBackMany entryList = " + JSON.stringify(entryList));
        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId,
          entries: []
        };

        global.db.transaction(function (tx) {
          var query = "select entryLocalId, entryServerId from entry where entryServerId in ( ";
          for (var i = 0; i < entryList.length; i++) {
            query = query + "'" + entryList[i]._id + "'";
            if (i < entryList.length - 1) {
              query = query + ",";
            }
          }
          query = query + " )";

          tx.executeSql(query, [], function (tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
              data.entries.push({
                entryLocalId: result.rows.item(i).entryLocalId,
                entryServerId: result.rows.item(i).entryServerId
              });
            }

            $http.post(global.serverIP + "/api/entry/syncBackMany", data).then(function (response) {
              defer.resolve();
            }, function (err) {
              defer.reject(err);
            });

          });

        }, function (err) {
          console.error("serverHandlerV2.syncBackMany db operation ERROR " + err.message);
          defer.reject();
        }, function () {
          console.log("serverHandlerV2.syncBackMany db operation complete");
        });

        return defer.promise;

      }

      /*****************************************************************************************************************
       * This function is used to sync other user items and other user retailers in the local db prior to creating
       * the entry
       * @param items
       * @param retailers
       */
      function syncDependentDownstream(items, retailers) {

        var defer = $q.defer();

        $q.all([dbHelper.insertLocalItemsDownstream(items), dbHelper.insertLocalRetailerDownstream(retailers)])
          .then(function () {

            serverHandlerItemsV2.syncDownstreamedItemsBack().then(function () {
              console.log("serverHandlerEntry syncDownstreamedItemsBack done");
            }, function (err) {
              console.error("serverHandlerEntry syncDownstreamedItemsBack err");
            });

            serverHandlerRetailerV2.syncDownstreamedRetailerBack().then(function () {
              console.log("syncDependentDownstream syncDownstreamedRetailerBack done");
            }, function (err) {
              console.error("syncDependentDownstream syncDownstreamedRetailerBack err");
            });

            defer.resolve();
          });

        return defer.promise;

      }


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

      function deleteLocalEntry(entry) {
        return serverHandlerEntryEvents.applyEvent(entry, 'DELETE', 'local');
      }

      function crossLocalEntry(entry) {
        return serverHandlerEntryEvents.applyEvent(entry, 'CROSS', 'local');

      }

      function checkEntryExists(entryServerId) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "select * from entry where entry.entryServerId = ?";
          tx.executeSql(query, [entryServerId], function (tx, res) {
            defer.resolve(res.rows.length > 0);
          }, function (err) {
            console.error('checkEntryExists tx error = ' + err.message);
            defer.reject(err);
          });
        }, function (err) {
          console.error('checkEntryExists db error = ' + err.message);
          defer.reject(err);
        }, function () {
        });
        return defer.promise;
      }

      function insertEntry(entry) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "INSERT OR IGNORE INTO entry (entryLocalId," +
            "listLocalId," +
            "userServerId," +
            "itemLocalId," +
            "entryServerId," +
            "quantity,uom,retailerLocalId," +
            "entryCrossedFlag, origin, flag, deliveredFlag, seenFlag, language, deleted) " +
            "VALUES (null," + //entryLocalId
            "?," +//listLocalId
            "?," + //entryOwnerServerId
            "?," + //itemLocalId
            "?," + //entryServerId
            "?," + //quantity
            "?," + //uom
            "?," + // retailerLocalId
            "0, " + //entryCrossedFlag
            "?," + //origin
            " ?," + // flag
            " 0," + //deliveredFlag
            " ?," + //seenFlag
            " ?," + //language
            " 'N')"; //deleted
          //SELECT i.itemLocalId, itl.itemName, itl.lowerItemName, c.categoryName , itl.language
          tx.executeSql(query, [entry.listLocalId, entry.userServerId, entry.itemLocalId, entry.entryServerId, entry.quantity, entry.uom, entry.retailerLocalId, entry.origin, entry.flag, entry.seenFlag, entry.language], function (tx, res) {
            console.log('addEntry res = ' + JSON.stringify(res.insertId));
            entry.entryLocalId = res.insertId;
            serverHandlerEntryEvents.maintainGlobalEntries(entry, 'ADD');
            var updateQuery = "update masterItem set itemPriority = IFNULL(itemPriority,0)+1 where itemLocalId =  ?";
            tx.executeSql(updateQuery, [entry.itemLocalId]);
            var udpateQuery2 = "update entry set deleted = 'Y' where itemLocalId = ? and entryLocalId <> ? and entryCrossedFlag = 1";
            console.log('addItemToList entry.entryLocalId  = ' + entry.entryLocalId);
            tx.executeSql(udpateQuery2, [entry.itemLocalId, entry.entryLocalId]);
            defer.resolve();
          }, function (err) {
            console.error('addItemToList insert error  = ' + err.message);
          });
        }, function (err) {
          console.error('addItemToList db error  = ' + err.message);
          defer.reject(err);
        }, function () {
        });


        return defer.promise;
      }

      /*******************************************************************************************************************
       * add item to list and increment item usage, there are three cases:
       * 1. there is no entry in either crossed or not crossed undeleted for the item.
       * 2. there is a fresh entry for the item.
       * 3. there is a crossed entry for the item.
       * @param entry
       */
      function addEntry(entry, mode) {
        console.log('addEntry entry = ' + JSON.stringify(entry));
        //console.log('addItemToList listOpenEntries = ' + JSON.stringify(entries.listOpenEntries));
        console.log('addEntry global.currentList = ' + JSON.stringify(global.currentList));
        var defer = $q.defer();
        //search the item in the listOpen Entries
        var insertFlag = false;
        if (mode == 'S') {
          insertFlag = true;
        } else {
          var openIdx = itemExitInList(entry.itemLocalId, global.currentListEntries.listOpenEntries.entries);
          if (openIdx == -1) {
            insertFlag = true;
          }
        }
        console.log('addEntry insertFlag = ' + JSON.stringify(insertFlag));
        if (insertFlag) {
          entry.flag = mode == 'L' ? 'N' : 'S';
          entry.origin = mode == 'L' ? 'L' : 'S';
          var seenFlag;
          if (mode == 'L')
            entry.seenFlag = 2;
          entry.deliveredFlag = 0;
          if (mode == 'S') {
            checkEntryExists(entry.entryServerId).then(function (exists) {
              if (!exists) {
                insertEntry(entry).then(function (res) {
                  defer.resolve();
                }, function (err) {
                  defer.reject();
                });
              }
            })
          }
          else {
            entry.entryServerId = '';
            entry.userServerId = global.userServerId;
            insertEntry(entry).then(function (res) {
              defer.resolve();
            }, function (err) {
              defer.reject();
            });
          }
        }
        return defer.promise;
      }

      /*****************************************************************************************************************
       * this function is used to retrieve new entries from the server
       */
      function syncEntriesDownstream(entryDetails) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };
        var myPromise;
        var affectedLists = [];
        if (entryDetails) {
          myPromise = $q.resolve({
            data: entryDetails
          });
        } else {
          myPromise = $http.post(global.serverIP + "/api/entry/getpending", data);
        }

        var categoryName;
        var entry = {};
        myPromise.then(function (response) {

//            console.log("serverHandlerEntry syncEntriesDownstream server response " + JSON.stringify(response));

          syncDependentDownstream(response.data.items, response.data.retailers).then(function () {

            dbHelper.buildLocalIds(response.data.entries).then(function (result) {
                console.log("serverHandlerEntryV2 localIds = " + JSON.stringify(result));
                affectedLists = result.lists;
                var insertPromises = [];
                for (var i = 0; i < response.data.entries.length; i++) {

                  var localIds = dbHelper.getLocalIds(response.data.entries[i], result);
                  console.log("serverHandlerEntry syncEntriesDownstream entry i =" + i + " " + JSON.stringify(response.data.entries[i]));
                  console.log("serverHandlerEntry syncEntriesDownstream localIds =" + JSON.stringify(localIds));


                  if (!localIds.retailerLocalId)
                    localIds.retailerLocalId = '';

                  var uom;
                  if (response.data.entries[i].uom) {
                    uom = response.data.entries[i].uom;
                  } else {
                    uom = "PCS";
                  }

                  var qty;
                  if (response.data.entries[i].qty) {
                    qty = response.data.entries[i].qty;
                  } else {
                    qty = 1.0;
                  }
//                        console.log("serverHandlerEntry.syncEntriesDownstream localValues listLocalId = " + JSON.stringify(localIds));
                  console.log("serverHandlerEntry.syncEntriesDownstream localValues qty = " + qty);
                  console.log("serverHandlerEntry.syncEntriesDownstream localValues uom = " + uom);

                  var entry = {
                    listLocalId: localIds.listLocalId,
                    itemLocalId: localIds.itemLocalId,
                    itemName: localIds.itemName,
                    categoryName: localIds.categoryName,
                    quantity: qty,
                    uom: uom,
                    entryCrossedFlag: 0,
                    deleted: 'N',
                    //seenFlag: 0,
                    retailerLocalId: localIds.retailerLocalId,
                    retailerName: localIds.retailerName,
                    language: response.data.entries[i].language,
                    entryServerId: response.data.entries[i]._id,
                    userServerId: response.data.entries[i].userServerId
                  };
                  console.log("serverHandlerEntry.syncEntriesDownstream $state.current.name = " + $state.current.name);
                  console.log("serverHandlerEntry.syncEntriesDownstream localIds.listLocalId = " + localIds.listLocalId);
                  console.log("serverHandlerEntry.syncEntriesDownstream global.currentList = " + global.currentList);

                  if ($state.current.name == 'item' && global.currentList.listLocalId == localIds.listLocalId) {
                    entry.seenFlag = 1;
                  } else {
                    entry.seenFlag = 0;
                  }

                  insertPromises.push(addEntry(entry, 'S'));
                }
                $q.all(insertPromises).then(function () {
                  console.log("serverHandlerEntry.syncEntriesDownstream db insert success");
                  syncBackMany(response.data.entries);
                  serverHandlerEntryEvents.syncEventUpstream('SEEN');
                  serverHandlerEntryEvents.updateListNotificationCount('newCount', affectedLists);
                  defer.resolve(affectedLists);
                });
              },
              function (err) {
                console.error("serverHandlerEntryV2 localIds errors");
                defer.reject(err);
              });
          });
        }, function (err) {
          console.error("serverHandlerEntryV2 server response error " + err.message);
          defer.reject(err);
        });
        return defer.promise;
      }

      function syncBackUpdates(updates) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        data.updates = updates.map(function (update) {
          return update._id;
        });

        console.log('syncBackUpdates data = ' + data);
        $http.post(global.serverIP + '/api/entry/syncUpdatesBack', data).then(function (res) {
//          console.log('syncBackUpdates server reply = ' + JSON.stringify(res));
          defer.resolve(res);
        }, function (err) {
          console.error('syncBackUpdates server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }

      function syncDeletesUpstream() {
        return serverHandlerEntryEvents.syncEventUpstream("DELETE");
      }

      function syncUpdatesDownstream(entryUpdate) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        var myPromise;
        if (entryUpdate) {
          myPromise = $q.resolve({
            data: {
              updates: [{
                entryServerId: entryUpdate.entry.entryServerId,
                _id: entryUpdate.entry._id,
                uom: entryUpdate.entry.uom || '',
                qty: entryUpdate.entry.qty || 1,
                retailerServerId: entryUpdate.entry.retailerServerId,
                userRetailerServerId: entryUpdate.entry.userRetailerServerId,
              }],
              retailers: (entryUpdate.retailer) ? [entryUpdate.retailer] : []
            }
          });
        } else {
          myPromise = $http.post(global.serverIP + '/api/entry/getUpdates', data);
        }
        myPromise.then(function (res) {

            if (res.data.updates.length > 0) {
              console.log('syncUpdatesDownstream res.data = ' + JSON.stringify(res.data));
              dbHelper.insertLocalRetailerDownstream(res.data.retailers).then(function () {

                var retailers = res.data.updates.map(function (update) {
                  return update.retailerServerId || update.userRetailerServerId;
                });

                dbHelper.getRetailersLocalIds(retailers).then(function (retailerMap) {
                  global.db.transaction(function (tx) {
                      res.data.updates.forEach(function (update) {
                        var updatesArray = [];
                        var query;
                        if (update.retailerServerId) {
                          query = "update entry set uom = ?, quantity=?, retailerLocalId = ? where entryServerId = ?";
                          var retailer = dbHelper.getRetailerLocalIdfromMap(update.retailerServerId, retailerMap);
                          updatesArray = [update.uom,
                            update.qty, retailer.retailerLocalId, update.entryServerId];
                        } else if (update.userRetailerServerId) {
                          var retailer = dbHelper.getRetailerLocalIdfromMap(update.userRetailerServerId, retailerMap);
                          query = "update entry set uom = ?, quantity=?, retailerLocalId = ? where entryServerId = ?";
                          updatesArray = [update.uom, update.qty, retailer.retailerLocalId, update.entryServerId];
                        } else {
                          query = "update entry set uom = ?, quantity=? where entryServerId = ?";
                          updatesArray = [update.uom, update.qty, update.entryServerId];
                        }

                        tx.executeSql(query, updatesArray);
                        // getting the entry to reflect on UI
                        serverHandlerEntryEvents.getEntryFromLocalDB(update.entryServerId).then(function (entry) {
                            entry.retailerLocalId = retailer.retailerLocalId;
                            entry.retailerName = retailer.retailerName;
                            entry.qty = update.qty;
                            entry.uom = update.uom;
                            serverHandlerEntryEvents.maintainGlobalEntries(entry, 'UPDATE');
                          }
                        );
                      });
                    }
                    ,
                    function (err) {
                      console.error("syncUpdatesDownstream db update err " + err.message);
                      defer.reject();
                    }
                    ,
                    function () {
                      console.log("syncUpdatesDownstream db update complete");
                      syncBackUpdates(res.data.updates).then(function (res1) {
                        console.log('syncUpdatesDownstream serverHandlerEntryEvents.buildAffectedLists after syncBackSeens');
                        serverHandlerEntryEvents.buildAffectedLists(res.data.updates).then(function (res2) {
                          serverHandlerEntryEvents.updateListNotificationCount('updateCount', res2);
                          defer.resolve(res2);
                        }, function (err) {
                          console.error('syncUpdatesDownstream serverHandlerEntryEvents.buildAffectedLists error');
                        });
                      }, function (err) {
                        console.error("syncUpdatesDownstream db update complete");
                        defer.reject();
                      });
                    }
                  );
                });
              });
            } else {
              defer.resolve();
            }
          }
          ,
          function (err) {
//            console.error('syncSeenDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }


      return {
        addEntry: addEntry,
        syncEntriesUpstream: synEntriesUpstream,
        syncEntrieDownstream: syncEntriesDownstream,
        crossLocalEntry: crossLocalEntry,
        deleteLocalEntry: deleteLocalEntry,
        syncUpdatesUpstream: syncUpdatesUpstream,
        syncUpdatesDownstream: syncUpdatesDownstream,
        maintainGlobalEntries: serverHandlerEntryEvents.maintainGlobalEntries,
        getCategoryIndex: serverHandlerEntryEvents.getCategoryIndex
      }
    }
  )
;

