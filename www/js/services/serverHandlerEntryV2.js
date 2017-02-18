angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryV2', function ($http, global, $q, serverHandlerItemsV2, serverHandlerListV2, dbHelper) {

      var serviceName = "serverHandlerEntryV2";

      //------------------------consoleLog

      function consoleLog(text) {
        //return;
        console.log(serviceName + "  =>  " + text);
      }

      /****************************************************************************************************************\
       * this function is used to sync a single entry
       * @param entry
       * @returns {Promise|*}
       */
      function createEntry(entry) {

        consoleLog("Start createList");
        var defer = $q.defer();

        if (entry.lastUpdateBy == 'Y') {
          data = {
            userServerId: global.userServerId,
            deviceServerId: global.deviceServerId,
            listServerId: entry.listServerId,
            entryDetails: {
              entryLocalId: entry.entryLocalId,
              userItemServerId: entry.itemServerId,
              qty: entry.qty,
              uom: entry.uom,
              vendorServerId: entry.vendorServerId
            }
          };
        } else {
          data = {
            userServerId: global.userServerId,
            deviceServerId: global.deviceServerId,
            listServerId: entry.listServerId,
            entryDetails: {
              entryLocalId: entry.entryLocalId,
              itemServerId: entry.itemServerId,
              qty: entry.qty,
              uom: entry.uom,
              vendorServerId: entry.vendorServerId
            }
          };
        }
        consoleLog(" Entry to Be Created = " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/entry/add", data)
          .then(function (response) {
              consoleLog(" createEntry Response Result => " + JSON.stringify(response));
              defer.resolve(response.data.entryServerId);
              consoleLog(" createEntry Response Done");
              global.db.transaction(function (tx) {
                var query = "update entry set entryServerId = ? where entryLocalId = ?";
                tx.executeSql(query, [response.data.entryServerId, entry.entryLocalId], function (tx, result) {
                  defer.resolve(response.data.entryServerId);
                  consoleLog('Rows affected = ' + result.rowsAffected)
                }, function (error) {
                  defer.reject(error);
                  consoleLog('error = ' + JSON.stringify(error));

                });
                consoleLog(" updateList Response Done");
              });
            },
            function (error) {
              defer.reject(error);
            });

        return defer.promise;
      };

      /*****************************************************************************************************************
       * this function syncs all entries related to a single list
       * @param listServerId
       * @returns {Promise|*}
       */
      function syncListEntries(listServerId) {
        var defer = $q.defer();
        consoleLog("In syncListEntries");
        global.db.transaction(function (tx) {
            var query = "select entry.*, list.listServerId, masterItem.itemServerId, masterItem.lastUpdateBy ,retailer.retailerServerId " +
              " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
              " where entry.entryServerId = ''" +
              "and list.listServerId = ?";
            tx.executeSql(query, [listServerId], function (tx, result) {
                consoleLog("syncListEntries result = " + JSON.stringify(result));
                consoleLog("syncListEntries result.rows = " + JSON.stringify(result.rows));
                consoleLog("syncListEntries result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
                consoleLog("syncListEntries result.rows.length = " + JSON.stringify(result.rows.length));
                if (result.rows.length > 0) {
                  var entries = {
                    listServerId: listServerId,
                    deviceServerId: global.deviceServerId,
                    entries: []
                  };
                  for (i = 0; i < result.rows.length; i++) {
                    entries.entries.push({
                      entryLocalId: result.rows.item(i).entryLocalId,
                      qty: result.rows.item(i).qty,
                      uom: result.rows.item(i).uom,
                      retailerServerId: result.rows.item(i).retailerServerId
                    });
                    if (result.rows.item(i).lastUpdateBy == 'LS') {
                      entries.entries[entries.entries.length - 1].userItemServerId = result.rows.item(i).itemServerId;
                    }
                    else {
                      entries.entries[entries.entries.length - 1].itemServerId = result.rows.item(i).itemServerId;
                    }
                  }

                  $http.post(global.serverIP + "/api/entry/addmany", entries)
                    .then(function (response) {
                      consoleLog("syncListEntries createEntries server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set entryServerId = ?, lastUpdateBy = ? where entryLocalId = ?";
                          for (var i = 0; i < response.data.length; i++) {
                            tx.executeSql(query, [response.data[i].entryServerId, response.data[i].localItemFlag, response.data[i].entryLocalId]);
                          }
                        }, function (err) {
                          consoleLog("syncListEntries DB update Error = " + err);
                          defer.reject(err);
                        }, function () {
                          consoleLog("syncListEntries DB update successfull");
                          defer.resolve();
                        }
                      );
                    }, function (error) {
                      consoleLog("syncListEntries Server Sync error = " + JSON.stringify(error));
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
        consoleLog("In synEntries");
        global.db.transaction(function (tx) {
          var query = "select list.listServerId, count(*) cnt " +
            "from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
            "where entry.entryServerId = '' " +
            "group by list.listServerId";
          tx.executeSql(query, [], function (tx, result) {
            consoleLog("synEntries result = " + JSON.stringify(result));
            consoleLog("synEntries result.rows = " + JSON.stringify(result.rows));
            consoleLog("synEntries result.rows.length = " + JSON.stringify(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntries(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
            consoleLog("synEntries error = " + JSON.stringify(err));
            defer.reject();
          });
        });
        return defer.promise;
      }

      function insertEntryDownstream(entry) {
        global.db.transaction(function (tx) {

          var queryLocalIds = "select itemLocalId, listLocalId " +
            " from list, masterItem " +
            " where list.listServerId = ? " +
            " and masterItem.itemServerId = ? ";

          tx.executeSql(queryServerIds, [entry.listServerId, entry.itemServerId],
            function (tx, result) {
              if (result.rows.length == 0) {
                var query = "insert into entry(entryLocalId, listLocalId, itemLocalId, entryServerId, quantity, uom), values " +
                  "(?,?,?,?,?,?)";
              } else {
                tx.ex
              }
              ;
            }, function (err) {

            });
        });
      }


      function syncBackMany(entryList) {
        var defer = $q.defer();

        console.log("serverHandlerItemsV2.syncBackMany entryList = " + JSON.stringify(entryList));
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
          console.log("serverHandlerV2.syncBackMany db operation ERROR " + err.message);
          defer.reject();
        }, function () {
          console.log("serverHandlerV2.syncBackMany db operation complete");
        });

        return defer.promise;

      }

      function syncEntriesDownstream() {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        var affectedLists = [];
        $http.post(global.serverIP + "/api/entry/getpending", data)
          .then(function (response) {
            console.log("serverHandlerEntry syncEntriesDownstream server response " + JSON.stringify(response));

            dbHelper.insertLocalItemsDownstream(response.data.items).then(function () {

                serverHandlerItemsV2.syncDownstreamedItemsBack().then(function () {
                  console.log("serverHandlerEntry syncDownstreamedItemsBack done");
                }, function (err) {
                  console.log("serverHandlerEntry syncDownstreamedItemsBack err");
                });

                dbHelper.buildLocalIds(response.data.entries).then(function (result) {
                    console.log("serverHandlerEntryV2 localIds = " + JSON.stringify(result));
                    affectedLists = result.lists;
                    global.db.transaction(function (tx) {
                      for (var i = 0; i < response.data.entries.length; i++) {

                        var localIds = dbHelper.getLocalIds(response.data.entries[i], result);
                        console.log("serverHandlerEntry syncEntriesDownstream entry i =" + i + " " + JSON.stringify(response.data.entries[i]));

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
                        console.log("serverHandlerEntry.syncEntriesDownstream localValues listLocalId = " + JSON.stringify(localIds));
                        console.log("serverHandlerEntry.syncEntriesDownstream localValues qty = " + qty);
                        console.log("serverHandlerEntry.syncEntriesDownstream localValues uom = " + uom);
                        var query = "insert into entry " +
                          "(entryLocalId, listLocalId, itemLocalId, entryServerId, quantity, uom, retailerLocalId, lastUpdateBy, entryCrossedFlag) values " +
                          "(null,?,?,?,?,?,?,'',0)";

                        tx.executeSql(query, [localIds.listLocalId, localIds.itemLocalId, response.data.entries[i]._id, qty, uom, localIds.retailerLocalId]);

                      }
                    }, function (err) {
                      console.log("serverHandlerEntry.syncEntriesDownstream db insert error = " + JSON.stringify(err.message));
                      defer.reject();
                    }, function () {
                      syncBackMany(response.data.entries).then(function () {
                        console.log("serverHandlerEntry.syncEntriesDownstream db insert success");
                        defer.resolve(affectedLists);
                      });
                    });
                  }
                  ,
                  function (err) {
                    console.log("serverHandlerEntryV2 localIds error");
                    defer.reject(err);
                  }
                );
              }
            )
          }, function (err) {
            console.log("serverHandlerEntryV2 server response error " + err.message);
            defer.reject(err);
          });
        return defer.promise;
      }

      return {
        createEntry: createEntry,
        // this function is used to synchronize all the un-sync'd lists
        syncEntriesUpstream: synEntriesUpstream,
        syncEntrieDownstream: syncEntriesDownstream
      }
    }
  )
;
