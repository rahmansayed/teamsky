/**
 * Created by Abdul Rahman on 5/2/2017.
 */
angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryEvents', function ($http, global, $q, serverHandlerItemsV2, $state, serverHandlerListV2, serverHandlerRetailerV2, dbHelper) {

      function getCategoryCount(categoryName) {
        return global.currentListEntries.listOpenEntries.entries.filter(function (entry) {
          return entry.categoryName == categoryName;
        }).length;
      }

      function getCategoryIndex(categoryName, categoryList) {
        var idx = -1;
        //console.log("getCategoryIndex categoryList = " + JSON.stringify(categoryList));
        for (var i = 0; i < categoryList.length; i++) {
          if (categoryList[i].categoryName == categoryName) {
            idx = i;
            break;
          }
        }
        return idx;
      }

      function maintainGlobalEntries(entry, list, operation) {
        console.log('maintainGlobalEntries entry = ' + JSON.stringify(entry));
        console.log('maintainGlobalEntries list = ' + JSON.stringify(list));
        console.log('maintainGlobalEntries operation = ' + operation);

        if (entry.listLocalId == global.currentList.listLocalId) {
          console.log('maintainGlobalEntries global.currentListEntries = ' + JSON.stringify(global.currentListEntries));
          var openIdx = -1;
          var crossedIdx = -1;
          var categoryIdx = -1;

          for (var i = 0; i < global.currentListEntries.listOpenEntries.entries.length; i++) {
            if (global.currentListEntries.listOpenEntries.entries[i].itemLocalId == entry.itemLocalId) {
              openIdx = i;
              break;
            }
          }

          for (var i = 0; i < global.currentListEntries.listCrossedEntries.length; i++) {
            if (global.currentListEntries.listCrossedEntries[i].itemLocalId == entry.itemLocalId) {
              crossedIdx = i;
              break;
            }
          }

          categoryIdx = getCategoryIndex(entry.categoryName, global.currentListEntries.listOpenEntries.categories);
          console.log('maintainGlobalEntries openIdx = ' + openIdx);
          console.log('maintainGlobalEntries crossedIdx = ' + crossedIdx);
          console.log('maintainGlobalEntries categoryIdx = ' + categoryIdx);
          switch (operation) {
            case 'ADD':
              if (openIdx == -1) {
                global.currentListEntries.listOpenEntries.entries.push(entry);
                if (getCategoryIndex(entry.categoryName, global.currentListEntries.listOpenEntries.categories) == -1) {
                  global.currentListEntries.listOpenEntries.categories.push({
                    categoryName: entry.categoryName,
                    foldStatus: false
                  });
                }
                if (crossedIdx != -1) {
                  global.currentListEntries.listCrossedEntries.splice(crossedIdx, 1);
                }
              }
              break;
            case 'CROSS':
              if (openIdx != -1) {
                global.currentListEntries.listOpenEntries.entries.splice(openIdx, 1);
              }
              if (crossedIdx == -1) {
                global.currentListEntries.listCrossedEntries.push(entry);
              }
              if (getCategoryCount(entry.categoryName) == 0) {
                global.currentListEntries.listOpenEntries.categories.splice(categoryIdx, 1);
              }
              break;
            case 'SEEN':
              if (openIdx > -1)
                global.currentListEntries.listOpenEntries.entries[openIdx].seenFlag = 3;
              break;
            case 'DELIVERED':
              if (openIdx > -1)
                global.currentListEntries.listOpenEntries.entries[openIdx].deliveredFlag = 1;
              break;
            case 'UPLOADED':
              if (openIdx > -1)
                global.currentListEntries.listOpenEntries.entries[openIdx].flag = 'S';
              break;
            case 'DELETE':
              if (list == 'OPEN') {
                if (openIdx != -1) {
                  global.currentListEntries.listOpenEntries.entries.splice(openIdx, 1);
                  if (getCategoryCount(entry.categoryName) == 0) {
                    global.currentListEntries.listOpenEntries.categories.splice(categoryIdx, 1);
                  }
                }
              } else if (list == 'CROSSED') {
                if (crossedIdx != -1) {
                  global.currentListEntries.listCrossedEntries.splice(crossedIdx, 1);
                }
              }
              break;
            case 'UPDATE':
              if (openIdx != -1) {
                global.currentListEntries.listOpenEntries.entries[openIdx].quantity = entry.qty;
                global.currentListEntries.listOpenEntries.entries[openIdx].uom = entry.uom;
//                global.currentListEntries.listOpenEntries.entries[openIdx].retailerName = entry.retailerName;
                global.currentListEntries.listOpenEntries.entries[openIdx].retailerLocalId = entry.retailerLocalId;
                global.currentListEntries.listOpenEntries.entries[openIdx].retailerName = entry.retailerName;
                global.currentListEntries.listOpenEntries.entries[openIdx].x = 500;
              }
              break;
          }
          console.log('maintainGlobalEntries AFTER global.currentListEntries = ' + JSON.stringify(global.currentListEntries));
        }
      }

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
          //console.error('updateListNotificationCount db err ' + JSON.stringify(err));
          defer.reject();
        }, function () {
          console.log('updateListNotificationCount db completed');
          defer.resolve();
        });
        return defer.promise;
      }

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
                            getEntryFromLocalDB(response.data[i].entryServerId).then(function (entry) {
                              maintainGlobalEntries(entry, 'OPEN', 'UPLOADED');
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

      function crossEntry(entry, mode) {
        //console.log('crossEntry entry = ' + JSON.stringify(entry));
        var deferred = $q.defer();
        var flag = mode == 'L' ? 'E' : 'S';
        var query = "update entry  set entryCrossedFlag='1', flag = ?, lastUpdateDate=? where entryLocalId =?";
// splicing the listOpenEntries
        //console.log("crossEntry listOpenEntries before = " + JSON.stringify(entries.listOpenEntries));
        var cat = entry.categoryName;
        var catCount = 0;
        console.log("crossEntry cat = " + cat);
        if (entry.listLocalId == global.currentList.listLocalId) {
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

          maintainGlobalEntries(newEntry, 'CROSSED', 'CROSS');
        }
        global.db.transaction(function (tx) {
          tx.executeSql(query, [flag, new Date().getTime(), entry.entryLocalId], function (response) {
            //Success Callback
            deferred.resolve();
          }, function (err) {
            console.error("crossEntry db err " + err.message);
            deferred.reject(err);
          });
        }, function (error) {
          console.error(error);
          deferred.reject(error);
        });

        return deferred.promise;
      };


      /*-------------------------------------------------------------------------------------*/
      /* deactivate item from list from the local db*/
      function deleteEntry(entry, mode) {
        var deferred = $q.defer();
        //hiding the entry from display
        global.db.transaction(function (tx) {
            var deleteQuery = "update entry set deleted = 'Y', flag = 'E' where entryLocalId = ?";
            tx.executeSql(deleteQuery, [entry.entryLocalId], function (tx, res) {
              //console.log("localEntryHandlerV2.deactivateItem  deleteQuery res " + JSON.stringify(res));
              /* ret.rowsAffected = res.rowsAffected;*/
              maintainGlobalEntries(entry, 'OPEN', 'DELETE');
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

      function deleteLocalEntry(entry) {
        var defer = $q.defer();
        deleteEntry(entry, 'L').then(function () {
          syncDeletesUpstream().then(function () {
            defer.resolve();
          }, function () {
            console.error('deleteLocalEntry syncDeletesUpstream error');
            defer.reject();
          });
        }, function () {
          console.error('deleteLocalEntry error');
          defer.reject();
        });
        return defer.promise;
      }

      function crossLocalEntry(entry) {
        var defer = $q.defer();
        crossEntry(entry, 'L').then(function () {
          syncCrossingsUpstream().then(function () {
            defer.resolve();
          }, function () {
            console.error('crossLocalEntry syncCrossingsUpstream error');
            defer.reject();
          });
        }, function () {
          console.error('crossLocalEntry error');
          defer.reject();
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
        console.log('addItemToList entry = ' + JSON.stringify(entry));
        //console.log('addItemToList listOpenEntries = ' + JSON.stringify(entries.listOpenEntries));
        console.log('addItemToList global.currentList = ' + JSON.stringify(global.currentList));
        var deferred = $q.defer();
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
        if (insertFlag) {
          entry.flag = mode == 'L' ? 'N' : 'S';
          entry.origin = mode == 'L' ? 'L' : 'S';
          var seenFlag;
          if (mode == 'L')
            entry.seenFlag = 2;
          entry.deliveredFlag = 0;
          var entryServerId = (mode == 'S') ? entry.entryServerId : '';
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
            tx.executeSql(query, [entry.listLocalId, entry.userServerId, entry.itemLocalId, entryServerId, entry.quantity, entry.uom, entry.retailerLocalId, entry.origin, entry.flag, entry.seenFlag, entry.language], function (tx, res) {
              console.log('addEntry res = ' + JSON.stringify(res.insertId));
              entry.entryLocalId = res.insertId;
              maintainGlobalEntries(entry, 'OPEN', 'ADD');
              var updateQuery = "update masterItem set itemPriority = IFNULL(itemPriority,0)+1 where itemLocalId =  ?";
              tx.executeSql(updateQuery, [entry.itemLocalId]);
              var udpateQuery2 = "update entry set deleted = 'Y' where itemLocalId = ? and entryLocalId <> ? and entryCrossedFlag = 1";
              console.log('addItemToList entry.entryLocalId  = ' + entry.entryLocalId);
              tx.executeSql(udpateQuery2, [entry.itemLocalId, entry.entryLocalId]);
              deferred.resolve();
            }, function (err) {
              console.error('addItemToList insert error  = ' + err.message);
            });
          }, function (err) {
            console.error('addItemToList db error  = ' + err.message);
            deferred.reject(err);
          }, function () {
          });
        }
        return deferred.promise;
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
                  syncSeensUpstream();
                  updateListNotificationCount('newCount', affectedLists);
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
//          console.log('syncBackCrossings server reply = ' + JSON.stringify(res));
          defer.resolve(res);
        }, function (err) {
          console.error('syncBackCrossings server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }

      function syncBackDeletes(deletes) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        data.entryDeletes = deletes.map(function (del) {
          return del._id;
        });

        console.log('syncBackDeletes data = ' + data);
        $http.post(global.serverIP + '/api/entry/syncDeletesBack', data).then(function (res) {
//          console.log('syncBackCrossings server reply = ' + JSON.stringify(res));
          defer.resolve(res);
        }, function (err) {
          console.error('syncBackDeletes server error ' + err.message);
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
//          console.log('syncBackSeens server reply = ' + JSON.stringify(res));
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
//          console.log('syncBackUpdates server reply = ' + JSON.stringify(res));
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

//        console.log('syncBackDelivers data = ' + JSON.stringify(data));
        $http.post(global.serverIP + '/api/entry/syncDeliversBack', data).then(function (res) {
//          console.log('syncBackDelivers server reply = ' + JSON.stringify(res));
          defer.resolve();
        }, function (err) {
          console.error('syncBackDelivers server error ' + err.message);
          defer.reject(err);
        });

        return defer.promise;
      }


      function syncDeliveryDownstream(entryUpdate) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        var myPromise;
        if (entryUpdate) {
          myPromise = $q.resolve({
            data: [{
              entryServerId: entryUpdate.entryServerId,
              _id: entryUpdate._id
            }]
          });
        } else {
          myPromise = $http.post(global.serverIP + '/api/entry/getDelivers', data);
        }
        myPromise.then(function (res) {
            var query = "update entry set deliveredFlag = 1, flag = 'S' where entryServerId in ( ";
            res.data.forEach(function (deliver) {
              query = query + "'" + deliver.entryServerId + "', ";
              getEntryFromLocalDB(deliver.entryServerId).then(function (entry) {
                maintainGlobalEntries(entry, 'OPEN', 'DELIVERED');
              });
            });
            if (res.data.length > 0) {

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
                  }, function (err) {
                    console.error("syncDeliveryDownstream buildAffectedLists err");
                  });
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
//              console.log('syncDeliveryDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve(res.data);
            }
          }
          ,
          function (err) {
//            console.error('syncDeliveryDownstream server err ' + JSON.stringify(err));
            defer.reject();
          }
        );

        return defer.promise;
      }

      function getEntryFromLocalDB(entryServerId) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "select e.*, mtl.itemName, ctl.categoryName " +
            " from masterItem mi, masterItem_tl mtl, category c, category_tl  ctl , entry e " +
            " where mi.itemLocalId = mtl.itemLocalId " +
            " and mi.categoryLocalId = c.categoryLocalId " +
            " and ctl.categoryLocalId = c.categoryLocalId " +
            " and mi.itemLocalId = e.itemLocalId " +
            " and mtl.language = e.language " +
            " and ctl.language = e.language " +
            " and e.entryServerId = ?";
          tx.executeSql(query, [entryServerId], function (tx, res) {
            if (res.rows.length > 0) {
              defer.resolve(res.rows.item(0));
            }
            else {
              console.error('getCrossedEntryFromLocalDB entry not found entryServerId = ' + entryServerId);
              defer.reject();
            }
          }, function (err) {
            console.error('getCrossedEntryFromLocalDB db error');
            defer.reject();
          });
        });
        return defer.promise;
      };

      function syncCrossingsDownstream(entryUpdate) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };
        var myPromise;
        if (entryUpdate) {
          myPromise = $q.resolve({
            data: [{
              entryServerId: entryUpdate.entryServerId,
              _id: entryUpdate._id
            }]
          });
        } else {
          myPromise = $http.post(global.serverIP + '/api/entry/getCrossings', data);
        }
        myPromise.then(function (res) {

            var crossPromises = [];
            res.data.forEach(function (entry) {
              getEntryFromLocalDB(entry.entryServerId).then(function (res) {
                crossEntry(res, 'S');
              });
            });

            if (res.data.length > 0) {
              syncBackCrossings(res.data).then(function (res1) {
                buildAffectedLists(res.data).then(function (res2) {
                  updateListNotificationCount('crossCount', res2);
                  defer.resolve(res2);
                }, function (err) {
                  console.error('syncCrossingsDownstream buildAffectedLists err');
                });
              });
            }
          }
        );
        return defer.promise;
      }

      function syncDeletesDownstream(entryDelete) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };
        var myPromise;
        if (entryDelete) {
          myPromise = $q.resolve({
            data: [{
              entryServerId: entryDelete.entryServerId,
              _id: entryDelete._id
            }]
          });
        } else {
          myPromise = $http.post(global.serverIP + '/api/entry/getDeletes', data);
        }
        myPromise.then(function (res) {

            var deletePromises = [];
            res.data.forEach(function (entry) {
              getEntryFromLocalDB(entry.entryServerId).then(function (res) {
                deleteEntry(res, 'S');
              });
            });

            if (res.data.length > 0) {
              syncBackDeletes(res.data).then(function (res1) {
                buildAffectedLists(res.data).then(function (res2) {
                  //updateListNotificationCount('crossCount', res2);
                  defer.resolve(res2);
                }, function (err) {
                  console.error('syncDeletesDownstream buildAffectedLists err');
                });
              });
            }
          }
        );
        return defer.promise;
      }

      function syncSeenDownstream(entryUpdate) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId
        };

        var myPromise;
        if (entryUpdate) {
          myPromise = $q.resolve({
            data: [{
              entryServerId: entryUpdate.entryServerId,
              _id: entryUpdate._id
            }]
          });
        } else {
          myPromise = $http.post(global.serverIP + '/api/entry/getSeens', data);
        }
        myPromise.then(function (res) {

            var query = "update entry set seenFlag = 3 where entryServerId in ( ";
            res.data.forEach(function (deliver) {
              query = query + "'" + deliver.entryServerId + "', ";
              getEntryFromLocalDB(deliver.entryServerId).then(function (entry) {
                maintainGlobalEntries(entry, 'OPEN', 'SEEN');
              });
            });

            if (res.data.length > 0) {
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
                  }, function (err) {
                    console.error('syncSeenDownstream buildAffectedLists err');
                  });
                }, function (err) {
                  defer.reject();
                });
              });
            }
            else {
//              console.log('syncSeenDownstream server no updates ' + JSON.stringify(res.data));
              defer.resolve(res.data);
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
          defer.resolve();
        });

        return defer.promise;
      }

      function syncDeletesUptreamUpdateLocalAfterServer(deleteIds) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {

          //TODO consider the new flag of origin
          var query = "update entry set flag = 'S' where entryServerId in ( ";
          query = deleteIds.reduce(function (query, del) {
            return query + "'" + del + "', ";
          }, query);

          query = query.substr(0, query.length - 2) + ')';
          console.log("syncDeletesUptreamUpdateLocalAfterServer query = " + query);

          tx.executeSql(query, []);
        }, function (err) {
          console.error("syncDeletesUptreamUpdateLocalAfterServer DB error " + err);
          defer.reject(err);
        }, function () {
          console.log("syncDeletesUptreamUpdateLocalAfterServer DB update OK ");
          defer.resolve();
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


      function syncDeletesUptreamUpdateServer(listServerId, deleteIds) {
        var defer = $q.defer();

        var data = {
          deviceServerId: global.deviceServerId,
          userServerId: global.userServerId,
          listServerId: listServerId,
          entries: deleteIds
        };

        $http.post(global.serverIP + '/api/entry/deletemany', data).then(function (res) {
          syncDeletesUptreamUpdateLocalAfterServer(deleteIds).then(function (res) {
            console.log('syncDeletesUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer called successfully');
            defer.resolve(res);
          }, function (err) {
            console.error('syncDeletesUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer ERR');
            defer.reject();
          })
        }, function (err) {
//          console.error('syncCrossingsUptreamUpdateServer server err ' + JSON.stringify(err));
          defer.reject();
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
//          console.error('syncCrossingsUptreamUpdateServer server err ' + JSON.stringify(err));
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
//          console.error('syncSeenUptreamUpdateServer server err ' + JSON.stringify(err));
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
            "and ifnull(entry.entryServerId,'') <> '' " +
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
//            console.log('syncCrossingsUptreamperList  crossedIds ' + JSON.stringify(crossedIds));
            syncCrossingsUptreamUpdateServer(listServerId.listServerId, crossedIds).then(function () {
              console.log('syncCrossingsUptreamperList  called successfully');
              defer.resolve();
            }, function (err) {
//              console.error('syncCrossingsUptreamperList  syncCrossingsUptreamUpdateServer ' + JSON.stringify(err));
              defer.reject();
            })
          }, function (err) {
//            console.error('syncCrossingsUptreamperList  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
//          console.error('syncCrossingsUptreamperList  db err ' + JSON.stringify(err));
          defer.reject();
        }, function (res) {

        });
        return defer.promise;
      }

      function syncDeletesUptreamperList(listServerId) {
        var defer = $q.defer();
        console.log('syncDeletesUptreamperList started');
        global.db.transaction(function (tx) {
          var query = "select entry.entryServerId " +
            "from entry, list " +
            "where entry.listLocalId = list.listLocalId " +
            "and entry.deleted = 'Y' " +
            "and ifnull(entry.entryServerId,'') <> '' " +
            "and entry.flag = 'E'" +
            "and list.listServerId = '" + listServerId.listServerId + "'";

          console.log('syncDeletesUptreamperList query = ' + query);
          console.log('syncDeletesUptreamperList listServerId = ' + listServerId.listServerId);
          tx.executeSql(query, [], function (tx, res) {
            var deletesIds = [];
            console.log("syncDeletesUptreamperList res.rows.length = " + res.rows.length);
            for (var i = 0; i < res.rows.length; i++) {
              deletesIds.push(res.rows.item(i).entryServerId);
            }
//            console.log('syncCrossingsUptreamperList  crossedIds ' + JSON.stringify(crossedIds));
            syncDeletesUptreamUpdateServer(listServerId.listServerId, deletesIds).then(function () {
              console.log('syncDeletesUptreamperList  called successfully');
              defer.resolve();
            }, function (err) {
//              console.error('syncCrossingsUptreamperList  syncCrossingsUptreamUpdateServer ' + JSON.stringify(err));
              defer.reject();
            })
          }, function (err) {
//            console.error('syncCrossingsUptreamperList  db query err ' + JSON.stringify(err));
            defer.reject();
          });
        }, function (err) {
//          console.error('syncCrossingsUptreamperList  db err ' + JSON.stringify(err));
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
              "and entry.entryServerId <> ''" +
              "and entry.flag = 'E'";

            console.log('syncCrossingsUptream query = ' + query);
            tx.executeSql(query, [], function (tx, res) {
              var crossedListId = [];
              console.log("syncCrossingsUptream res.rows.length = " + res.rows.length);
              if (res.rows.length > 0) {
                var promises = [];
                for (var i = 0; i < res.rows.length; i++) {
//                  console.log('syncCrossingsUptream  crossedListId ' + JSON.stringify(res.rows.item(i)));
                  promises.push(syncCrossingsUptreamperList(res.rows.item(i)));
                }

//                console.log("syncCrossingsUptream promises = " + JSON.stringify(promises));
                $q.all(promises).then(function (res) {
//                  console.log('syncCrossingsUptream  $q.all resolved ' + JSON.stringify(res));
                  defer.resolve();
                }, function (err) {
                  console.error('syncCrossingsUptream  $q.all err ' + JSON.stringify(err));
                  defer.reject(err);
                });
              }
              else {
                defer.resolve();
              }
            }, function (err) {
              console.error('syncCrossingsUptream  db query err ' + JSON.stringify(err));
              defer.reject(err);
            });
          }

          ,
          function (err) {
            console.error('syncCrossingsUptream  db err ' + JSON.stringify(err));
            defer.reject(err);
          }

          ,
          function (res) {

          }
        );
        return defer.promise;
      }

      function syncDeletesUpstream() {
        var defer = $q.defer();
        console.log('syncDeletesUpstream started');
        global.db.transaction(function (tx) {
            var query = "select distinct list.listServerId " +
              "from entry, list " +
              "where entry.listLocalId = list.listLocalId " +
              "and entry.deleted = 'Y' " +
              "and entry.entryServerId <> '' " +
              "and entry.flag = 'E'";

            console.log('syncDeletesUpstream query = ' + query);
            tx.executeSql(query, [], function (tx, res) {
              var crossedListId = [];
              console.log("syncDeletesUpstream res.rows.length = " + res.rows.length);
              if (res.rows.length > 0) {
                var promises = [];
                for (var i = 0; i < res.rows.length; i++) {
//                  console.log('syncCrossingsUptream  crossedListId ' + JSON.stringify(res.rows.item(i)));
                  promises.push(syncDeletesUptreamperList(res.rows.item(i)));
                }

//                console.log("syncCrossingsUptream promises = " + JSON.stringify(promises));
                $q.all(promises).then(function (res) {
//                  console.log('syncCrossingsUptream  $q.all resolved ' + JSON.stringify(res));
                  defer.resolve();
                }, function (err) {
                  console.error('syncDeletesUpstream  $q.all err ' + JSON.stringify(err));
                  defer.reject(err);
                });
              }
              else {
                defer.resolve();
              }
            }, function (err) {
              console.error('syncDeletesUpstream  db query err ' + JSON.stringify(err));
              defer.reject(err);
            });
          }

          ,
          function (err) {
            console.error('syncDeletesUpstream  db err ' + JSON.stringify(err));
            defer.reject(err);
          }

          ,
          function (res) {

          }
        );
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
//              console.log('syncSeensUptream  seenEntryId ' + JSON.stringify(seenEntryId));

              syncSeenUptreamUpdateServer(seenEntryId).then(function (res) {
//                console.log('syncSeensUptream  syncSeenUptreamUpdateServer resolved ' + JSON.stringify(resolved));
                defer.resolve();
              }, function (err) {
                console.error('syncSeensUptream  syncSeenUptreamUpdateServer err ' + JSON.stringify(err));
                defer.reject(err);
              });
            } else {
              defer.resolve();
            }
          }, function (err) {
            console.error('syncSeensUptream  db query err ' + JSON.stringify(err));
            defer.reject(err);
          });
        }, function (err) {
          console.error('syncSeensUptream  db err ' + JSON.stringify(err));
          defer.reject(err);
        }, function (res) {

        });
        return defer.promise;
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
                        getEntryFromLocalDB(update.entryServerId).then(function (entry) {
                            entry.retailerLocalId = retailer.retailerLocalId;
                            entry.retailerName = retailer.retailerName;
                            entry.qty = update.qty;
                            entry.uom = update.uom;
                            maintainGlobalEntries(entry, 'OPEN', 'UPDATE');
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
                        console.log('syncUpdatesDownstream buildAffectedLists after syncBackSeens');
                        buildAffectedLists(res.data.updates).then(function (res2) {
                          updateListNotificationCount('updateCount', res2);
                          defer.resolve(res2);
                        }, function (err) {
                          console.error('syncUpdatesDownstream buildAffectedLists error');
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
        syncCrossingsUpstream: syncCrossingsUpstream,
        syncCrossingsDownstream: syncCrossingsDownstream,
        crossLocalEntry: crossLocalEntry,
        syncSeensUpstream: syncSeensUpstream,
        syncSeenDownstream: syncSeenDownstream,
        syncDeletesDownstream: syncDeletesDownstream,
        deleteLocalEntry: deleteLocalEntry,
        syncDeliveryDownstream: syncDeliveryDownstream,
        syncUpdatesUpstream: syncUpdatesUpstream,
        syncUpdatesDownstream: syncUpdatesDownstream,
        maintainGlobalEntries: maintainGlobalEntries,
        getCategoryIndex: getCategoryIndex
      }
    }
  )
;
