angular.module('starter.services')

  .factory('serverHandlerItemsV2', function ($http, global, $q, dbHelper, localItemHandlerV2) {

      //------------------------Global Variable

      var serviceName = "serverHandlerItemsV2";
      //------------------------console.log
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // this function is used to truncate the categories table
      function deleteItemsLocal() {
        console.log("Start deleteCategoryLocal");

        var defer = $q.defer();
        var query = "delete from masterItem ";
        console.log("Statement Run: " + query);


        global.db.transaction(function (tx) {
            tx.executeSql("delete from masterItem ");
            tx.executeSql("delete from masterItem_tl ");

          }
          , function (err) {
            console.log(err);
            defer.reject(err);
          }
          , function (response) {
            console.log(response);
            defer.resolve(response);
          });
        return defer.promise;
      };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function addItemsLocal(itemsList) {
        console.log("itemsList = " + JSON.stringify(itemsList));

        var defer = $q.defer();

        var query_insert_c = "insert into masterItem  (itemLocalId,itemServerId,itemName, categoryLocalId, origin, flag, genericFlag, itemPriority) values (null,?,?,?, 'S', 'S',?,0)";
        var query_insert_wc = "insert into masterItem  (itemLocalId,itemServerId,itemName,origin, flag,genericFlag,itemPriority) values (null,?,?,'S','S',?,0)";
        var query_tl_insert = "insert into masterItem_tl  (itemLocalId,language,itemName,lowerItemName, lastUpdateBy) values (?,?,?,?,'SS')";

        dbHelper.buildCatgegoriesMap(itemsList).then(function (categoryMap) {
            global.db.transaction(function (tx) {
                itemsList.forEach(function (item) {
                  var itemServerId = item._id;
                  var itemName = item.itemName;
                  console.log("SyncItemsV2 categoryName = " + item.categoryName);
                  var genericFlag = 0;
                  if (item.generic) {
                    genericFlag = 1;
                  }
                  if (item.categoryName) {
                    var categoryLocalId = dbHelper.getCategoryLocalIdfromMap(item.categoryName, categoryMap);
                    tx.executeSql(query_insert_c, [itemServerId, itemName, categoryLocalId, genericFlag], function (tx, res) {
                      for (var j = 0; j < item.translation.length; j++) {
                        var transItemName = item.translation[j].itemName;
                        var transLang = item.translation[j].lang;
                        tx.executeSql(query_tl_insert, [res.insertId, transLang, transItemName, transItemName.toLowerCase()]);
                      }
                    }, function (err) {
                      console.error("addItemsLocal tx query_insert_c error = " + err.message);
                      defer.reject(err);
                    });
                  }
                  else {
                    console.log("addItemsLocal NO cat");
                    tx.executeSql(query_insert_wc, [itemServerId, itemName, genericFlag], function (tx, res) {
                      for (var j = 0; j < item.translation.length; j++) {
                        var transItemName = item.translation[j].itemName;
                        var transLang = item.translation[j].lang;
                        tx.executeSql(query_tl_insert, [res.insertId, transLang, transItemName, transItemName.toLowerCase()]);
                      }
                    }, function (err) {
                      console.error("addItemsLocal tx query_insert_wc error " + err.message);
                      defer.reject(err);
                    });
                  }
                });
              }, function (err) {
                console.error("addItemsLocal db error " + err.message);
              }, function () {
              }
            );
          },
          function (error) {
            console.error("addItemsLocal buildCatgegoriesMap error " + error.message);
            defer.reject(error);
          });

        return defer.promise;
      }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncMasterItemsDownstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();

        var query = "SELECT  max(itemServerId) maxItemServerId  FROM masterItem where origin = 'S'";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [],
            function (tx, localResponse) {

              console.log("serverHandlerMasterItemV2 syncMasterItemsDownstream localResponse.rows = " + JSON.stringify(localResponse.rows));
              var maxItemServerId;

              maxItemServerId = localResponse.rows.item(0).maxItemServerId || '000000000000000000000000';

              console.log("serverHandlerMasterItemV2 syncMasterItemsDownstream Result JSON=> maxImteServerId " + maxItemServerId);

              var data = {
                maxItemServerId: maxItemServerId,
                userServerId: global.userServerId,
                deviceServerId: global.deviceServerId,
                countryCode: global.countryCode
              };

              console.log("syncMasterItemsDownstream data = " + JSON.stringify(data));
              $http.post(global.serverIP + "/api/items/get", data)
                .then(function (serverResponse) {
                  //console.log(" syncMasterItemsDownstream serverResponse = " + JSON.stringify(serverResponse));
                  if (serverResponse.data.length > 0) {
                    addItemsLocal(serverResponse.data).then(function (string) {
                      localItemHandlerV2.getAllMasterItem().then(function (res) {
                        global.masterItems = res;
                      });
                      defer.resolve(string);
                    }, function (error) {
                      console.error("syncMasterItemsDownstream addItemsLocal error " + error.message);
                      defer.reject(error);
                    });
                  }
                  else {
                    defer.resolve();
                  }
                }, function (err) {
                  console.error("syncMasterItemsDownstream server error " + error.message);
                  defer.reject(err);
                });

            }, function (error) {
              console.error("syncMasterItemsDownstream db error " + error.message);
            });
        });
        return defer.promise;
      };


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncLocalItemUpstream(item) {
        var defer = $q.defer();
        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId,
          itemName: item.itemName,
          itemLocalId: item.itemLocalId
        };

        $http.post(global.serverIP + "/api/items/add", data)
          .then(function (serverResponse) {
            console.log(" syncLocalItem Items Server List Back Correctly");
            itemServerId = serverResponse.data.userItemServerId;

            global.db.transaction(function (tx) {
              var query = "update masterItem set itemServerId = ?, flag = ? where itemLocalId = ?";
              tx.executeSql(query, [itemServerId, 'S', item.itemLocalId], function (tx, res) {
                console.log("Item updated successfully");
                defer.resolve(string);
              }, function (tx, error) {
                console.log("Error = " + JSON.stringify(error));
                defer.reject(error);
              });
            });

          }, function (err) {

          });

        return defer.promise;
      }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this function sends the locally created items to the server
      function syncLocalItemsUpstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();
        // Start Read Local DB from table category

        console.log("syncLocalItemsUpstream started");

        var query = "SELECT  * FROM masterItem where itemServerId = ''";

        global.db.transaction(function (tx) {
            tx.executeSql(query, [],
              function (tx, result) {

                console.log("Statement True");
                console.log("localResponse.rows = " + JSON.stringify(result.rows));

                if (result.rows.length > 0) {
                  var data = {
                    userServerId: global.userServerId,
                    deviceServerId: global.deviceServerId,
                    items: []
                  };

                  for (var i = 0; i < result.rows.length; i++) {
                    data.items.push(result.rows.item(i));
                  }

                  $http.post(global.serverIP + "/api/items/addmany", data)
                    .then(function (serverResponse) {
                      //console.log("serverHandlerMasterItemV2.syncLocalItems Items Server List Back" + JSON.stringify(serverResponse));
                      var query = "update masterItem set itemServerId = ?, flag = ? where itemLocalId = ?";
                      global.db.transaction(function (tx) {
                        for (i = 0; i < serverResponse.data.length; i++) {
                          var item = serverResponse.data[i];
                          tx.executeSql(query, [item.userItemServerId, 'S', item.itemLocalId]);
                        }
                      }, function (err) {
                        console.log("serverHandlerMasterItemV2.syncLocalItems db update error = " + err.message);
                        defer.reject();
                      }, function () {
                        console.log("serverHandlerMasterItemV2.syncLocalItems db update success = ");
                        defer.resolve();
                      })
                    }, function (error) {
                      console.log("serverHandlerMasterItemV2.syncLocalItems server Error = " + error.message);
                      defer.reject(error);
                    });
                }
                else {
                  defer.resolve();
                }
              }, function (err) {
                console.log("serverHandlerMasterItemV2.syncLocalItems db select error = " + err.message);
                defer.reject(err);
              });
          }
          ,
          function (error) {
            console.log("serverHandlerMasterItemV2.syncLocalItems db select error = " + error.message);
            defer.reject(error);
          });

        return defer.promise;
      }


      function syncDownstreamedItemsBack() {
        //deleteCategoryLocal();
        var defer = $q.defer();
        console.log("serverHandlerMasterItemV2 syncDownstreamedItemsBack started");        // Start Read Local DB from table category

        var query = "SELECT  * FROM masterItem where origin = 'O'";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [],
            function (tx, result) {

              console.log("serverHandlerMasterItemV2 syncotheruserslocalItems localResponse.rows = " + JSON.stringify(result.rows));

              if (result.rows.length > 0) {
                var data = {
                  userServerId: global.userServerId,
                  deviceServerId: global.deviceServerId,
                  items: []
                };

                for (var i = 0; i < result.rows.length; i++) {
                  data.items.push(result.rows.item(i));
                }
                $http.post(global.serverIP + "/api/items/syncOtherUserItems", data)
                  .then(function (serverResponse) {
                    console.log("syncotheruserslocalItems Items Server List Back Correctly " + JSON.stringify(serverResponse));
                    defer.resolve();
                  });
              }
              else {
                defer.resolve();
              }
            }, function (error) {
              console.log(error);
            });
        }, function (err) {

        }, function () {

        });

        return defer.promise;
      }

      return {
        syncMasterItemsDownstream: syncMasterItemsDownstream,
        deleteItemsLocal: deleteItemsLocal,
        syncLocalItem: syncLocalItemUpstream,
        syncLocalItemsUpstream: syncLocalItemsUpstream,
        syncDownstreamedItemsBack: syncDownstreamedItemsBack
      };
    }
  )
;


