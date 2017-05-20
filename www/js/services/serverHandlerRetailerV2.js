angular.module('starter.services')

  .factory('serverHandlerRetailerV2', function ($http, global, $q, dbHelper) {

      function addRetailersDB(retailerList) {
        //console.log("addRetailersDB retailerList = " + JSON.stringify(retailerList));

        var defer = $q.defer();

        var query_insert = "insert into retailer  (retailerLocalId,retailerServerId,retailerName, origin, flag) values (null,?,?, 'S', 'S')";
        var query_tl_insert = "insert into retailer_tl  (retailerLocalId,language,retailerName) values (?,?,?)";

        global.db.transaction(function (tx) {
            retailerList.forEach(function (retailer) {
              var retailerServerId = retailer._id;
              var retailerName = retailer.retailerName;
              tx.executeSql(query_insert, [retailerServerId, retailerName], function (tx, res) {
                for (var j = 0; j < retailer.translation.length; j++) {
                  var transRetailerName = retailer.translation[j].retailerName;
                  var transLang = retailer.translation[j].lang;
                  tx.executeSql(query_tl_insert, [res.insertId, transLang, transRetailerName]);
                }
              }, function (err) {
                defer.reject(err);
              });
            });
          }, function (err) {

          }, function () {
            defer.resolve();
          }
        );

        return defer.promise;
      }


      function syncMasterRetailersDownstream() {
        var defer = $q.defer();

        var query = "SELECT  max(retailerServerId) maxRetailerServerId  FROM retailer where origin = 'S'";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [],
            function (tx, localResponse) {

              console.log("syncMasterRetailersDownstream localResponse.rows = " + JSON.stringify(localResponse.rows));
              var maxItemServerId;

              maxRetailerServerId = localResponse.rows.item(0).maxRetailerServerId || '000000000000000000000000';

              console.log("syncMasterRetailersDownstream Result JSON=> maxRetailerServerId " + maxRetailerServerId);

              var data = {
                maxRetailerServerId: maxRetailerServerId,
                userServerId: global.userServerId,
                deviceServerId: global.deviceServerId
              };

              $http.post(global.serverIP + "/api/retailer/get", data)
                .then(function (serverResponse) {
                  console.log(" syncMasterRetailersDownstream Server List Back Correctly");
//                console.log(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));
                  if (serverResponse.data.length > 0) {
                    addRetailersDB(serverResponse.data).then(function (string) {
                      defer.resolve(string);
                    }, function (error) {
                      defer.reject(error);
                    });
                  }
                  else {
                    defer.resolve();
                  }
                });

            }, function (error) {
              console.log('syncMasterRetailersDownstream err = ' + error);
            });
        });
        return defer.promise;
      };


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this function sends the locally created items to the server
      function syncLocalRetailerUpstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();
        // Start Read Local DB from table category

        console.log("syncLocalRetailerUpstream started");

        var query = "SELECT  * FROM retailer where flag = 'N'";

        global.db.transaction(function (tx) {
            tx.executeSql(query, [],
              function (tx, result) {

                console.log("syncLocalRetailerUpstream localResponse.rows = " + JSON.stringify(result.rows));

                if (result.rows.length > 0) {
                  var data = {
                    userServerId: global.userServerId,
                    deviceServerId: global.deviceServerId,
                    retailers: []
                  };

                  for (var i = 0; i < result.rows.length; i++) {
                    data.retailers.push(result.rows.item(i));
                  }

                  $http.post(global.serverIP + "/api/retailer/addmany", data)
                    .then(function (serverResponse) {
                      console.log("syncLocalRetailerUpstream Server List Back" + JSON.stringify(serverResponse));
                      var query = "update retailer set retailerServerId = ?, flag = ? where retailerLocalId = ?";
                      global.db.transaction(function (tx) {
                        for (i = 0; i < serverResponse.data.length; i++) {
                          var retailer = serverResponse.data[i];
                          tx.executeSql(query, [retailer.userRetailerServerId, 'S', retailer.retailerLocalId]);
                        }
                      }, function (err) {
                        console.log("syncLocalRetailerUpstream db update error = " + err.message);
                        defer.reject();
                      }, function () {
                        console.log("syncLocalRetailerUpstream db update success = ");
                        defer.resolve();
                      })
                    }, function (error) {
                      console.log("syncLocalRetailerUpstream server Error = " + error.message);
                      defer.reject(error);
                    });
                }
                else {
                  defer.resolve();
                }
              }, function (err) {
                console.log("syncLocalRetailerUpstream db select error = " + err.message);
                defer.reject(err);
              });
          }
          ,
          function (error) {
            console.log("syncLocalRetailerUpstream db select error = " + error.message);
            defer.reject(error);
          });

        return defer.promise;
      }


      function syncDownstreamedRetailerBack() {
        //deleteCategoryLocal();
        var defer = $q.defer();
        console.log("syncDownstreamedRetailerBack started");        // Start Read Local DB from table category

        var query = "SELECT  * FROM retailer where origin = 'O'";

        global.db.transaction(function (tx) {
          tx.executeSql(query, [],
            function (tx, result) {

              console.log("syncDownstreamedRetailerBack localResponse.rows = " + JSON.stringify(result.rows));

              if (result.rows.length > 0) {
                var data = {
                  userServerId: global.userServerId,
                  deviceServerId: global.deviceServerId,
                  retailers: []
                };

                for (var i = 0; i < result.rows.length; i++) {
                  data.retailers.push(result.rows.item(i));
                }
                $http.post(global.serverIP + "/api/retailer/syncOtherUserRetailers", data)
                  .then(function (serverResponse) {
                    console.log("syncDownstreamedRetailerBack Server List Back Correctly " + JSON.stringify(serverResponse));
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
        syncDownstreamedRetailerBack: syncDownstreamedRetailerBack,
        syncMasterRetailersDownstream: syncMasterRetailersDownstream,
        syncLocalRetailerUpstream: syncLocalRetailerUpstream
      };
    }
  )
;


