angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerEntryV2', function ($http, global, $q, serverHandlerItemsV2, serverHandlerListV2) {

    var serviceName = "serverHandlerEntryV2";

    //------------------------consoleLog

    function consoleLog(text) {
      //return;
      console.log(serviceName + "  =>  " + text);
    }

    function createEntry(entry) {

      consoleLog("Start createList");
      var defer = $q.defer();

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

      consoleLog(" List to Be Created = " + JSON.stringify(data));

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

    function synEntries() {
      var defer = $q.defer();
      consoleLog("In syncEntries");
      global.db.transaction(function (tx) {
        var query = "select entry.*, list.listServerId, masterItem.itemServerId, retailer.retailerServerId " +
          " from entry left join list on entry.listLocalId = list.listLocalId left join masterItem on entry.itemLocalId = masterItem.itemLocalId left join retailer  on entry.retailerLocalId = retailer.retailerLocalId " +
          " where entry.entryServerId = ''";
        tx.executeSql(query, [], function (tx, result) {
            consoleLog("synEntries result = " + JSON.stringify(result));
            consoleLog("synEntries result.rows = " + JSON.stringify(result.rows));
            consoleLog("synEntries result.rows[0] = " + JSON.stringify(result.rows[0]));
            consoleLog("synEntries result.rows.length = " + JSON.stringify(result.rows.length));
            var entries = {
              listServerId: result.rows[0].listServerId,
              deviceServerId: global.deviceServerId,
              entries: []
            };
            for (i = 0; i < result.rows.length; i++) {
              entries.entries.push({
                entryLocalId: result.rows[i].entryLocalId,
                itemServerId: result.rows[i].itemServerId,
                qty: result.rows[i].qty,
                uom: result.rows[i].uom,
                retailerServerId: result.rows[i].retailerServerId
              });
            }

            $http.post(global.serverIP + "/api/entry/addmany", entries)
              .then(function (response) {
                consoleLog("synEntries createEntries server Response Result => " + JSON.stringify(response));
                defer.resolve(response.data);
                consoleLog("synEntries createEntries server Response Done");
                global.db.transaction(function (tx) {
                    var query = "update entry set entryServerId = ? where entryLocalId = ?";
                    for (var i = 0; i < response.data.length; i++) {
                      tx.executeSql(query, [response.data[i].entryServerId, response.data[i].entryLocalId]);
                    }
                  }, function (err) {
                    consoleLog("synEntries DB update Error = " + err);
                    defer.reject(err);
                  }, function () {
                    consoleLog("synEntries DB update successfull");
                    defer.resolve();
                  }
                );
              }, function (error) {
                consoleLog("synEntries Server Sync error = " + JSON.stringify(error));
              });
          }
        );
      });
      return defer.promise;
    };

    return {
      createEntry: createEntry,
      // this function is used to synchronize all the un-sync'd lists
      syncEntries: synEntries
    }
  });
