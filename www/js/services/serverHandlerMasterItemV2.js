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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function addItemsLocalV2(itemsList) {
//        console.log("itemsList = " + angular.toJson(itemsList));

        var defer = $q.defer();

        var query_insert_c = "insert into masterItem  (itemLocalId,itemServerId,itemName, categoryLocalId, origin, flag, genericFlag, itemPriority) " +
          " values (null,?,?," +
          " ( select categoryLocalId from category where categoryName = ? ) " +
          ", 'S', 'S',?,0)";

        var query_tl_insert = "insert into masterItem_tl  (itemLocalId,language,itemName,lowerItemName, lastUpdateBy) " +
          " values (" +
          " (select itemLocalId from masterItem where itemServerId = ? )" +
          ",?,?,?,'SS')";

        global.db.transaction(function (tx) {
          itemsList.forEach(function (item) {
            var genericFlag = 0;
            if (item.generic) {
              genericFlag = 1;
            }
            tx.executeSql(query_insert_c, [item._id, item.itemName, item.categoryName, genericFlag]);

            for (var j = 0; j < item.translation.length; j++) {
              var transItemName = item.translation[j].itemName;
              var transLang = item.translation[j].lang;
              tx.executeSql(query_tl_insert, [item._id, transLang, transItemName, transItemName.toLowerCase()]);
            }

          });

        }, function (err) {
          console.error("addItemsLocalV2 db error = " + err.message);
          defer.reject();
        }, function () {
          defer.resolve();
        });
        return defer.promise;
      }


      function syncMasterItemsDownstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();

        var query = "SELECT  max(itemServerId) maxItemServerId  FROM masterItem where origin = 'S'";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [],
            function (tx, localResponse) {

              console.log("serverHandlerMasterItemV2 syncMasterItemsDownstream localResponse.rows = " + angular.toJson(localResponse.rows));
              var maxItemServerId;

              maxItemServerId = localResponse.rows.item(0).maxItemServerId || '000000000000000000000000';

              console.log("serverHandlerMasterItemV2 syncMasterItemsDownstream Result JSON=> maxImteServerId " + maxItemServerId);

              var data = {
                maxItemServerId: maxItemServerId,
                userServerId: global.userServerId,
                deviceServerId: global.deviceServerId,
                countryCode: global.countryCode
              };

              console.log("syncMasterItemsDownstream data = " + angular.toJson(data));
              $http.post(global.serverIP + "/api/items/get", data)
                .then(function (serverResponse) {
                  console.log("syncMasterItemsDownstream serverResponse.data.length = " + angular.toJson(serverResponse.data.length));
                  if (serverResponse.data.length > 0) {
                    addItemsLocalV2(serverResponse.data).then(function (string) {
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
              defer.reject();
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
                console.log("Error = " + angular.toJson(error));
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
                console.log("localResponse.rows = " + angular.toJson(result.rows));

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
                      //console.log("serverHandlerMasterItemV2.syncLocalItems Items Server List Back" + angular.toJson(serverResponse));
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

              console.log("serverHandlerMasterItemV2 syncotheruserslocalItems localResponse.rows = " + angular.toJson(result.rows));

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
                    console.log("syncotheruserslocalItems Items Server List Back Correctly " + angular.toJson(serverResponse));
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


