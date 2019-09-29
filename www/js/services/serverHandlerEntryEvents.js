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
          local: ["update entry set entryCrossedFlag = 1,lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set entryCrossedFlag = 5,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set entryCrossedFlag = 7,lastupdatedate = datetime('now','localtime') "]
          }
        },
        upstreamReplyAction: {
          flag: "entryCrossedFlag",
          value: "2"
        },
        upstreamServerAPI: "/api/entry/crossmany",
        downstreamServerAPI: "/api/entry/getCrossings",
        downstreamBackAPI: "/api/entry/syncCrossingsBack",
        listNotification: "crossCount"
      },
      "DELETE": {
        check: {
          flag: "deleted",
          value: 1
        },
        action: {
          local: ["update entry set deleted = 1,lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set deleted = 5,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set deleted = 5,lastupdatedate = datetime('now','localtime') "]
          }
        },
        upstreamReplyAction: {
          flag: "deleted",
          value: "2"
        },
        upstreamServerAPI: "/api/entry/deletemany",
        downstreamServerAPI: "/api/entry/getDeletes",
        downstreamBackAPI: "/api/entry/syncDeletesBack"
      },
      "UPDATE": {
        downstreamBackAPI: "/api/entry/syncUpdatesBack"
      },
      "CREATE": {
/*        check: {
         flag: "createStatus",
         value: "CREATED" 
        },*/
/*        action: {
          local: ["update entry set createStatus = 'SERVER_RECEIVE',lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set createStatus = 'SERVER_RECEIVE',lastupdatedate = datetime('now','localtime')  "],
            "FOREGROUND": ["update entry set createStatus = 'SERVER_RECEIVE',lastupdatedate = datetime('now','localtime')  "]
          }
        },  */
        downstreamBackAPI: "/api/entry/syncBackMany"
      },
      "CREATE-SEEN": {
        check: {
         flag: "createStatus",
         value: "FE_SEEN" 
        },
        upstreamReplyAction: {
         flag: "createStatus",
         value: "FE_SEEN_CONFIRM"     
        },
        action: {
          local: ["update entry set createStatus = 'FE_SEEN',lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set createStatus = 'CREATED_SEEN',lastupdatedate = datetime('now','localtime')  "],
            "FOREGROUND": ["update entry set createStatus = 'CREATED_SEEN',lastupdatedate = datetime('now','localtime')  "]
          }
        },
        upstreamServerAPI: "/api/entry/seeEntryEvent/CREATE",
        downstreamServerAPI: "/api/entry/getSeens/CREATE",
        downstreamBackAPI: "/api/entry/syncSeensBack/CREATE",
        listNotification: "seenCount"
      },
/*      "CREATE-SEEN": {
        check: {
          //flag: "flag",
          //value: "6"
         flag: "createStatus",
         value: "RECEIVER_RECEIVE" 
        },
        upstreamReplyAction: {
//         flag: "flag",
          //value: "7"
         flag: "createStatus",
         value: "RECEIVER_RECEIVE"     
        },
        action: {
          local: ["update entry set flag = 6 "],
          server: {
            "BACKGROUND": ["update entry set flag = 4 "],
            "FOREGROUND": ["update entry set flag = 4 "]
          }
        },
        upstreamServerAPI: "/api/entry/seeEntryEvent/CREATE",
        downstreamServerAPI: "/api/entry/getSeens/CREATE",
        downstreamBackAPI: "/api/entry/syncSeensBack/CREATE",
        listNotification: "seenCount"
      },*/
/*      "CREATE-DELIVER": {
        check: {
          flag: "flag",
          value: "5"
        },
        action: {
          "server": {
            "BACKGROUND": ["update entry set flag = 3 "],
            "FOREGROUND": ["update entry set flag = 3 "]
          }
        },
        downstreamServerAPI: "/api/entry/getDelivers/CREATE",
        downstreamBackAPI: "/api/entry/syncDeliversBack/CREATE",
        listNotification: "deliverCount"
      }*/
       "CREATE-DELIVER": {
        check: {
          flag: "createStatus",
          value: "SERVER_RECEIVE"
        },
        action: {
          "server": {
            "BACKGROUND": ["update entry set createStatus = 'RECEIVER_RECEIVE',lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set createStatus = 'RECEIVER_RECEIVE',lastupdatedate = datetime('now','localtime') "]
          }
        },
        downstreamServerAPI: "/api/entry/getDelivers/CREATE",
        downstreamBackAPI: "/api/entry/syncDeliversBack/CREATE",
        listNotification: "deliverCount"
      }
        , 
    "CREATE-DELIVER-CONFIRM": {
 /*       check: {
          flag: "createStatus",
          value: "RECEIVER_RECEIVE"
        },*/
        action: {
          "server": {
            "BACKGROUND": ["update entry set createStatus = 'RECEIVER_RECEIVE_CONFIRM',lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set createStatus = 'RECEIVER_RECEIVE_CONFIRM',lastupdatedate = datetime('now','localtime') "]
          }
        }//,
        //downstreamServerAPI: "/api/entry/getDelivers/CREATE",
       // downstreamBackAPI: "/api/entry/syncDeliversBack/CREATE",
       // listNotification: "deliverCount"
      }
        ,
      "UPDATE-SEEN": {
        check: {
          flag: "updatedFlag",
          value: "6"
        },
        upstreamReplyAction: {
          flag: "updatedFlag",
          value: "7"
        },
        action: {
          local: ["update entry set updatedFlag = 6,lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set updatedFlag = 4,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set updatedFlag = 4,lastupdatedate = datetime('now','localtime') "]
          }
        },
        upstreamServerAPI: "/api/entry/seeEntryEvent/UPDATE",
        downstreamServerAPI: "/api/entry/getSeens/UPDATE",
        downstreamBackAPI: "/api/entry/syncSeensBack/UPDATE",
        listNotification: "seenCount"
      },
      "UPDATE-DELIVER": {
        check: {
          flag: "updatedFlag",
          value: "5"
        },
        action: {
          "server": {
            "BACKGROUND": ["update entry set updatedFlag = 3,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set updatedFlag = 3,lastupdatedate = datetime('now','localtime') "]
          }
        },
        downstreamServerAPI: "/api/entry/getDelivers/UPDATE",
        downstreamBackAPI: "/api/entry/syncDeliversBack/UPDATE",
        listNotification: "deliverCount"
      },
      "CROSS-SEEN": {
        check: {
          flag: "entryCrossedFlag",
          value: "6"
        },
        upstreamReplyAction: {
          flag: "entryCrossedFlag",
          value: "7"
        },
        action: {
          local: ["update entry set entryCrossedFlag = 6,lastupdatedate = datetime('now','localtime') "],
          server: {
            "BACKGROUND": ["update entry set entryCrossedFlag = 4,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set entryCrossedFlag = 4,lastupdatedate = datetime('now','localtime') "]
          }
        },
        upstreamServerAPI: "/api/entry/seeEntryEvent/CROSS",
        downstreamServerAPI: "/api/entry/getSeens/CROSS",
        downstreamBackAPI: "/api/entry/syncSeensBack/CROSS",
        listNotification: "seenCount"
      },
      "CROSS-DELIVER": {
        check: {
          flag: "entryCrossedFlag",
          value: "5"
        },
        action: {
          "server": {
            "BACKGROUND": ["update entry set entryCrossedFlag = 3,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set entryCrossedFlag = 3,lastupdatedate = datetime('now','localtime') "]
          }

        },
        downstreamServerAPI: "/api/entry/getDelivers/CROSS",
        downstreamBackAPI: "/api/entry/syncDeliversBack/CROSS",
        listNotification: "deliverCount"
      },
      "DELETE-SEEN": {
        check: {
          flag: "deleted",
          value: "6"
        },
        upstreamReplyAction: {
          flag: "deleted",
          value: "7"
        },
        action: {
          local: ["update entry set deleted = 6 "],
          server: {
            "BACKGROUND": ["update entry set deleted = 4,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set deleted = 4,lastupdatedate = datetime('now','localtime') "]
          }
        },
        upstreamServerAPI: "/api/entry/seeEntryEvent/DELETE",
        downstreamServerAPI: "/api/entry/getSeens/DELETE",
        downstreamBackAPI: "/api/entry/syncSeensBack/DELETE",
        listNotification: "seenCount"
      },
      "DELETE-DELIVER": {
        check: {
          flag: "deleted",
          value: "5"
        },
        action: {
          "server": {
            "BACKGROUND": ["update entry set deleted = 3,lastupdatedate = datetime('now','localtime') "],
            "FOREGROUND": ["update entry set deleted = 3,lastupdatedate = datetime('now','localtime') "]
          }
        },
        downstreamServerAPI: "/api/entry/getDelivers/DELETE",
        downstreamBackAPI: "/api/entry/syncDeliversBack/DELETE",
        listNotification: "deliverCount"
      }
    };
/////////////////////////////////////////////////////////////////////////////////////
    function applyEvent(entry, event, source) {
      console.log('applyEvent entry = ' + angular.toJson(entry));
      console.log('applyEvent event = ' + event);
      console.log('applyEvent source = ' + source);
      var deferred = $q.defer();
      var queries = [];
      var mode;
      if ($state.current.name == 'item' && global.currentList.listServerId == entry.listServerId && global.status == 'foreground') {
        mode = 'FOREGROUND';
      } else {
        mode = 'BACKGROUND';
      }
      switch (source) {
        case "server":
          Events[event].action[source][mode].forEach(function (action) {
            queries.push(action + "where entryServerId =?");
          });
          break;
        case "local":
          Events[event].action[source].forEach(function (action) {
            queries.push(action + "where  entryLocalId=?");
          });
          break;
      }


      console.log("applyEvent queries = " + angular.toJson(queries));

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
/////////////////////////////////////////////////////////////////////////////////
        //aalatief step 1
    function syncEventUpstream(event) {
      var defer = $q.defer();
      // building the list queries
      console.log("aalatief syncEventUpstream Events[" + event + "] = " + angular.toJson(Events[event]));

      var query = "select distinct list.listServerId, list.listLocalId " +
        "from entry, list " +
        "where entry.listLocalId = list.listLocalId " +
        " and entry." + Events[event].check.flag + " = '" + Events[event].check.value + "'" +
        " and entry.entryServerId <> ''";

      console.log("aalatief syncEventUpstream query = " + query);


      global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
             console.log('aalatief - syncEventUpstream  res.rows ' + JSON.stringify(res.rows));  
            if (res.rows.length > 0) {
              var promises = [];
              for (var i = 0; i < res.rows.length; i++) {
                console.log('aalatief - syncEventUpstream  crossedListId ' + angular.toJson(res.rows.item(i)));
                promises.push(syncEventUptreamperList(res.rows.item(i), event));
              }

              console.log("aalatief - syncEventUpstream promises = " + angular.toJson(promises));
              $q.all(promises).then(function (res) {
                console.log('aalatief - syncEventUpstream  $q.all resolved ' + angular.toJson(res));
                defer.resolve();
              }, function (err) {
                console.error('aalatief - syncEventUpstream  $q.all err ' + angular.toJson(err));
                defer.reject(err);
              });
            }
            else {
               console.log('aalatief - syncEventUpstream  query no return ');   
              defer.resolve();
            }
          }, function (err) {
            console.error('aalatief - syncEventUpstream  db query err ' + angular.toJson(err));
            defer.reject(err);
          });
        },
        function (err) {
          console.error('aalatief - syncEventUpstream  db err ' + angular.toJson(err));
          defer.reject(err);
        },
        function () {
        }
      );
      return defer.promise;
    }
//////////////////////////////////////////////////////////////////////////
    //aalatief step 2 after syncEventUpstream
    function syncEventUptreamperList(list, event) {
      console.log("aalatief - syncEventUptreamperList Events[" + event + "] = " + JSON.stringify(list));
   
      var defer = $q.defer();
      global.db.transaction(function (tx) {
        var query = "select entry.entryServerId,masterItem.itemServerId " +
          "from entry, list, masterItem " +
          "where entry.listLocalId = list.listLocalId " +
          " and masterItem.itemLocalId = entry.itemLocalId "+    
          " and entry." + Events[event].check.flag + " = '" + Events[event].check.value + "'" +
          " and ifnull(entry.entryServerId,'') <> '' " +
          " and list.listServerId = " + list.listServerId ;

        console.log('aalatief - syncEventUptreamperList query = ' + query);
        console.log('aalatief - syncEventUptreamperList listServerId = ' + list.listServerId);
        tx.executeSql(query, [], function (tx, res) {
          var entryServerIds = [];
          console.log("aalatief - syncEventUptreamperList res.rows.length = " + res.rows.length);
          for (var i = 0; i < res.rows.length; i++) {
            entryServerIds.push({entryServerId:res.rows.item(i).entryServerId,
                                itemServerId:res.rows.item(i).itemServerId});
          }
          console.log('aalatief - syncEventUptreamperList  entryServerIds ' + angular.toJson(entryServerIds));
          syncEventUptreamUpdateServer(list.listServerId, entryServerIds, event).then(function () {
            console.log('aalatief -syncEventUptreamperList  called successfully');
            defer.resolve();
          }, function (err) {
            console.error('aalatief - syncEventUptreamperList  syncEventUptreamUpdateServer ' + angular.toJson(err));
            defer.reject();
          })
        }, function (err) {
            console.error('syncCrossingsUptreamperList  db query err ' + angular.toJson(err));
          defer.reject();
        });
      }, function (err) {
          console.error('syncCrossingsUptreamperList  db err ' + angular.toJson(err));
        defer.reject();
      }, function (res) {
      });
      return defer.promise;
    }
/////////////////////////////////////////////////////////////////////
    //aaaltief : step 3 after syncEventUptreamperList
    function syncEventUptreamUpdateServer(listServerId, entryServerIds, event) {
      var defer = $q.defer();
      console.log('aalatief - syncEventUptreamUpdateServer listServerId  = ' + listServerId);
      console.log('aalatief - syncEventUptreamUpdateServer entryServerIds  = ' + JSON.stringify(entryServerIds));
      console.log('aalatief - syncEventUptreamUpdateServer event  = ' + event);

      var data = {
        deviceServerId: global.deviceServerId,
        userServerId: global.userServerId,
        listServerId: listServerId,
       /* entries: entryServerIds*/
          entries:entryServerIds
      };
        console.log('aalatief - syncEventUptreamUpdateServer API Name  = ' + JSON.stringify(global.serverIP + Events[event].upstreamServerAPI));  
       console.log('aalatief - syncEventUptreamUpdateServer - data: ' + JSON.stringify(data));
        $http.post(global.serverIP + Events[event].upstreamServerAPI, data).then(function (res) {
          console.log('aalatief - syncEventUptreamUpdateServer - res: ' + JSON.stringify(res));
          syncEventUptreamUpdateLocalAfterServer(entryServerIds, event).then(function (res) {
          console.log('aalatief - syncEventUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer called successfully');
          defer.resolve(res);
        }, function (err) {
          console.error('aalatief - syncEventUptreamUpdateServer syncCrossingsUptreamUpdateLocalAfterServer ERR');
          defer.reject();
        });
      }, function (err) {
//          console.error('syncCrossingsUptreamUpdateServer server err ' + angular.toJson(err));
        defer.reject();
      });
      return defer.promise;
    }
///////////////////////////////////////////////////////////////////////////////
    //step4 after syncEventUptreamUpdateServer
    function syncEventUptreamUpdateLocalAfterServer(entryServerIds, event) {
      var defer = $q.defer();
      console.log('aalatief - syncEventUptreamUpdateServer entryServerIds  = ' + JSON.stringify(entryServerIds) + ' event: '+ event);
      global.db.transaction(function (tx) {

        //TODO consider the new flag of origin
        var query = "update entry set ";
        if (Events[event].upstreamReplyAction) {
          query = query + Events[event].upstreamReplyAction.flag + " = " + "'" +Events[event].upstreamReplyAction.value+"'";
              
        }
        query = query + " where entryServerId in ( ";
          
        console.log('aalatief - step4 : syncEventUptreamUpdateLocalAfterServer - Last Query: '+ query) ; 
        query = entryServerIds.reduce(function (query, entryServerId) {
          console.log("aalatief - reduce  entryServerId = " + JSON.stringify(entryServerId.entryServerId));      
          return query + "'" + entryServerId.entryServerId + "', ";
        }, query);
        //console.log("aalatief - syncEventUptreamUpdateLocalAfterServer entryServerId = " + JSON.stringify(entryServerId));  
        console.log("aalatief - syncEventUptreamUpdateLocalAfterServer query before substr= " + query);
        query = query.substr(0, query.length - 2) + ')';
        console.log("aalatief - syncEventUptreamUpdateLocalAfterServer query after substr= " + query);
          console.log('aalatief - step4 : syncEventUptreamUpdateLocalAfterServer - Last Query: '+ query) ;
        //console.log("syncEventUptreamUpdateLocalAfterServer query = " + query);

        tx.executeSql(query, []);
      }, function (err) {
        console.error("aalatief - syncEventUptreamUpdateLocalAfterServer DB error " + JSON.stringify(err));
        defer.reject(err);
      }, function () {
        console.log("aalatief - syncEventUptreamUpdateLocalAfterServer DB update OK ");
        defer.resolve();
      });

      return defer.promise;
    }
///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //aalatief--this is at sender to record deliver
    function syncEventDownstream(entryUpdate, event) {
      console.log('aalatief : syncEventDownstream called = ' + event + 'entryUpdate: '+angular.toJson(entryUpdate));    
      var defer = $q.defer();

      console.log('syncEventDownstream event = ' + event);

      var data = {
        deviceServerId: Number(global.deviceServerId),
        userServerId: Number(global.userServerId)
      };

      var myPromise;
      if (entryUpdate) {
        myPromise = $q.resolve({
          data: {
            entries: [{
              entryServerId: entryUpdate.entry.entryServerId,
              _id: entryUpdate._id
            }]
          }
        })
        ;
      } else {
         console.log('aalatief - syncBackEvent Data  = ' +  JSON.stringify(data));
        console.log('aalatief - syncBackEvent API Name  = ' + JSON.stringify(global.serverIP + Events[event].downstreamServerAPI));   
          
        myPromise = $http.post(global.serverIP + Events[event].downstreamServerAPI, data);
      }
      myPromise.then(function (res) {
           console.log('aalatief - syncBackEvent myPromise  = ' +  JSON.stringify(res.data.entries));
          res.data.entries.forEach(function (entry) {
            getEntryFromLocalDB(entry.entryServerId).then(function (entry) {
            console.log('   aalatief - getEntryFromLocalDB Data  = ' +  JSON.stringify(entry));
              applyEvent(entry, event, 'server').then(function () {
                if ($state.current.name == 'item' && global.currentList.listServerId == entry.listServerId && global.status == 'foreground') {
                  applyEvent(entry, event || '-SEEN', 'server');
                }
              });
            });
          });
          /// need to add check if eveent is not like '%CONFIRM%'
          if (res.data.entries.length > 0) {
            syncBackEvent(res.data.entries, event).then(function (res1) {
                 console.log('syncEventDownstream buildAffectedLists res1'+JSON.stringify(res1));   
              buildAffectedLists(res.data.entries).then(function (res2) {
                  console.log('syncEventDownstream buildAffectedLists res2'+JSON.stringify(res2)+' Events[event].listNotification '+ JSON.stringify(Events[event].listNotification));   
                updateListNotificationCount(Events[event].listNotification, res2);
                defer.resolve(res2);
              }, function (err) {
                console.error('aalatief - syncEventDownstream buildAffectedLists err');
              });
            });
          }
        }
      );
      return defer.promise;
    }
//////////////////////////////////////////////////////////////////////////////////////////
///aalatief : 
    function syncBackEvent(entryUpdates, event) {
     
      console.log('aalatief - syncBackEvent' + JSON.stringify(entryUpdates))   ;
      var defer = $q.defer();

      var data = {
        userServerId: Number(global.userServerId),
        deviceServerId: Number(global.deviceServerId)
      };
        
        console.log('aalatief - syncBackEvent - entryUpdates[0].listServerId' + JSON.stringify(entryUpdates[0].listServerId))   ;
        
      data.entries = entryUpdates.map(function (entryUpdate) {
        return {   
          listServerId : entryUpdates[0].listServerId,
          entryServerId: typeof entryUpdate.entryServerId === 'object' ? entryUpdate.entryServerId : entryUpdate.entryServerId,
          entryUpdateId: entryUpdate._id,
          itemServerId: entryUpdates[0].itemServerId    
        
        };
      });
         //data.entries.listServerId =entryUpdates[0].listServerId;

      console.log('syncBackEvent data = ' + JSON.stringify(data));
      console.log('syncBackEvent API Name  = ' + JSON.stringify(global.serverIP + Events[event].downstreamBackAPI));  
      $http.post(global.serverIP + Events[event].downstreamBackAPI, data).then(function (res) {
//          console.log('syncBackCrossings server reply = ' + angular.toJson(res));
        defer.resolve(res);
      }, function (err) {
        console.error('syncBackEvent server error ' + err.message);
        defer.reject(err);
      });

      return defer.promise;
    }

    function getEntryFromLocalDB(entryServerId) {
      var defer = $q.defer();
        console.log ('aalatief - entryServerId: ' + angular.toJson(entryServerId) /*+ 'entryServerId._id: ' + entryServerId._id*/);
      global.db.transaction(function (tx) {

        var query = "SELECT e.*, l.listLocalId,e.itemLocalId, itl.itemName, ctl.categoryName, ifnull(rtl.retailerName, 'Anywhere') as retailerName" +
          " FROM ( " +
          " (masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) " +
          " left join retailer as r on e.retailerLocalId = r.retailerLocalId " +
          " left join retailer_tl as rtl on r.retailerLocalId = rtl.retailerLocalId and rtl.language = e.language" +
          " INNER JOIN masterItem_tl AS itl on e.language = itl.language and itl.itemlocalId = i.itemLocalId " +
          " INNER JOIN list AS l ON e.listLocalId = l.listLocalId) " +
          " INNER JOIN category AS c ON i.categoryLocalId = c.categoryLocalId " +
          " INNER JOIN category_tl AS ctl ON c.categoryLocalId = ctl.categoryLocalId and ctl.language = e.language" +
          " where e.entryServerId = ? ";

        tx.executeSql(query,  [entryServerId] /*[entryServerId]*/, function (tx, res) {
          console.log('Query' +  query + 'entryServerId:' + entryServerId);
          if (res.rows.length > 0) {
            defer.resolve(res.rows.item(0));
          }
          else {
            console.error('getCrossedEntryFromLocalDB entry not found entryServerId = ' + entryServerId);
            defer.reject();
          }
        }, function (err) {
          console.error('getCrossedEntryFromLocalDB db error' + angular.toJson(err));
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
        
      console.log("aalatief - buildAffectedLists entries = " + JSON.stringify(entries));    
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
          console.log('affectedLists function list.cnt = ' + list.cnt);  
          tx.executeSql(query, [list.cnt, list.listLocalId]);
        });
      }, function (err) {
        //console.error('updateListNotificationCount db err ' + angular.toJson(err));
        defer.reject();
      }, function () {
        console.log('updateListNotificationCount db completed');
        defer.resolve();
      });
      return defer.promise;
    }

    function maintainGlobalEntries(entry, operation) {
      console.log('maintainGlobalEntries entry = ' + angular.toJson(entry));
      console.log('maintainGlobalEntries operation = ' + operation);

      if (entry.listLocalId == global.currentList.listLocalId) {
        console.log('maintainGlobalEntries global.currentListEntries = ' + angular.toJson(global.currentListEntries));
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
          case 'CREATE-SEEN':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].flag = 4;
                global.currentListEntries.listOpenEntries.entries[openIdx].createStatus = 'CREATED_SEEN';
            break;
          case 'CREATE-DELIVER':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].flag = 3;
              global.currentListEntries.listOpenEntries.entries[openIdx].createStatus = 'RECEIVER_RECEIVE';    
                
            break;
          case 'CROSS-SEEN':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].entryCrossedFlag = 4;
            break;
          case 'CROSS-DELIVER':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].entryCrossedFlag = 3;
            break;
          case 'UPDATE-SEEN':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].updatedFlag = 4;
            break;
          case 'UPDATE-DELIVER':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].deliveredFlag = 3;
            break;
          case 'DELETE-SEEN':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].deleted = 4;
            break;
          case 'DELETE-DELIVER':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].deliveredFlag = 3;
            break;
          case 'UPLOADED':
            if (openIdx > -1)
              global.currentListEntries.listOpenEntries.entries[openIdx].flag = 2;
              global.currentListEntries.listOpenEntries.entries[openIdx].createStatus = 'SERVER_RECEIVE';    
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
        console.log('maintainGlobalEntries AFTER global.currentListEntries = ' + angular.toJson(global.currentListEntries));
          $state.reload();
      }
    }

    function getCategoryCount(categoryName) {
      return global.currentListEntries.listOpenEntries.entries.filter(function (entry) {
        return entry.categoryName == categoryName;
      }).length;
    }

    function getCategoryIndex(categoryName, categoryList) {
      var idx = -1;
      //console.log("getCategoryIndex categoryList = " + angular.toJson(categoryList));
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
      syncBackEvent: syncBackEvent,
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

