angular.module('starter.services')

  .factory('localListHandlerV2', function ($http, global, dbHandler, $q, serverHandlerListV2) {

    /******************************************************************************************************************
     * returns the list identified by listLocalId
     * @param listLocalId
     */
    function getSpecificList(listLocalId) {
      var defer = $q.defer();
      var query = "select l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount , count(distinct eo.entryLocalId) as totalOpen, count(distinct ec.entryLocalId) as totalCrossed " +
        " from (((list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0) " +
        " left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1) " +
        " left join listUser as lu on l.listLocalId = lu.listLocalId) " +
        " left join contact as c on c.contactLocalId = lu.contactLocalId " +
        " where l.listLocalId = ? " +
        " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount";

      global.db.transaction(function (tx) {

        tx.executeSql(query, [listLocalId], function (tx, res) {
          console.log("localListHandlerV2.getList + res.rows.item(0) " + JSON.stringify(res.rows.item(0)));
          specificList = res.rows.item(0);
          defer.resolve(specificList);
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
     * updates a specific list with the new values
     * @param list
     */
    function update(list) {
      var defer = $q.defer();
      var query = "update list set " +
        " listName = ? " +
        ", listDescription = ? " +
        ", listColor = ? " +
        ", listOrder = ? " +
        ", lastUpdateBy = ? " +
        ", flag = 'E'" +
        " where listLocalId = ? ";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, list.listColor, list.listOrder, 'L', list.listLocalId],
          function (tx, res) {
            console.log("localListHandlerV2.update + res " + JSON.stringify(res));
            defer.resolve(res);
          }, function (err) {
            console.log("localListHandlerV2.update + err " + query + ' ' + JSON.stringify(err));
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
      var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder,deleted,lastUpdateDate, lastUpdateBy, origin, flag) " +
        "VALUES (null,?,?,?,?,?,?,?,?,'L', 'N')";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, '', '', '', '', new Date().getTime(), 'L'], function (tx, response) {
          //Success Callback
          console.log("localListHandlerV2.addNewList  res " + JSON.stringify(response));
          deferred.resolve(response.insertId);
        }, function (error) {
          console.log("localListHandlerV2.addNewList  error " + error.message);
          deferred.reject(error);
        });
      }, function (err) {
        console.log("localListHandlerV2.addNewList  error " + JSON.stringify(error));
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

      var query = "select distinct l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount,c.photo from (list as l left join listUser as lu on l.listLocalId = lu.listLocalId) left join contact as c on c.contactLocalId = lu.contactLocalId";
      var query = "select l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount , count(distinct eo.entryLocalId) as totalOpen, count(distinct ec.entryLocalId) as totalCrossed " +
        " from (((list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0) " +
        " left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1) " +
        " left join listUser as lu on l.listLocalId = lu.listLocalId) " +
        " left join contact as c on c.contactLocalId = lu.contactLocalId " +
        " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount";

      var lists = [];
      global.db.transaction(function (tx) {

        tx.executeSql(query, [], function (tx, res) {
          //console.log("localListHandlerV2.getAllLists  success " + JSON.stringify(res));
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
    //TODO change the delete logic to happen after server akncoweldgement
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
              deferred.reject(err);
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

    /******************************************************************************************************************
     * deactivate the list from the local db
     * @param listLocalId
     */
    function deactivateList(listLocalId) {
      var deferred = $q.defer();
      var query = "update list set deleted = 'Y' where listLocalId = ?";

      global.db.transaction(function (tx) {

          var query = "select * from list where listLocalId = ?";
          tx.executeSql(query, [listLocalId], function (tx, res) {
              console.log("localListHandlerV2.deactivateList  query res " + JSON.stringify(res));
              var deleteQuery = "update list set deleted = 'Y' where listLocalId = ?";
              var ret = {};
              ret.list = res.rows.item(0);
              tx.executeSql(deleteQuery, [listLocalId], function (tx, res) {
                console.log("localListHandlerV2.deactivateList  deleteQuery res " + JSON.stringify(res));
                ret.rowsAffected = res.rowsAffected;
                deferred.resolve(ret);
              }, function (err) {
                console.log("localListHandlerV2.deactivateList  deleteQuery err " + err.message);
                deferred.reject(err);
              });
            }, function (err) {
              deferred.reject(err);
            }
          );
        }
        ,
        function (err) {
          deferred.reject(err);
        }
        ,
        function () {

        }
      );
      return deferred.promise;
    }

    return {
      create: addNewList,
      update: update,
      deleteList: deleteList,
      getAllLists: getAllLists,
      addNewList: addNewList,
      updateList: update,
      getSpecificList: getSpecificList,
      deactivateList: deactivateList
    };
  });


