angular.module('starter.services')

  .factory('serverHandlerItemsV2', function ($http, global, $q, dbHandler) {

      //------------------------Global Variable

      var serviceName = "serverHandlerItemsV2";
      //------------------------consoleLog
      function consoleLog(text) {
        //return;
        console.log(serviceName + "  =>  " + text);
      };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // this function is used to truncate the categories table
      function deleteItemsLocal() {
        consoleLog("Start deleteCategoryLocal");

        var defer = $q.defer();
        var query = "delete from masterItem ";
        consoleLog("Statement Run: " + query);


        global.db.transaction(function (tx) {
            tx.executeSql("delete from masterItem ");
            tx.executeSql("delete from masterItem_tl ");

          }
          , function (err) {
            consoleLog(err);
            defer.reject(err);
          }
          , function (response) {
            consoleLog(response);
            defer.resolve(response);
          });
        return defer.promise;
      };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function addItemsLocal(itemsList) {
        consoleLog("itemsList = " + JSON.stringify(itemsList));

        var defer = $q.defer();

        var query_insert_c = "insert into masterItem  (itemLocalId,itemServerId,itemName, categoryLocalId) values (?,?,?,?)";
        var query_insert_wc = "insert into masterItem  (itemLocalId,itemServerId,itemName) values (?,?,?)";
        var query_tl_insert = "insert into masterItem_tl  (itemLocalId,language,itemName) values (?,?,?)";

        global.db.transaction(function (tx) {
            var itemLocalId = 100;
            itemsList.forEach(function (item) {
              var itemServerId = item._id;
              var itemName = item.itemName;
              console.log("SyncItemsV2 categoryName = " + item.categoryName);
              if (item.categoryName) {
                tx.executeSql("select categoryLocalId from category where categoryName = ?", [item.categoryName], function (tx, res) {
                  console.log("SyncItemsV2 categoryLocalId xx= " + JSON.stringify(res.rows[0]));
                  categoryLocalId = res.rows[0].categoryLocalId;
                  consoleLog("categoryLocalId = " + categoryLocalId);
                  tx.executeSql(query_insert_c, [itemLocalId, itemServerId, itemName, categoryLocalId]);
                  for (var j = 0; j < item.translation.length; j++) {

                    var transItemName = item.translation[j].itemName;
                    var transLang = item.translation[j].lang;

                    tx.executeSql(query_tl_insert, [itemLocalId, transLang, transItemName]);
                  }

                  itemLocalId++;
                }, function (tx, error) {
                  console.log("SyncItemsV2 error " + error);
                });
              }
              else {
                consoleLog("NO cat");
                tx.executeSql(query_insert_wc, [itemLocalId, itemServerId, itemName]);
                for (var j = 0; j < item.translation.length; j++) {

                  var transItemName = item.translation[j].itemName;
                  var transLang = item.translation[j].lang;

                  tx.executeSql(query_tl_insert, [itemLocalId, transLang, transItemName]);
                }

                itemLocalId++;
              }
            });
          }
          , function (error) {
            consoleLog("Statement Error additemsLocal " + error.message);

            consoleLog("ERROR = " + JSON.stringify(error));
            defer.resolve(error);
          },
          function (response) {
            consoleLog("items Added =>");
            defer.resolve(response);
          });

        consoleLog("End additemLocal");
        return defer.promise;

      }
      ;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncMasterItems() {

        //deleteCategoryLocal();
        var defer = $q.defer();
        consoleLog("Start syncItems");
        // Start Read Local DB from table category

        consoleLog("Start Read Local DB from table items");
        /*var query = "SELECT  max(categoryServerId) maxItemServerId  FROM category ";
         consoleLog("Query => " + query);

         dbHandler.runQuery(query,[],function(res) {
         consoleLog("Statement true");
         consoleLog("Result JSON=> categoryServerId " + JSON.stringify(res.rows));
         categoryListLocal = res.rows;
         consoleLog("Result JSON=> nnnnnnnnn " + JSON.stringify(categoryListLocal));

         }, function (err) {
         consoleLog(err);
         });
         */


        var query = "SELECT  max(itemServerId) maxItemServerId  FROM masterItem ";
        consoleLog("Query => " + query);

        dbHandler.runQuery(query, [],
          function (localResponse) {

            consoleLog("Statement True");
            consoleLog("localResponse.rows = " + JSON.stringify(localResponse.rows));
            var maxItemServerId;
            if (!localResponse.rows[0].maxItemServerId) {
              maxItemServerId = 0;
            } else {
              maxItemServerId = localResponse.rows[0].maxItemServerId;
            }
            ;

            consoleLog("Result JSON=> maxImteServerId " + maxItemServerId);

            consoleLog("Start Call Server");

            var data = {
              maxItemServerId: maxItemServerId,
              userServerId: global.userServerId,
              deviceServerId: global.deviceServerId
            };

            $http.post(global.serverIP + "/api/items/get", data)
              .then(function (serverResponse) {
                consoleLog(" syncMasterItems Items Server List Back Correctly");
                itemsListServer = serverResponse;

//                consoleLog(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));

                consoleLog(" End updateList Response Done");


                addItemsLocal(serverResponse.data).then(function (string) {
                  defer.resolve(string);
                }, function (error) {
                  defer.reject(error);
                });

              });
            consoleLog("End Call Server");
            consoleLog("///////////////////////////////////////");
            consoleLog("///////////////////////////////////////");

          }, function (error) {
            consoleLog(error);
          });

        consoleLog("End Read Local DB from table items");

        return defer.promise;

        consoleLog("End synchCategory");

      };

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncLocalItem(item) {
        var defer = $q.defer();
        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId,
          itemName: item.itemName
        };

        $http.post(global.serverIP + "/api/items/add", data)
          .then(function (serverResponse) {
            consoleLog(" syncLocalItem Items Server List Back Correctly");
            itemServerId = serverResponse.userItemServerId;

//                consoleLog(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));

            consoleLog(" End updateList Response Done");

            global.db.transaction(function (tx) {
              var query = "update masterItem set itemServerId = ? where itemLocalId = ?";
              tx.executeSql(query, [itemServerId, item.itemLocalId], function (tx, res) {
                consoleLog("Item updated successfully");
                defer.resolve(string);
              }, function (tx, error) {
                consoleLog("Error = " + JSON.stringify(error));
                defer.reject(error);
              });
            });

          });

        return defer.promise;
      }

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // this function sends the locally created items to the server
      function syncLocalItems() {

        //deleteCategoryLocal();
        var defer = $q.defer();
        consoleLog("Start syncItems");
        // Start Read Local DB from table category

        consoleLog("Start Read Local DB from table items");

        var query = "SELECT  * FROM masterItem where itemServerId = ''";
        consoleLog("Query => " + query);

        dbHandler.runQuery(query, [],
          function (result) {

            consoleLog("Statement True");
            consoleLog("localResponse.rows = " + JSON.stringify(result.rows));

            var data = {
              userServerId: global.userServerId,
              deviceServerId: global.deviceServerId,
              items: result.rows
            };

            $http.post(global.serverIP + "/api/items/addmany", data)
              .then(function (serverResponse) {
                consoleLog(" syncLocalItems Items Server List Back Correctly " + JSON.stringify(serverResponse));
                global.db.transaction(function (tx) {

                  var query = "update masterItem set itemServerId = ? where itemLocalId = ?";
                  for (i = 0; i < serverResponse.data.length; i++) {
                    var item = serverResponse.data[i];
                    consoleLog("syncLocalItems item = "+item);
                    tx.executeSql(query, [item.userItemServerId, item.itemLocalId])
                  }
                }, function (error) {
                  consoleLog("synclocalItems Error = " + error);
                  defer.reject(error);
                }, function (result) {
                  defer.resolve(result);
                });
              });

          }, function (error) {
            consoleLog(error);
          });

        consoleLog("End Read Local DB from table items");

        return defer.promise;

      };
      return {
        syncMasterItems: syncMasterItems,
        deleteItemsLocal: deleteItemsLocal,
        syncLocalItem: syncLocalItem,
        syncLocalItems: syncLocalItems
      };
    }
  );

