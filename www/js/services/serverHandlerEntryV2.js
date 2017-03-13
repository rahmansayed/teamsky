angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryV2', function ($http, global, $q, serverHandlerItemsV2, serverHandlerListV2, serverHandlerRetailerV2, dbHelper) {

      /****************************************************************************************************************
       * this function is used to build the list of affected lists for syncSeenDownstream, syncDeliversDownstream,
       * syncCrossDownstream
       * @param entries
       */
      function buildAffectedLists(entries) {
        var defer = $q.defer();
        var query = "select listLocalId, count(*) as cnt from entry where entryServerId in ( ";
        var query = entries.reduce(function (query, entry) {
          return query + "'" + entry.entryServerId + "', ";
        }, query);

        query = query.substr(0, query.length - 2) + ')';

        query = query + " group by listLocalId";
        console.log("buildAffectedLists query = " + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
            var lists = [];
            for (var i = 0; i < res.rows.length; i++) {
              lists.push(res.rows.item(i));
            }
            defer.resolve(lists);
          }, function (err) {
            console.error('buildAffectedLists tx err = ' + err.message);
            defer.reject();
          });
        }, function (err) {
          console.error('buildAffectedLists db err = ' + err.message);
          defer.reject();
        }, function () {

        });


        return defer.promise;
      };
      /****************************************************************************************************************
       *
       */
      function updateListNotificationCount(flag, affectedLists) {
        var defer = $q.defer();

        var query = "update list set " + flag + " = ifnull(" + flag + ",0) +? where listLocalId = ?";
        console.log('updateListNotificationCount query = ' + query);
        global.db.transaction(function (tx) {
          affectedLists.forEach(function (list) {
            tx.executeSql(query, [list.cnt, list.listLocalId]);
          });
        }, function (err) {
          console.error('updateListNotificationCount db err ' + JSON.stringify(err));
          defer.reject();
        }, function () {
          console.log('updateListNotificationCount db completed');
          defer.resolve();
        });
        return defer.promise;
      }

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
                var query = "update entry set entryServerId = ? , flag = 'S' where entryLocalId = ?";
                tx.executeSql(query, [response.data.entryServerId, entry.entryLocalId], function (tx, result) {
                  defer.resolve(response.data.entryServerId);
                  console.log('createEntry Rows affected = ' + result.rowsAffected)
                }, function (error) {
                  defer.reject(error);
                  console.error('createEntry error = ' + JSON.stringify(error));

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
            var query = "select entry.*, list.listServerId, masterItem.itemServerId, masterItem.origin itemOrigin,retailer.retailerServerId, retailer.origin retailerOrigin, entry.language " +
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
                      console.log("syncListEntries createEntries server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set entryServerId = ?, flag= 'S', seenFlag = 2 where entryLocalId = ?";
                          for (var i = 0; i < response.data.length; i++) {
                            tx.executeSql(query, [response.data[i].entryServerId, response.data[i].entryLocalId]);
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
                      console.error("syncListEntries Server Sync error = " + JSON.stringify(error));
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
            console.error("synEntries error = " + JSON.stringify(err));
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
                console.log("syncListEntriesUpdates result = " + JSON.stringify(result));
                console.log("syncListEntriesUpdates result.rows = " + JSON.stringify(result.rows));
                console.log("syncListEntriesUpdates result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
                console.log("syncListEntriesUpdates result.rows.length = " + JSON.stringify(result.rows.length));
                if (result.rows.length > 0) {
                  var entries = {
                    listServerId: listServerId,
                    deviceServerId: global.deviceServerId,
                    entries: []
                  };
                  for (i = 0; i < result.rows.length; i++) {
                    var entry = {
                      entryServerId: result.rows.item(i).entryServerId,
                      qty: result.rows.item(i).qty,
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
                      console.log("syncListEntriesUpdates updatemany server Response Result => " + JSON.stringify(response));
                      global.db.transaction(function (tx) {
                          var query = "update entry set flag= 'S', seenFlag = 2 where entryServerId = ?";
                          for (var i = 0; i < response.data.length; i++) {
                            tx.executeSql(query, [response.data[i].entryServerId]);
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
            console.log("synEntriesUpdatesUpstream result = " + JSON.stringify(result));
            console.log("synEntriesUpdatesUpstream result.rows = " + JSON.stringify(result.rows));
            console.log("synEntriesUpdatesUpstream result.rows.length = " + JSON.stringify(result.rows.length));
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
                var query = "insert into entry(entryLocalId, listLocalId, itemLocalId, entryServerId, quantity, uom, origin, flag, seenFlag), values " +
                  "(?,?,?,?,?,?, 'S', 'S', 0)";
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

      /*****************************************************************************************************************
       * this function is used to retrieve new entries from the server
       */
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

            syncDependentDownstream(response.data.items, response.data.retailers).then(function () {

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
                          "(entryLocalId, listLocalId, itemLocalId, entryServerId, quantity, uom, retailerLocalId, lastUpdateBy, entryCrossedFlag, origin, flag, seenFlag, language) values " +
                          "(null,?,?,?,?,?,?,'',0,'S', 'S', 0, ?)";

                        tx.executeSql(query, [localIds.listLocalId, localIds.itemLocalId, response.data.entries[i]._id, qty, uom, localIds.retailerLocalId, response.data.entries[i].language]);

                      }
                    }, function (err) {
                      console.error("serverHandlerEntry.syncEntriesDownstream db insert error = " + JSON.stringify(err.message));
                      defer.reject();
                    }, function () {
                      syncBackMany(response.data.entries).then(function () {
                        console.log("serverHandlerEntry.syncEntriesDownstream db insert success");
                        updateListNotificationCount('newCount', affectedLists);
                        defer.resolve(affectedLists);
                      });
                    });
                  }
                  ,
                  function (err) {
                    console.error("serverHandlerEntryV2 localIds error");
                    defer.reject(err);
                  }
                );
              }
            )
          }, function (err) {
            console.error("serverHandlerEntryV2 server response error " + err.message);
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
          console.error('syncBackCrossings server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }

      function syncBackSeens(seens) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        data.entrySeens = seens.map(function (seen) {
          return seen._id;
        });

        console.log('syncBackSeens data = ' + data);
        $http.post(global.serverIP + '/api/entry/syncSeensBack', data).then(function (res) {
          console.log('syncBackSeens server reply = ' + JSON.stringify(res));
          defer.resolve(res);
        }, function (err) {
          console.error('syncBackSeens server error ' + err.message);
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
          console.log('syncBackUpdates server reply = ' + JSON.stringify(res));
          defer.resolve(res);
        }, function (err) {
          console.error('syncBackUpdates server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }


      function syncBackDelivers(delivers) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        data.entriesDelivered = delivers.map(function (crossing) {
          return crossing._id;
        });

        console.log('syncBackDelivers data = ' + JSON.stringify(data));
        $http.post(global.serverIP + '/api/entry/syncDeliversBack', data).then(function (res) {
          console.log('syncBackDelivers server reply = ' + JSON.stringify(res));
          defer.resolve();
        }, function (err) {
          console.error('syncBackDelivers server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }


      function syncDeliveryDownstream() {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        $http.post(global.serverIP + '/api/entry/getDelivers', data).then(function (res) {

            if (res.data.length > 0) {
              var query = "update entry set deliveredFlag = 1, flag = 'S' where entryServerId in ( ";
              var query = res.data.reduce(function (query, deliver) {
                return query + "'" + deliver.entryServerId + "', ";
              }, query);

              query = query.substr(0, query.length - 2) + ')';
              console.log("syncDeliveryDownstream query = " + query);
              global.db.transaction(function (tx) {
                tx.executeSql(query, []);
              }, function (err) {
                console.error("syncDeliveryDownstream db update err " + err.message);
                defer.reject();
              }, function () {
                console.log("syncDeliveryDownstream db update complete");
                syncBackDelivers(res.data).then(function (res1) {
                  buildAffectedLists(res.data).then(function (res2) {
                    updateListNotificationCount('deliverCount', res2);
                    defer.resolve(res2);
                  });
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
              console.log('syncDeliveryDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve(res.data);
            }
          }
          ,
          function (err) {
            console.error('syncDeliveryDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }

      function syncCrossingsDownstream() {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        $http.post(global.serverIP + '/api/entry/getCrossings', data).then(function (res) {

            if (res.data.length > 0) {
              var query = "update entry set entryCrossedFlag = 1, flag = 'S' where entryServerId in ( ";
              var query = res.data.reduce(function (query, crossing) {
                return query + "'" + crossing.entryServerId + "', ";
              }, query);

              query = query.substr(0, query.length - 2) + ')';
              console.log("syncCrossingsDownstream entriesServerIds = " + query);
              global.db.transaction(function (tx) {
                tx.executeSql(query, []);
              }, function (err) {
                console.error("syncCrossingsDownstream db update err " + err.message);
                defer.reject();
              }, function () {
                console.log("syncCrossingsDownstream db update complete");
                syncBackCrossings(res.data).then(function (res1) {
                  buildAffectedLists(res.data).then(function (res2) {
                    updateListNotificationCount('crossCount', res2);
                    defer.resolve(res2);
                  });
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
              console.log('syncCrossingsDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve(res.data);
            }
          }
          ,
          function (err) {
            console.error('syncCrossingsDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }

      function syncSeenDownstream() {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        $http.post(global.serverIP + '/api/entry/getSeens', data).then(function (res) {

            if (res.data.length > 0) {
              var query = "update entry set seenFlag = 3 where entryServerId in ( ";
              var query = res.data.reduce(function (query, seen) {
                return query + "'" + seen.entryServerId + "', ";
              }, query);

              query = query.substr(0, query.length - 2) + ')';
              console.log("syncSeenDownstream entriesServerIds = " + query);
              global.db.transaction(function (tx) {
                tx.executeSql(query, []);
              }, function (err) {
                console.error("syncSeenDownstream db update err " + err.message);
                defer.reject();
              }, function () {
                console.log("syncSeenDownstream db update complete");
                syncBackSeens(res.data).then(function (res1) {
                  console.log('syncSeenDownstream buildAffectedLists after syncBackSeens');
                  buildAffectedLists(res.data).then(function (res2) {
                    updateListNotificationCount('seenCount', res2);
                    defer.resolve(res2);
                  });
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
              console.log('syncSeenDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve(res.data);
            }
          }
          ,
          function (err) {
            console.error('syncSeenDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }

      function syncCrossingsUptreamUpdateLocalAfterServer(crossedIds) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {

          //TODO consider the new flag of origin
          var query = "update entry set flag = 'S' where entryServerId in ( ";
          query = crossedIds.reduce(function (query, crossing) {
            return query + "'" + crossing + "', ";
          }, query);

          query = query.substr(0, query.length - 2) + ')';
          console.log("syncCrossingsUptreamUpdateLocalAfterServer query = " + query);

          tx.executeSql(query, []);
        }, function (err) {
          console.error("syncCrossingsUptreamUpdateLocalAfterServer DB error " + err);
          defer.reject(err);
        }, function () {
          console.log("syncCrossingsUptreamUpdateLocalAfterServer DB update OK ");
        });

        return defer.promise;
      }

      function syncSeenUptreamUpdateLocalAfterServer(seenIds) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {

          //TODO consider the new flag of origin
          var query = "update entry set seenFlag = 2 where entryServerId in ( ";
          query = seenIds.reduce(function (query, seenId) {
            return query + "'" + seenId + "', ";
          }, query);

          query = query.substr(0, query.length - 2) + ')';
          console.log("syncSeenUptreamUpdateLocalAfterServer query = " + query);

          tx.executeSql(query, []);
        }, function (err) {
          console.error("syncSeenUptreamUpdateLocalAfterServer DB error " + err);
          defer.reject(err);
        }, function () {
          console.log("syncSeenUptreamUpdateLocalAfterServer DB update OK ");
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
            console.error('syncCrossingsUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer ERR');
            defer.reject();
          })
        }, function (err) {
          console.error('syncCrossingsUptreamUpdateServer server err ' + JSON.stringify(err));
          defer.reject();
        });
        return defer.promise;
      }

      function syncSeenUptreamUpdateServer(seenIds) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId,
          userServerId: global.userServerId,
          entries: seenIds
        };

        $http.post(global.serverIP + '/api/entry/seemany', data).then(function (res) {
          syncSeenUptreamUpdateLocalAfterServer(seenIds).then(function (res) {
            console.log('syncSeenUptreamUpdateServer syncSeenUptreamUpdateLocalAfterServer called successfully');
            defer.resolve(res);
          }, function (err) {
            console.error('syncSeenUptreamUpdateServer syncSeenUptreamUpdateLocalAfterServer ERR');
            defer.reject();
          })
        }, function (err) {
          console.error('syncSeenUptreamUpdateServer server err ' + JSON.stringify(err));
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
            "and ifnull(entry.entryServerId,'-1') <> '-1' " +
            "and entry.flag = 'E'" +
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
              console.error('syncCrossingsUptreamperList  syncCrossingsUptreamUpdateServer ' + JSON.stringify(err));
              defer.reject();
            })
          }, function (err) {
            console.error('syncCrossingsUptreamperList  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
          console.error('syncCrossingsUptreamperList  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }


      function syncCrossingsUpstream() {
        var defer = $q.defer();
        console.log('syncCrossingsUptream started');
        global.db.transaction(function (tx) {
          var query = "select distinct list.listServerId " +
            "from entry, list " +
            "where entry.listLocalId = list.listLocalId " +
            "and entry.entryCrossedFlag = 1 " +
            "and entry.flag = 'E'";

          console.log('syncCrossingsUptream query = ' + query);
          tx.executeSql(query, [], function (tx, res) {
            var crossedListId = [];
            console.log("syncCrossingsUptream res.rows.length = " + res.rows.length);
            if (res.rows.length > 0) {
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
                console.error('syncCrossingsUptream  $q.all err ' + JSON.stringify(err));
                defer.reject();
              });
            } else {
              defer.resolve();
            }
          }, function (err) {
            console.error('syncCrossingsUptream  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
          console.error('syncCrossingsUptream  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }

      function syncSeensUpstream() {
        var defer = $q.defer();
        console.log('syncSeensUptream started');
        global.db.transaction(function (tx) {
          var query = "select entry.entryServerId " +
            "from entry " +
            "where entry.seenFlag = 1 " +
            "and entry.origin <> 'L'";

          console.log('syncSeensUptream query = ' + query);
          tx.executeSql(query, [], function (tx, res) {
            var seenEntryId = [];
            console.log("syncSeensUptream res.rows.length = " + res.rows.length);
            if (res.rows.length > 0) {
              for (var i = 0; i < res.rows.length; i++) {
                seenEntryId.push(res.rows.item(i).entryServerId);
              }
              console.log('syncSeensUptream  seenEntryId ' + JSON.stringify(seenEntryId));

              syncSeenUptreamUpdateServer(seenEntryId).then(function (res) {
                console.log('syncSeensUptream  syncSeenUptreamUpdateServer resolved ' + JSON.stringify(resolved));
                defer.resolve();
              }, function (err) {
                console.error('syncSeensUptream  syncSeenUptreamUpdateServer err ' + JSON.stringify(err));
                defer.reject();
              });
            } else {
              defer.resolve();
            }
          }, function (err) {
            console.error('syncSeensUptream  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
          console.error('syncSeensUptream  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }

      function syncUpdatesDownstream() {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        $http.post(global.serverIP + '/api/entry/getUpdates', data).then(function (res) {

            if (res.data.updates.length > 0) {
              dbHelper.insertLocalRetailerDownstream(res.data.retailers).then(function () {

                var retailers = res.data.updates.map(function (update) {
                  return update.retailerServerId || update.userRetailerServerId;
                });

                dbHelper.getRetailersLocalIds(retailers).then(function (retailerMap) {
                  global.db.transaction(function (tx) {
                      for (var i = 0; i < res.data.updates.length; i++) {
                        var updatesArray = [];
                        var query;
                        if (res.data.updates[i].retailerServerId) {
                          query = "update entry set uom = ?, quantity=?, retailerLocalId = ? where entryServerId = ?";
                          var retailerLocalId = dbHelper.getRetailerLocalIdfromMap(res.data.updates[i].retailerServerId, retailerMap);
                          updatesArray = [res.data.updates[i].uom,
                            res.data.updates[i].qty, retailerLocalId, res.data.updates[i].entryServerId];
                        } else if (res.data.updates[i].userRetailerServerId) {
                          var retailerLocalId = dbHelper.getRetailerLocalIdfromMap(res.data.updates[i].userRetailerServerId, retailerMap);
                          query = "update entry set uom = ?, quantity=?, retailerLocalId = ? where entryServerId = ?";
                          updatesArray = [res.data.updates[i].uom,
                            res.data.updates[i].qty, retailerLocalId, res.data.updates[i].entryServerId];
                        } else {
                          query = "update entry set uom = ?, quantity=? where entryServerId = ?";
                          updatesArray = [res.data.updates[i].uom,
                            res.data.updates[i].qty, res.data.updates[i].entryServerId];
                        }

                        tx.executeSql(query, updatesArray);
                      }
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
                        console.log('syncUpdatesDownstream buildAffectedLists after syncBackSeens');
                        buildAffectedLists(res.data.updates).then(function (res2) {
                          updateListNotificationCount('updateCount', res2);
                          defer.resolve(res2);
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
            console.error('syncSeenDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }


      return {
        createEntry: createEntry,
        syncEntriesUpstream: synEntriesUpstream,
        syncCrossingsUpstream: syncCrossingsUpstream,
        syncSeensUpstream: syncSeensUpstream,
        syncSeenDownstream: syncSeenDownstream,
        syncEntrieDownstream: syncEntriesDownstream,
        syncCrossingsDownstream: syncCrossingsDownstream,
        syncDeliveryDownstream: syncDeliveryDownstream,
        syncUpdatesUpstream: syncUpdatesUpstream,
        syncUpdatesDownstream: syncUpdatesDownstream
      }
    }
  )
;

