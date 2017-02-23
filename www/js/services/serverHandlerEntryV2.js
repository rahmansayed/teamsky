angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryV2', function ($http, global, $q, serverHandlerItemsV2, serverHandlerListV2, dbHelper) {

      /****************************************************************************************************************\
       * this function is used to sync a single entry
       * @param entry
       * @returns {Promise|*}
       */
      function createEntry(entry) {

        console.log("createEntry");
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
        console.log("createEntry Entry to Be Created = " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/entry/add", data)
          .then(function (response) {
              console.log("createEntry Response Result => " + JSON.stringify(response));
              defer.resolve(response.data.entryServerId);
              console.log("createEntry Response Done");
              global.db.transaction(function (tx) {
                var query = "update entry set entryServerId = ? where entryLocalId = ?";
                tx.executeSql(query, [response.data.entryServerId, entry.entryLocalId], function (tx, result) {
                  defer.resolve(response.data.entryServerId);
                  console.log('createEntry Rows affected = ' + result.rowsAffected)
                }, function (error) {
                  defer.reject(error);
                  console.log('createEntry error = ' + JSON.stringify(error));

                });
                console.log("createEntry updateList Response Done");
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
        console.log("In syncListEntries");
        global.db.transaction(function (tx) {
            var query = "select entry.*, list.listServerId, masterItem.itemServerId, masterItem.lastUpdateBy ,retailer.retailerServerId " +
              " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
              " where entry.entryServerId = ''" +
              "and list.listServerId = ?";
            tx.executeSql(query, [listServerId], function (tx, result) {
                console.log("syncListEntries result = " + JSON.stringify(result));
                console.log("syncListEntries result.rows = " + JSON.stringify(result.rows));
                console.log("syncListEntries result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
                console.log("syncListEntries result.rows.length = " + JSON.stringify(result.rows.length));
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
                      console.log("syncListEntries createEntries server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set entryServerId = ?, lastUpdateBy = ? where entryLocalId = ?";
                          for (var i = 0; i < response.data.length; i++) {
                            tx.executeSql(query, [response.data[i].entryServerId, response.data[i].localItemFlag, response.data[i].entryLocalId]);
                          }
                        }, function (err) {
                          console.log("syncListEntries DB update Error = " + err);
                          defer.reject(err);
                        }, function () {
                          console.log("syncListEntries DB update successfull");
                          defer.resolve();
                        }
                      );
                    }, function (error) {
                      console.log("syncListEntries Server Sync error = " + JSON.stringify(error));
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
            console.log("synEntries result = " + JSON.stringify(result));
            console.log("synEntries result.rows = " + JSON.stringify(result.rows));
            console.log("synEntries result.rows.length = " + JSON.stringify(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              promises.push(syncListEntries(result.rows.item(i).listServerId));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (err) {
            console.log("synEntries error = " + JSON.stringify(err));
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

      function syncBackCrossings(crossings) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        data.entryCrossings = crossings.map(function (crossing) {
          return crossing._id;
        });

        console.log('syncBackCrossings data = ' + data);
        $http.post(global.serverIP + '/api/entry/syncCrossingsBack', data).then(function (res) {
          console.log('syncBackCrossings server reply = ' + JSON.stringify(res));
        }, function (err) {
          console.log('syncBackCrossings server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }

      function syncCrossingsDownstream() {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        $http.post(global.serverIP + '/api/entry/getCrossings', data).then(function (res) {

            if (res.data.length > 0) {
              var query = "update entry set entryCrossedFlag = 1, lastUpdateBy = 'SS' where entryServerId in ( ";
              var query = res.data.reduce(function (query, crossing) {
                return query + "'" + crossing.entryServerId + "', ";
              }, query);

              query = query.substr(0, query.length - 2) + ')';
              console.log("syncCrossingsDownstream entriesServerIds = " + query);
              global.db.transaction(function (tx) {
                tx.executeSql(query, []);
              }, function (err) {
                console.log("syncCrossingsDownstream db update err " + err.message);
                defer.reject();
              }, function () {
                console.log("syncCrossingsDownstream db update complete");
                syncBackCrossings(res.data).then(function (res) {
                  defer.resolve();
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
              console.log('syncCrossingsDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve();
            }
          }
          ,
          function (err) {
            console.log('syncCrossingsDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }

      function syncCrossingsUptreamUpdateLocalAfterServer(crossedIds) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {

          //TODO consider the new flag of origin
          var query = "update entry set lastUpdateBy = 'SS' where entryServerId in ( ";
          query = crossedIds.reduce(function (query, crossing) {
            return query + "'" + crossing + "', ";
          }, query);

          query = query.substr(0, query.length - 2) + ')';
          console.log("syncCrossingsUptreamUpdateLocalAfterServer query = " + query);

          tx.executeSql(query, []);
        }, function (err) {
          console.log("syncCrossingsUptreamUpdateLocalAfterServer DB error " + err);
          defer.reject(err);
        }, function () {
          console.log("syncCrossingsUptreamUpdateLocalAfterServer DB update OK ");
        });

        return defer.promise;
      }

      function syncCrossingsUptreamUpdateServer(listServerId, crossedIds) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId,
          userServerId: global.userServerId,
          listServerId: listServerId,
          entries: crossedIds
        };

        $http.post(global.serverIP + '/api/entry/crossmany', data).then(function (res) {
          syncCrossingsUptreamUpdateLocalAfterServer(crossedIds).then(function (res) {
            console.log('syncCrossingsUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer called successfully');
            defer.resolve(res);
          }, function (err) {
            console.log('syncCrossingsUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer ERR');
            defer.reject();
          })
        }, function (err) {
          console.log('syncCrossingsUptreamUpdateServer server err ' + JSON.stringify(err));
          defer.reject();
        });
        return defer.promise;
      }

      function syncCrossingsUptreamperList(listServerId) {
        var defer = $q.defer();
        console.log('syncCrossingsUptreamperList started');
        global.db.transaction(function (tx) {
          var query = "select entry.entryServerId " +
            "from entry, list " +
            "where entry.listLocalId = list.listLocalId " +
            "and entry.entryCrossedFlag = 1 " +
            "and entry.lastUpdateBy = 'LE'" +
            "and list.listServerId = '" + listServerId.listServerId + "'";

          console.log('syncCrossingsUptreamperList query = ' + query);
          console.log('syncCrossingsUptreamperList listServerId = ' + listServerId.listServerId);
          tx.executeSql(query, [], function (tx, res) {
            var crossedIds = [];
            console.log("syncCrossingsUptreamperList res.rows.length = " + res.rows.length);
            for (var i = 0; i < res.rows.length; i++) {
              crossedIds.push(res.rows.item(i).entryServerId);
            }
            console.log('syncCrossingsUptreamperList  crossedIds ' + JSON.stringify(crossedIds));
            syncCrossingsUptreamUpdateServer(listServerId.listServerId, crossedIds).then(function () {
              defer.resolve();
            }, function (err) {
              defer.reject();
            })
          }, function (err) {
            console.log('syncCrossingsUptreamperList  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
          console.log('syncCrossingsUptreamperList  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }


      function syncCrossingsUptream() {
        var defer = $q.defer();
        console.log('syncCrossingsUptream started');
        global.db.transaction(function (tx) {
          var query = "select distinct list.listServerId " +
            "from entry, list " +
            "where entry.listLocalId = list.listLocalId " +
            "and entry.entryCrossedFlag = 1 " +
            "and entry.lastUpdateBy = 'LE'";

          console.log('syncCrossingsUptream query = ' + query);
          tx.executeSql(query, [], function (tx, res) {
            var crossedListId = [];
            console.log("syncCrossingsUptream res.rows.length = " + res.rows.length);
            for (var i = 0; i < res.rows.length; i++) {
              crossedListId.push(res.rows.item(i));
            }
            console.log('syncCrossingsUptream  crossedListId ' + JSON.stringify(crossedListId));
            var promises = crossedListId.map(function (listServerId) {
              return syncCrossingsUptreamperList(listServerId);
            });

            $q.all(promises, function (res) {
              console.log('syncCrossingsUptream  $q.all resolved ' + JSON.stringify(resolved));
              defer.resolve();

            }, function (err) {
              console.log('syncCrossingsUptream  $q.all err ' + JSON.stringify(err));
              defer.reject();
            });
            //TODO should call the server for crossing the entries
          }, function (err) {
            console.log('syncCrossingsUptream  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
          console.log('syncCrossingsUptream  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }

      return {
        createEntry: createEntry,
        // this function is used to synchronize all the un-sync'd lists
        syncEntriesUpstream: synEntriesUpstream,
        syncEntrieDownstream: syncEntriesDownstream,
        syncCrossingsDownstream: syncCrossingsDownstream,
        syncCrossingsUptream: syncCrossingsUptream
      }
    }
  )
;
