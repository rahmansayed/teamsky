angular.module('starter.services')

  .factory('localRetailerHandlerV2', function ($q, global, serverHandlerRetailerV2, localItemHandlerV2) {

    function getAllRetailers() {
      var defer = $q.defer();

      global.db.transaction(function (tx) {
        var query = "SELECT *" +
          " from retailer";
        tx.executeSql(query, [], function (tx, res) {
          console.log("getAllRetailers query res = " + angular.toJson(res));
          var retailers = [];
          for (var i = 0; i < res.rows.length; i++) {
            retailers.push(res.rows.item(i));
          }
          defer.resolve(retailers);

        }, function (err) {
          console.error("getAllRetailers query err = " + err.message);
          defer.reject();
        })
      }, function (err) {
        console.error("getAllRetailers query err = " + err.message);
        defer.reject();
      }, function () {
      });
      return defer.promise;
    }

    function addRetailer(retailerName) {
      var defer = $q.defer();

      global.db.transaction(function (tx) {
        var checkQuery = "select retailerLocalId from retailer where retailerName = ?";
        tx.executeSql(checkQuery, [retailerName], function (tx, res) {
          if (res.rows.length > 0) {
            defer.resolve(res.rows.item(0).retailerLocalId);
          } else {
            var insertQuery = "insert or ignore into retailer (retailerLocalId, retailerName, retailerServerId, origin, flag) " +
              " values (null,?,'', 'L', 'N')";
            tx.executeSql(insertQuery, [retailerName], function (tx, res) {
              console.log("addRetailer query res.insertId = " + angular.toJson(res.insertId));
              serverHandlerRetailerV2.syncLocalRetailerUpstream();
              var query_tl_insert = "insert or ignore into retailer_tl  (retailerLocalId,language,retailerName) values (?,?,?)";
              tx.executeSql(query_tl_insert, [res.insertId, 'EN', retailerName]);
              tx.executeSql(query_tl_insert, [res.insertId, 'AR', retailerName]);
              defer.resolve(res.insertId);
            }, function (err) {
              console.error("addRetailer query err = " + err.message);
              defer.reject();
            });

          }
        });
      }, function (err) {
        console.error("addRetailer query err = " + err.message);
        defer.reject();
      }, function () {
      });
      return defer.promise;
    }

    /*-------------------------------------------------------------------------------------*/
    /*Search Function*/
    function search(searchFilter, searchArray) {
      console.log('13/3/2017 - aalatief - search isRTL = ' + localItemHandlerV2.isRTL(searchFilter));
      var lang = localItemHandlerV2.isRTL(searchFilter) ? 'AR' : 'EN';
      var deferred = $q.defer();
      if (searchFilter.length > 0) {
        console.log('13/3/2017 - aalatief - searchRetailerDB searchFilter = ' + searchFilter);
        var words = searchFilter.toLowerCase().split(" ");
        var matches = [];
        for (var j = 0; j < searchArray.length; j++) {
          var match = true;
          for (var i = 0; i < words.length; i++) {
            console.log("13/3/2017 - aalatief - searchRetailer searchArray[j] = " + angular.toJson(searchArray[j]));
            console.log("13/3/2017 - aalatief - Condition checked= " + angular.toJson(searchArray[j].retailerName));
            console.log("13/3/2017 - aalatief - words(i)= " + angular.toJson(words[i].toLowerCase()));
            if (searchArray[j].retailerName.toLowerCase().indexOf(words[i]) == -1 /*||
             searchArray[j].language != lang*/
            ) {
              console.log("13/3/2017 - aalatief - Match Falsed");
              match = false;
              break;
            }
          }
          if (match) {
            matches.push(searchArray[j]);
          }
        }
        deferred.resolve(matches);
      } else {
        deferred.resolve([]);
      }
      return deferred.promise;
    }

    /*-----------------------------------------------------------------------------------------*/


    return {
      getAllRetailers: getAllRetailers,
      addRetailer: addRetailer,
      search: search
    };
  });
