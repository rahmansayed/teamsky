angular.module('starter.services')

  .factory('localRetailerHandlerV2', function ($q, global, serverHandlerRetailerV2) {

      function getAllRetailers() {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "SELECT *" +
            " from retailer";
          tx.executeSql(query, [], function (tx, res) {
            console.log("getAllRetailers query res = " + JSON.stringify(res));
            var retailers = [];
            for (var i = 0; i < res.rows.length; i++) {
              retailers.push(res.rows.item(i));
            }
            defer.resolve(retailers);

          }, function (err) {
            console.log("getAllRetailers query err = " + err.message);
            defer.reject();
          })
        }, function (err) {
          console.log("getAllRetailers query err = " + err.message);
          defer.reject();
        }, function () {
        });
        return defer.promise;
      }

      function addRetailer(retailer) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "insert into retailer (retailerLocalId, retailerName, retailerServerId, origin, flag) " +
            " values (null,?,'', 'L', 'N')";
          tx.executeSql(query, [retailer.retailerName], function (tx, res) {
            console.log("addRetailer query res = " + JSON.stringify(res));
            serverHandlerRetailerV2.syncLocalRetailerUpstream();
            var query_tl_insert = "insert into retailer_tl  (retailerLocalId,language,retailerName) values (?,?,?)";
            tx.executeSql(query_tl_insert, [res.insertId, 'EN', retailer.retailerName]);
            defer.resolve(res.insertId);
          }, function (err) {
            console.log("addRetailer query err = " + err.message);
            defer.reject();
          });
        }, function (err) {
          console.log("addRetailer query err = " + err.message);
          defer.reject();
        }, function () {
        });
        return defer.promise;
      }

      return {
        getAllRetailers: getAllRetailers,
        addRetailer: addRetailer
      };
    }
  );
