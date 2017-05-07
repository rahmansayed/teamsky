/**
 * Created by Abdul Rahman on 5/2/2017.
 */
angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryEvents', function ($http, global, $q, serverHandlerItemsV2, $state, serverHandlerListV2, serverHandlerRetailerV2, dbHelper) {

    var Events = {
      "CROSS": {
        check: {
          flag: "entryCrossedFlag",
          value: "1"
        },
        action: {
          local: ["update entry set entryCrossedFlag = 1, flag = 'E' "],
          server: ["update entry set entryCrossedFlag = 1, flag = 'S' "]
        },
        upstreamServerAPI: "/api/entry/crossmany",
        downstreamServerAPI: "/api/entry/getCrossings",
        downstreamBackAPI: "/api/entry/syncCrossingsBack",
        listNotification: "crossCount"
      },
      "DELETE": {
        check: {
          flag: "deleted",
          value: "Y"
        },
        action: {
          local: ["update entry set deleted = 'Y', flag = 'E' "],
          server: ["update entry set deleted = 'Y', flag = 'S' "]
        },
        upstreamServerAPI: "/api/entry/deletemany",
        downstreamServerAPI: "/api/entry/getDeletes",
        downstreamBackAPI: "/api/entry/syncDeletesBack"
      },
      "SEEN": {
        check: {
          flag: "seenFlag",
          value: "1"
        },
        upstreamReplyAction: {
          flag: "seenFlag",
          value: "2"
        },
        action: {
          local: ["update entry set seenFlag = 1, flag = 'E' "],
          server: ["update entry set seenFlag = 3, flag = 'S' "]
        },
        upstreamServerAPI: "/api/entry/seemany",
        downstreamServerAPI: "/api/entry/getSeens",
        downstreamBackAPI: "/api/entry/syncSeensBack",
        listNotification: "seenCount"
      },
      "DELIVER": {
        check: {
          flag: "deliveredFlag",
          value: "1"
        },
        action: {
          "server": ["update entry set deliveredFlag = 1, flag = 'S' "]
        },
        downstreamServerAPI: "/api/entry/getDelivers",
        downstreamBackAPI: "/api/entry/syncDeliversBack",
        listNotification: "deliverCount"
      }
    };

    function applyEvent(entry, event, source) {
      console.log('applyEvent entry = ' + JSON.stringify(entry));
      console.log('applyEvent event = ' + event);
      console.log('applyEvent source = ' + source);
      var deferred = $q.defer();
      var queries = [];
      Events[event].action[source].forEach(function (action) {
        switch (source) {
          case "server":
            queries.push(action + "where entryServerId =?");
            break;
          case "local":
            queries.push(action + "where  entryLocalId=?");
            break;
        }
      });

      console.log("applyEvent queries = " + JSON.stringify(queries));

      global.db.transaction(function (tx) {
        queries.forEach(function (query) {
          switch (source) {
            case "server":
              tx.executeSql(query, [entry.entryServerId]);
              break;
            case "local":
              tx.executeSql(query, [entry.entryLocalId]);
              break;
          }
        });
      }, function (err) {
        console.error("applyEvent db err " + err.message);
        deferred.reject(err);
      }, function () {
        switch (source) {
          case "server":
            getEntryFromLocalDB(entry.entryServerId).then(function (newEntry) {
              maintainGlobalEntries(newEntry, event);
            });
            break;
          case "local":
            syncEventUpstream(event);
            maintainGlobalEntries(entry, event);
            break;
        }
      });
      return deferred.promise;
    };

    function syncEventUpstream(event) {
      var defer = $q.defer();
      // building the list queries
      var query = "select distinct list.listServerId, list.listLocalId " +
        "from entry, list " +
        "where entry.listLocalId = list.listLocalId " +
        " and entry." + Events[event].check.flag + " = '" + Events[event].check.value + "'" +
        " and entry.entryServerId <> ''" +
        " and entry.flag = 'E'";

      console.log("syncEventUpstream query = " + query);
      console.log("syncEventUpstream Events[event] = " + JSON.stringify(Events[event]));

      global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
            if (res.rows.length > 0) {
              var promises = [];
              for (var i = 0; i < res.rows.length; i++) {
                console.log('syncEventUpstream  crossedListId ' + JSON.stringify(res.rows.item(i)));
                promises.push(syncEventUptreamperList(res.rows.item(i), event));
              }

              console.log("syncEventUpstream promises = " + JSON.stringify(promises));
              $q.all(promises).then(function (res) {
                console.log('syncEventUpstream  $q.all resolved ' + JSON.stringify(res));
                defer.resolve();
              }, function (err) {
                console.error('syncEventUpstream  $q.all err ' + JSON.stringify(err));
                defer.reject(err);
              });
            }
            else {
              defer.resolve();
            }
          }, function (err) {
            console.error('syncEventUpstream  db query err ' + JSON.stringify(err));
            defer.reject(err);
          });
        },
        function (err) {
          console.error('syncEventUpstream  db err ' + JSON.stringify(err));
          defer.reject(err);
        },
        function () {
        }
      );
      return defer.promise;
    }

    function syncEventUptreamperList(list, event) {
      var defer = $q.defer();
      global.db.transaction(function (tx) {
        var query = "select entry.entryServerId " +
          "from entry, list " +
          "where entry.listLocalId = list.listLocalId " +
          " and entry." + Events[event].check.flag + " = '" + Events[event].check.value + "'" +
          " and ifnull(entry.entryServerId,'') <> '' " +
          " and entry.flag = 'E'" +
          " and list.listServerId = '" + list.listServerId + "'";

        console.log('syncEventUptreamperList query = ' + query);
        console.log('syncEventUptreamperList listServerId = ' + list.listServerId);
        tx.executeSql(query, [], function (tx, res) {
          var entryServerIds = [];
          console.log("syncEventUptreamperList res.rows.length = " + res.rows.length);
          for (var i = 0; i < res.rows.length; i++) {
            entryServerIds.push(res.rows.item(i).entryServerId);
          }
          console.log('syncEventUptreamperList  entryServerIds ' + JSON.stringify(entryServerIds));
          syncEventUptreamUpdateServer(list.listServerId, entryServerIds, event).then(function () {
            console.log('syncEventUptreamperList  called successfully');
            defer.resolve();
          }, function (err) {
            console.error('syncEventUptreamperList  syncEventUptreamUpdateServer ' + JSON.stringify(err));
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

    function syncEventUptreamUpdateServer(listServerId, entryServerIds, event) {
      var defer = $q.defer();

      var data = {
        deviceServerId: global.deviceServerId,
        userServerId: global.userServerId,
        listServerId: listServerId,
        entries: entryServerIds
      };

      $http.post(global.serverIP + Events[event].upstreamServerAPI, data).then(function (res) {
        syncEventUptreamUpdateLocalAfterServer(entryServerIds, event).then(function (res) {
          console.log('syncEventUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer called successfully');
          defer.resolve(res);
        }, function (err) {
          console.error('syncEventUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer ERR');
          defer.reject();
        });
      }, function (err) {
//          console.error('syncCrossingsUptreamUpdateServer server err ' + JSON.stringify(err));
        defer.reject();
      });
      return defer.promise;
    }

    function syncEventUptreamUpdateLocalAfterServer(entryServerIds, event) {
      var defer = $q.defer();

      global.db.transaction(function (tx) {

        //TODO consider the new flag of origin
        var query = "update entry set flag = 'S' ";
        if (Events[event].upstreamReplyAction) {
          query = query + ", " + Events[event].upstreamReplyAction.flag + " = " + Events[event].upstreamReplyAction.value;
        }
        query = query + " where entryServerId in ( ";
        query = entryServerIds.reduce(function (query, entryServerId) {
          return query + "'" + entryServerId + "', ";
        }, query);

        query = query.substr(0, query.length - 2) + ')';
        console.log("syncEventUptreamUpdateLocalAfterServer query = " + query);

        tx.executeSql(query, []);
      }, function (err) {
        console.error("syncEventUptreamUpdateLocalAfterServer DB error " + err);
        defer.reject(err);
      }, function () {
        console.log("syncEventUptreamUpdateLocalAfterServer DB update OK ");
        defer.resolve();
      });

      return defer.promise;
    }

    function syncEventDownstream(entryUpdate, event) {
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
        myPromise = $http.post(global.serverIP + Events[event].downstreamServerAPI, data);
      }
      myPromise.then(function (res) {

          var promises = [];
          res.data.forEach(function (entry) {
            getEntryFromLocalDB(entry.entryServerId).then(function (res) {
              applyEvent(res, event, 'server');
            });
          });

          if (res.data.length > 0) {
            syncBackEvent(res.data, event).then(function (res1) {
              buildAffectedLists(res.data).then(function (res2) {
                updateListNotificationCount(Events[event].listNotification, res2);
                defer.resolve(res2);
              }, function (err) {
                console.error('syncEventDownstream buildAffectedLists err');
              });
            });
          }
        }
      );
      return defer.promise;
    }

    function syncBackEvent(entryUpdates, event) {
      var defer = $q.defer();

      var data = {
        userServerId: global.userServerId,
        deviceServerId: global.deviceServerId
      };

      data.entryUpdates = entryUpdates.map(function (entryUpdate) {
        return entryUpdate._id;
      });

      console.log('syncBackEvent data = ' + data);
      $http.post(global.serverIP + Events[event].downstreamBackAPI, data).then(function (res) {
//          console.log('syncBackCrossings server reply = ' + JSON.stringify(res));
        defer.resolve(res);
      }, function (err) {
        console.error('syncBackEvent server error ' + err.message);
        defer.reject(err);
      });

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

    function maintainGlobalEntries(entry, operation) {
      console.log('maintainGlobalEntries entry = ' + JSON.stringify(entry));
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
            if (openIdx != -1) {
              global.currentListEntries.listOpenEntries.entries.splice(openIdx, 1);
              if (getCategoryCount(entry.categoryName) == 0) {
                global.currentListEntries.listOpenEntries.categories.splice(categoryIdx, 1);
              }
            }
            if (crossedIdx != -1) {
              global.currentListEntries.listCrossedEntries.splice(crossedIdx, 1);
            }
            break;
          case 'UPDATE' :
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

    return {
      syncEventUpstream: syncEventUpstream,
      getEntryFromLocalDB: getEntryFromLocalDB,
      updateListNotificationCount: updateListNotificationCount,
      buildAffectedLists: buildAffectedLists,
      syncEventDownstream: syncEventDownstream,
      maintainGlobalEntries: maintainGlobalEntries,
      getCategoryIndex: getCategoryIndex,
      applyEvent: applyEvent
    }
  })
;

