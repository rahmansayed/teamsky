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
//                console.log("syncListEntries result = " + angular.toJson(result));
//                console.log("syncListEntries result.rows = " + angular.toJson(result.rows));
//                console.log("syncListEntries result.rows.item(0) = " + angular.toJson(result.rows.item(0)));
//                console.log("syncListEntries result.rows.length = " + angular.toJson(result.rows.length));
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
                    else if (result.rows.item(i).retailerServerId) {
                      entries.entries[entries.entries.length - 1].retailerServerId = result.rows.item(i).retailerServerId;
                    }

                  }

                  $http.post(global.serverIP + "/api/entry/addmany", entries)
                    .then(function (response) {
//                      console.log("syncListEntries createEntries server Response Result => " + angular.toJson(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set entryServerId = ?, flag = 2 where entryLocalId = ?";
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
//                      console.error("syncListEntries Server Sync error = " + angular.toJson(error));
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
//            console.log("synEntries result = " + angular.toJson(result));
//            console.log("synEntries result.rows = " + angular.toJson(result.rows));
//            console.log("synEntries result.rows.length = " + angular.toJson(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntries(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
//            console.error("synEntries error = " + angular.toJson(err));
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
              " from entry " +
              " left join list on entry.listLocalId = list.listLocalId " +
              " left join masterItem on entry.itemLocalId = masterItem.itemLocalId " +
              " left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
              " where entry.updatedFlag = 1" +
              " and entry.entryServerId <> ''" +
              " and list.listServerId = ?";
            tx.executeSql(query, [listServerId], function (tx, result) {
//                console.log("syncListEntriesUpdates result = " + angular.toJson(result));
//                console.log("syncListEntriesUpdates result.rows = " + angular.toJson(result.rows));
              console.log("syncListEntriesUpdates result.rows.item(0) = " + angular.toJson(result.rows.item(0)));
//                console.log("syncListEntriesUpdates result.rows.length = " + angular.toJson(result.rows.length));
              if (result.rows.length > 0) {
                var entries = {
                  listServerId: listServerId,
                  deviceServerId: global.deviceServerId,
                  userServerId: global.userServerId,
                  entries: []
                };
                for (i = 0; i < result.rows.length; i++) {
                  var entry = {
                    entryServerId: result.rows.item(i).entryServerId,
                    qty: result.rows.item(i).quantity,
                    uom: result.rows.item(i).uom
                  };

                  if (result.rows.item(i).retailerOrigin == 'L') {
                    if (result.rows.item(i).retailerServerId)
                      entry.userRetailerServerId = result.rows.item(i).retailerServerId;
                  }
                  else if (result.rows.item(i).retailerServerId) {
                    entry.retailerServerId = result.rows.item(i).retailerServerId;
                  }

                  entries.entries.push(entry);
                }

                $http.post(global.serverIP + "/api/entry/updatemany", entries)
                  .then(function (response) {
//                      console.log("syncListEntriesUpdates updatemany server Response Result => " + angular.toJson(response));
                    var query = "update entry set updatedFlag = 2 where entryServerId = ?";
                    global.db.transaction(function (tx) {
                      for (var i = 0; i < entries.entries.length; i++) {
                        tx.executeSql(query, [entries.entries[i].entryServerId]);
                      }
                    }, function (err) {
                      console.error("syncListEntriesUpdates update db error = " + err.message);
                    }, function () {
                      defer.resolve();
                    });
                  }, function (error) {
                    console.error("syncListEntriesUpdates Server Sync error = " + angular.toJson(error));
                    defer.reject(error);
                  });
              }
              else {
                defer.resolve();
              }
            }, function (error) {
              console.error("syncListEntriesUpdates tx error = " + angular.toJson(error));
              defer.reject(error);
            });
          },
          function (err) {
            console.error("syncListEntriesUpdates db error = " + angular.toJson(error));
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
            " where entry.updatedFlag = 1 " +
            " and entry.entryServerId <> ''" +
            " group by list.listServerId";
          tx.executeSql(query, [], function (tx, result) {
//            console.log("synEntriesUpdatesUpstream result = " + angular.toJson(result));
//            console.log("synEntriesUpdatesUpstream result.rows = " + angular.toJson(result.rows));
//            console.log("synEntriesUpdatesUpstream result.rows.length = " + angular.toJson(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntriesUpdates(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
            console.error("synEntriesUpdatesUpstream error = " + angular.toJson(err));
            defer.reject(err);
          });
        });
        return defer.promise;
      }

      /**********************************************************************************************************************
       * This function is used to inform the server about the successful downstream
       * @param entryList
       * @returns {Promise}
       */
      /*      function syncBackMany(entryList) {
       var defer = $q.defer();

       //        console.log("serverHandlerItemsV2.syncBackMany entryList = " + angular.toJson(entryList));
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

       }*/

      /*****************************************************************************************************************
       * This function is used to sync other user items and other user retailers in the local db prior to creating
       * the entry
       * @param items
       * @param retailers
       */
      function syncDependentDownstream(items, retailers) {

        var defer = $q.defer();

        var itemsPromise;
        var retailersPromise;
        if (items.length > 0) {
          itemsPromise = dbHelper.insertLocalItemsDownstream(items);
        }
        else {
          itemsPromise = $q.resolve();
        }
        ;
        if (retailers.length > 0) {
          retailersPromise = dbHelper.insertLocalRetailerDownstream(retailers);
        }
        else {
          retailersPromise = $q.resolve();
        }
        $q.all([itemsPromise, retailersPromise])
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
          }, function () {
            console.error("syncDependentDownstream $q.all err");
            defer.reject();
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
            "entryCrossedFlag, origin, flag, updatedFlag, language, deleted) " +
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
            " 0," + //updatedFlag
            " ?," + //language
            " 0)"; //deleted
          //SELECT i.itemLocalId, itl.itemName, itl.lowerItemName, c.categoryName , itl.language
          tx.executeSql(query, [entry.listLocalId, entry.userServerId, entry.itemLocalId, entry.entryServerId, entry.quantity, entry.uom, entry.retailerLocalId, entry.origin, entry.flag, entry.language], function (tx, res) {
            console.log('addEntry res = ' + angular.toJson(res.insertId));
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
        console.log('addEntry entry = ' + angular.toJson(entry));
        //console.log('addItemToList listOpenEntries = ' + angular.toJson(entries.listOpenEntries));
        console.log('addEntry global.currentList = ' + angular.toJson(global.currentList));
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
        console.log('addEntry insertFlag = ' + angular.toJson(insertFlag));
        if (insertFlag) {
          entry.origin = mode == 'L' ? 'L' : 'S';
          if (mode == 'S') {
            checkEntryExists(entry.entryServerId).then(function (exists) {
              if (!exists) {
                insertEntry(entry).then(function (res) {
                  defer.resolve();
                }, function (err) {
                  console.error('addEntry insertEntry err = ' + angular.toJson(err));
                  defer.reject();
                });
              }
              else {
                console.log('addEntry ALREADY EXISTS ');
                defer.resolve();
              }
            }, function (err) {
              console.error('addEntry checkEntryExists err = ' + angular.toJson(err));
              defer.reject();
            })
          }
          else {
            entry.entryServerId = '';
            entry.userServerId = global.userServerId;
            insertEntry(entry).then(function (res) {
              defer.resolve();
            }, function (err) {
              console.error('addEntry insertEntry err = ' + angular.toJson(err));
              defer.reject();
            });
          }
        }
        return defer.promise;
      }

      /*****************************************************************************************************************
       * this function is used to build the promise after which the actual insertion of update occurs
       * @param entryEvent
       * @param event
       */
      function buildPromise(entryEvent, event) {

        var myPromise;
        if (entryEvent) {
          myPromise = $q.resolve({
            data: {
              entries: [{
                entryServerId: entryEvent.entry,
                _id: entryEvent._id
              }
              ],
              items: entryEvent.item,
              retailers: entryEvent.retailer
            }
          })
          ;
        } else {
          var data = {
            userServerId: global.userServerId,
            deviceServerId: global.deviceServerId
          };
          var url = global.serverIP + "/api/entry/" + (event == "CREATE" ? "getpending" : "getUpdates");

          myPromise = $http.post(url, data);
        }
        return myPromise;

      }

      /*****************************************************************************************************************
       * this function is used to retrieve new entries from the server
       */
      function syncEntriesDownstream(entryDetails) {
        var defer = $q.defer();

        console.log("syncEntriesDownstream global.status = " + global.status);

        buildPromise(entryDetails, "CREATE").then(function (response) {

          console.log("syncEntriesDownstream server response " + angular.toJson(response));

          syncDependentDownstream(response.data.items, response.data.retailers).then(function () {

            dbHelper.buildLocalIds(response.data.entries).then(function (result) {
                console.log("serverHandlerEntryV2 localIds = " + angular.toJson(result));
                affectedLists = result.lists;
                var insertPromises = [];
                for (var i = 0; i < response.data.entries.length; i++) {

                  var localIds = dbHelper.getLocalIds(response.data.entries[i].entryServerId, result);
                  console.log("syncEntriesDownstream entry i =" + i + " " + angular.toJson(response.data.entries[i]));
                  console.log("syncEntriesDownstream localIds =" + angular.toJson(localIds));


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
//                        console.log("serverHandlerEntry.syncEntriesDownstream localValues listLocalId = " + angular.toJson(localIds));
                  console.log("syncEntriesDownstream localValues qty = " + qty);
                  console.log("syncEntriesDownstream localValues uom = " + uom);

                  var entry = {
                    listLocalId: localIds.listLocalId,
                    itemLocalId: localIds.itemLocalId,
                    itemName: localIds.itemName,
                    categoryName: localIds.categoryName,
                    quantity: qty,
                    uom: uom,
                    entryCrossedFlag: 0,
                    deleted: 0,
                    updatedFlag: 0,
                    flag: 5,
                    //seenFlag: 0,
                    retailerLocalId: localIds.retailerLocalId,
                    retailerName: localIds.retailerName,
                    language: response.data.entries[i].entryServerId.language,
                    entryServerId: response.data.entries[i].entryServerId._id,
                    userServerId: response.data.entries[i].entryServerId.userServerId
                  };
                  console.log("syncEntriesDownstream $state.current.name = " + $state.current.name);
                  console.log("syncEntriesDownstream localIds.listLocalId = " + localIds.listLocalId);
                  console.log("syncEntriesDownstream global.currentList = " + global.currentList);
                  console.log("syncEntriesDownstream global.status = " + global.status);

                  if ($state.current.name == 'item' && global.currentList.listLocalId == localIds.listLocalId && global.status == 'foreground') {
                    entry.flag = 6;
                  }

                  insertPromises.push(addEntry(entry, 'S'));
                }
                $q.all(insertPromises).then(function () {
                  console.log("syncEntriesDownstream db insert success");
                  serverHandlerEntryEvents.syncBackEvent(response.data.entries, "CREATE");
                  serverHandlerEntryEvents.syncEventUpstream('CREATE-SEEN');
                  serverHandlerEntryEvents.updateListNotificationCount('newCount', affectedLists);
                  defer.resolve(affectedLists);
                }, function () {
                  console.error("syncEntriesDownstream did not insert resolving affected lists " + angular.toJson(affectedLists));
                  defer.resolve(affectedLists);
                });
              },
              function (err) {
                console.error("syncEntriesDownstream localIds errors");
                defer.reject(err);
              });
          });
        }, function (err) {
          console.error("syncEntriesDownstream server response error " + err.message);
          defer.reject(err);
        });
        return defer.promise;
      }

      function syncUpdatesDownstream(entryUpdate) {
        var defer = $q.defer();

        buildPromise(entryUpdate, "UPDATE").then(function (res) {
          var updateFlag;
          if ($state.current.name == 'item' && global.currentList.listLocalId == localIds.listLocalId && global.status == 'foreground') {
            updateFlag = 6
          } else {
            updateFlag = 5;
          }

          if (res.data.entries.length > 0) {
            console.log('syncUpdatesDownstream res.data = ' + angular.toJson(res.data));
            syncDependentDownstream(response.data.items, response.data.retailers).then(function () {
                global.db.transaction(function (tx) {
                    res.data.entries.forEach(function (update) {
                      var entryRetailerServerId = update.retailerServerId || update.userRetailerServerId || '';
                      var query = "update entry set uom = ?," +
                        " quantity = ?, " +
                        " retailerLocalId = (select retailerLocalId from retailer r where r.retailerServerId = ?)," +
                        " updatedFlag = ? " +
                        " where entryServerId = ?";

                      var updatesArray = [update.uom,
                        update.qty, entryRetailerServerId, updateFlag, update.entryServerId._id];

                      tx.executeSql(query, updatesArray);
                    });
                  },
                  function (err) {
                    console.error("syncUpdatesDownstream db update err " + err.message);
                    defer.reject();
                  }, function () {
                    console.log("syncUpdatesDownstream db update complete");
                    serverHandlerEntryEvents.syncBackEvent(res.data.entries, "UPDATE").then(function (res1) {
                      console.log('syncUpdatesDownstream serverHandlerEntryEvents.buildAffectedLists after syncBackSeens');
                      serverHandlerEntryEvents.buildAffectedLists(res.data.entries).then(function (res2) {
                        serverHandlerEntryEvents.updateListNotificationCount('updateCount', res2);
                        defer.resolve(res2);
                      }, function (err) {
                        console.error('syncUpdatesDownstream serverHandlerEntryEvents.buildAffectedLists error');
                      });
                    });
                    // getting the entry to reflect on UI
                    res.data.entries.forEach(function (update) {
                      serverHandlerEntryEvents.getEntryFromLocalDB(update.entryServerId._id).then(function (entry) {
                          serverHandlerEntryEvents.maintainGlobalEntries(entry, 'UPDATE');
                        }
                      );
                    });
                  });
              }
              , function (err) {
                console.error("syncUpdatesDownstream insertLocalRetailerDownstream err " + angular.toJson(err));
                defer.reject();
              });
          }
          else {
            defer.resolve();
          }

        });
        return defer.promise;
      }

      /*      function syncBackUpdates(updates) {
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
       //          console.log('syncBackUpdates server reply = ' + angular.toJson(res));
       defer.resolve(res);
       }, function (err) {
       console.error('syncBackUpdates server error ' + err.message);
       defer.reject(err);
       });

       return defer.promise;
       }*/

      return {
        addEntry: addEntry,
        syncEntriesUpstream: synEntriesUpstream,
        syncEntriesDownstream: syncEntriesDownstream,
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

