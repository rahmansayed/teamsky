updateangular.module('starter.services')

  .factory('localListHandlerV2', function ($http, global, dbHandler, $q, serverHandlerListV2) {

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
            console.log("localListHandlerV2.update + res " + angular.toJson(res));
            defer.resolve(res);
          }, function (err) {
            console.log("localListHandlerV2.update + err " + query + ' ' + angular.toJson(err));
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
      console.log('aalatief - Entered List: ' + angular.toJson(list));
      var deferred = $q.defer();
      var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder,deleted,newCount, crossCount, lastUpdateDate, lastUpdateBy, origin, flag, listOwnerServerId) " +
        "VALUES (null,?,?,'','','','N',0,0,?,?,'L', 'N', ?)";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, new Date().getTime(), 'L', global.userServerId], function (tx, response) {
          //Success Callback
          console.log("localListHandlerV2.addNewList  res " + angular.toJson(response));
          list.listLocalId = response.insertId;
          serverHandlerListV2.maintainGlobalLists(list, "ADD");
          deferred.resolve(response.insertId);
        }, function (error) {
          console.error("localListHandlerV2.addNewList  error " + error.message);
          deferred.reject(error);
        });
      }, function (err) {
        console.error("localListHandlerV2.addNewList  error " + angular.toJson(error));
        defer.reject(err);
      }, function () {

      });
      return deferred.promise;
    };

    /******************************************************************************************************************
     * returns all lists
     */
    function getAllLists(listLocalId) {
      var defer = $q.defer();

      /*      var query = "select distinct l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount,c.photo from (list as l left join listUser as lu on l.listLocalId = lu.listLocalId) left join contact as c on c.contactLocalId = lu.contactLocalId";*/

      /*
       var query = "select l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactServerId,c.photo,c.contactStatus,l.newCount , l.listOwnerServerId, count(distinct eo.entryLocalId) as totalOpen, count(distinct ec.entryLocalId) as totalCrossed " +
       " from (((list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0 and ifnull(eo.deleted,'N') = 'N') " +
       " left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1 and ifnull(ec.deleted,'N') = 'N') " +
       " left join listUser as lu on l.listLocalId = lu.listLocalId) " +
       " left join contact as c on c.contactLocalId = lu.contactLocalId " +
       " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,c.contactName,c.contactStatus,l.newCount, l.listOwnerServerId";
       */

      var query = "select l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,l.newCount , l.listOwnerServerId, count(distinct eo.entryLocalId) as totalOpen, count(distinct ec.entryLocalId) as totalCrossed " +
        " from " +
        " ( " +
        "    (list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0 and eo.deleted = 0) " +
        /*commented by aalatief: to fix count issue 27/3/2018*/  
        /*"     left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1 and ec.deleted = 0 " +*/
          "     left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag != 0 and ec.deleted = 0 " +
        " ) " +
        " where ifnull(l.deleted, 'N') = 'N' ";
      if (listLocalId) {
        query += " and l.listLocalId = " + listLocalId;
      }
      query += " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,l.newCount, l.listOwnerServerId";


      global.db.transaction(function (tx) {
        serverHandlerListV2.lists.lists = [];
        tx.executeSql(query, [], function (tx, res) {
          console.log("localListHandlerV2.getAllLists  success " + angular.toJson(res.rows));
          for (var i = 0; i < res.rows.length; i++) {
            serverHandlerListV2.lists.lists.push(res.rows.item(i));
          }
          var getContactsQuery = "select c.* " +
            " from listUser as lu, contact as c " +
            " where c.contactLocalId = lu.contactLocalId " +
            " and ifnull(lu.deleted, 'N') = 'N' " +
            " and lu.listLocalId = ?";

          console.log("localListHandlerV2.getAllLists  lists " + angular.toJson(serverHandlerListV2.lists));
          serverHandlerListV2.lists.lists.forEach(function (list) {
            list.contacts = new Array();
            tx.executeSql(getContactsQuery, [list.listLocalId], function (tx, res2) {
              console.log("getAllLists list.item = " + angular.toJson(list));
              for (var j = 0; j < res2.rows.length; j++) {
                list.contacts.push(res2.rows.item(j));
              }
            }, function (err) {
              console.error("localListHandlerV2.getAllLists  contacts query error " + err.message);
              defer.reject(err);
            });
          });
          defer.resolve(serverHandlerListV2.lists);
        }, function (err) {
          console.error("localListHandlerV2.getAllLists  main query error " + err.message);
          defer.reject(err);
        });
      }, function (err) {
        console.error("localListHandlerV2.getAllLists  db error " + err.message);
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
              console.log("localListHandlerV2.deleteList  query res " + angular.toJson(res));
              var deleteQuery = "delete from list where listLocalId = ?";
              var ret = {};
              ret.list = res.rows.item(0);
              tx.executeSql(deleteQuery, [listLocalId], function (tx, res) {
                console.log("localListHandlerV2.deleteList  deleteQuery res " + angular.toJson(res));
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
    function deactivateList(list) {
      var deferred = $q.defer();
      var query = "update list set deleted = 'Y' where listLocalId = ?";

      global.db.transaction(function (tx) {

          var query = "select * from list where listLocalId = ?";
          tx.executeSql(query, [list.listLocalId], function (tx, res) {
              console.log("localListHandlerV2.deactivateList  query res " + angular.toJson(res));
              var deleteQuery = "update list set deleted = 'Y' where listLocalId = ?";
              var ret = {};
              ret.list = res.rows.item(0);
              tx.executeSql(deleteQuery, [list.listLocalId], function (tx, res) {
                console.log("localListHandlerV2.deactivateList  deleteQuery res " + angular.toJson(res));
                ret.rowsAffected = res.rowsAffected;
                serverHandlerListV2.deleteList(list);
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

    function kickContact(listLocalId, contactLocalId) {
      var defer = $q.defer();

      //calling the server first and delete record after successful server update
      global.db.transaction(function (tx) {
        var query = "update listUser set deleted = 'Y' where listLocalId = ? and contactLocalId = ?";
        tx.executeSql(query, [listLocalId, contactLocalId], function (tx, res) {
          console.log("kickContact db success");
          serverHandlerListV2.kickContact(listLocalId, contactLocalId).then(function () {
              var reflectServerStatusQuery = "listUser set deleted = 'S' where listLocalId = ? and contactLocalId = ?";
              tx.executeSql(reflectServerStatusQuery, [listLocalId, contactLocalId]);
            },
            function (err) {
              console.error("kickContact server error = " + err);
              defer.reject();
            });
        }, function (err) {
          console.error("kickContact db error = " + err.message);
          defer.reject();
        });
      }, function (err) {
      }, function () {
        defer.resolve();
      });
      return defer.promise;
    }

    return {
      update: update,
      deleteList: deleteList,
      getAllLists: getAllLists,
      addNewList: addNewList,
      updateList: update,
      deactivateList: deactivateList,
      kickContact: kickContact,
      lists: serverHandlerListV2.lists
    };
  });


