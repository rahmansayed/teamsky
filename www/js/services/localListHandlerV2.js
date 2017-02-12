angular.module('starter.services')

  .factory('localListHandlerV2', function ($http, global, serverListHandler, dbHandler, $q, serverHandlerListV2) {

    /******************************************************************************************************************
     * returns the list identified by listLocalId
     * @param listLocalId
     */
    function getSpecificList(listLocalId) {
      var defer = $q.defer();
      var query = "SELECT * from list where listLocalId=?";
      global.db.transaction(function (tx) {

        tx.executeSql(query, [listLocalId], function (tx, res) {
          console.log("localListHandlerV2.getList + res.rows.item(0) " + JSON.stringify(res.rows.item(0)));
          defer.resolve(res.rows.item(0));
        }, function (err) {
          defer.reject(err);
        })
      }, function (err) {
        defer.reject(err);
      }, function () {
      });
      return deferred.promise;
    };

    /******************************************************************************************************************
     * updates a specific list with the new values
     * @param list
     */
    function update(list) {
      var defer = $q.defer();
      var query = "update list set " +
        " list.listName = ? " +
        ", list.listDescription = ? " +
        ", list.listColor = ? " +
        ", list.listOrder = ? " +
        ", lastUpdateBy = ? " +
        " where listLocalId = ? ";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, list.listColor, list.listOrder, 'L', list.listLocalId],
          function (tx, res) {
            console.log("localListHandlerV2.update + res " + JSON.stringify(res));
            defer.resolve(res);
          }, function (err) {
            defer.reject(err);
          })
      }, function (err) {
        defer.reject(err);
      }, function () {
      });
      return defer.promise;
    };

    /******************************************************************************************************************
     * adds the new list to the localDb and returns the listLocalId
     * @param list
     */
    function addNewList(list) {

      var deferred = $q.defer();
      var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder,lastUpdateDate, lastUpdateBy) " +
        "VALUES (null,?,?,?,?,?,?)";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, '', '', '', new Date().getTime(), 'L'], function (tx, response) {
          //Success Callback
          console.log("localListHandlerV2.addNewList  res " + JSON.stringify(response));
          deferred.resolve(response.insertId);
        }, function (error) {
          console.log("localListHandlerV2.addNewList  error " + error.message);
          deferred.reject(error);
        });
      }, function (err) {
        defer.reject(err);
      }, function () {

      });
      return deferred.promise;
    };

    /******************************************************************************************************************
     * returns all lists
     */
    function getAllLists() {
      var defer = $q.defer();
      var query = "SELECT * from list";
      var lists = [];
      global.db.transaction(function (tx) {

        tx.executeSql(query, [], function (tx, res) {
          console.log("localListHandlerV2.getAllLists  success " + JSON.stringify(res));
          for (var i = 0; i < res.rows.length; i++) {
            lists.push(res.rows.item(i));
          }
          defer.resolve(lists);
        }, function (err) {
          console.log("localListHandlerV2.getAllLists  error " + err.message);
          defer.reject(err);
        });
      }, function (err) {
        console.log("localListHandlerV2.getAllLists  error " + err.message);
        defer.reject();
      }, function () {
      });
      return defer.promise;
    };

    /******************************************************************************************************************
     * delete the list from the local db, the promise resolves with the list details, for further server communication
     * @param listLocalId
     */
    function deleteList(listLocalId) {
      var deferred = $q.defer();
      var query = "DELETE FROM list WHERE listLocalId = ?";

      global.db.transaction(function (tx) {

          var query = "select * from list where listLocalId = ?";
          tx.executeSql(query, [listLocalId], function (tx, res) {
              console.log("localListHandlerV2.deleteList  query res " + JSON.stringify(res));
              var deleteQuery = "delete from list where listLocalId = ?";
              var ret = {};
              ret.list = res.rows.item(0);
              tx.executeSql(deleteQuery, [listLocalId], function (tx, res) {
                console.log("localListHandlerV2.deleteList  deleteQuery res " + JSON.stringify(res));
                ret.rowsAffected = res.rowsAffected;
                defer.resolve(ret);
              }, function (err) {
                console.log("localListHandlerV2.deleteList  deleteQuery err " + err.message);
                defer.reject(err);
              });
            }, function (err) {
              defer.reject(err);
            }
          );
        }
        ,
        function (err) {
          defer.reject(err);
        }
        ,
        function () {

        }
      );
      return defer.promise;
    }

    return {
      getSpecificList: getSpecificList,
      create: addNewList,
      update: update,
      deleteList: deleteList,
      getAllLists: getAllLists,
      addNewList: addNewList,
      updateList: update,
      getSpecificList: getSpecificList
    };
  });


