angular.module('starter.services')

  .factory('localListHandlerV2', function ($http, global, dbHandler, $q, serverHandlerListV2) {

    /******************************************************************************************************************
     * returns the list identified by listLocalId
     * @param listLocalId
     */

    function getSpecificList(listLocalId) {
      var defer = $q.defer();
      /* var specificList = [];*/
      var query = "select l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,l.newCount , l.listOwnerServerId, count(distinct eo.entryLocalId) as totalOpen, count(distinct ec.entryLocalId) as totalCrossed " +
        " from " +
        " ( " +
        "    (list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0 and ifnull(eo.deleted,'N') = 'N') " +
        "     left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1 and ifnull(ec.deleted,'N') = 'N' " +
        " ) " +
        " where l.listLocalId = ? " +
        " and ifnull(l.deleted, 'N') = 'N' " +
        " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,l.newCount, l.listOwnerServerId";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [listLocalId], function (tx, res) {
          console.log("localListHandlerV2.getSpecificList  success " + JSON.stringify(res.rows));

          var getContactsQuery = "select c.contactName,c.contactServerId,c.photo,c.contactStatus " +
            " from listUser as lu, contact as c " +
            " where c.contactLocalId = lu.contactLocalId " +
            " and lu.listLocalId = ?";
          var list = res.rows.item(0);

          list.contacts = new Array();
          tx.executeSql(getContactsQuery, [list.listLocalId], function (tx, res2) {
            console.log("getSpecificList list.item = " + JSON.stringify(list));
            for (var j = 0; j < res2.rows.length; j++) {
              list.contacts.push(res2.rows.item(j));
            }
            defer.resolve(list);
          }, function (err) {
            console.error("localListHandlerV2.getSpecificList  contacts query error " + err.message);
            defer.reject(err);
          });
        }, function (err) {
          console.error("localListHandlerV2.getSpecificList  main query error " + err.message);
          defer.reject(err);
        });
      }, function (err) {
        console.error("localListHandlerV2.getSpecificList  db error " + err.message);
        defer.reject();
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
      var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder,deleted,newCount, crossCount, lastUpdateDate, lastUpdateBy, origin, flag, listOwnerServerId) " +
        "VALUES (null,?,?,'','','','N',0,0,?,?,'L', 'N', ?)";

      global.db.transaction(function (tx) {
        tx.executeSql(query, [list.listName, list.listDescription, new Date().getTime(), 'L', global.userServerId], function (tx, response) {
          //Success Callback
          console.log("localListHandlerV2.addNewList  res " + JSON.stringify(response));
          list.listLocalId = response.insertId;
          serverHandlerListV2.maintainGlobalLists(list, "ADD");
          deferred.resolve(response.insertId);
        }, function (error) {
          console.error("localListHandlerV2.addNewList  error " + error.message);
          deferred.reject(error);
        });
      }, function (err) {
        console.error("localListHandlerV2.addNewList  error " + JSON.stringify(error));
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
        "    (list as l left join entry as eo on  eo.listLocalId = l.listLocalId and eo.entryCrossedFlag = 0 and ifnull(eo.deleted,'N') = 'N') " +
        "     left join entry as ec on ec.listLocalId = l.listLocalId and ec.entryCrossedFlag = 1 and ifnull(ec.deleted,'N') = 'N' " +
        " ) " +
        " where ifnull(l.deleted, 'N') = 'N' " +
        " group by l.listLocalId,l.listName,l.listDescription,l.listServerId,l.deleted,l.newCount, l.listOwnerServerId";


      global.db.transaction(function (tx) {
        serverHandlerListV2.lists.lists = [];
        tx.executeSql(query, [], function (tx, res) {
          console.log("localListHandlerV2.getAllLists  success " + JSON.stringify(res.rows));
          for (var i = 0; i < res.rows.length; i++) {
            serverHandlerListV2.lists.lists.push(res.rows.item(i));
          }
          var getContactsQuery = "select c.contactName,c.contactServerId,c.photo,c.contactStatus " +
            " from listUser as lu, contact as c " +
            " where c.contactLocalId = lu.contactLocalId " +
            " and lu.listLocalId = ?";

          console.log("localListHandlerV2.getAllLists  lists " + JSON.stringify(serverHandlerListV2.lists));
          serverHandlerListV2.lists.lists.forEach(function (list) {
            list.contacts = new Array();
            tx.executeSql(getContactsQuery, [list.listLocalId], function (tx, res2) {
              console.log("getAllLists list.item = " + JSON.stringify(list));
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

    function kickContact(listServerId, contactServerId) {
      var defer = $q.defer();

      //calling the server first and delete record after successful server update
      serverHandlerListV2.kickContact().then(function () {
        global.db.transaction(function (tx) {
          var query = "delete from listUser " +
            " where exists " +
            " (select * " +
            " from contact, list " +
            " where list.listServerId = ? " +
            " and contact.contactServerId = ? " +
            " and listUser.listLocalId = list.listLocalId " +
            " and listUser.contactLocalId = contact.contactLocalId " +
            " )";
          tx.executeSql(query, [listServerId, contactServerId]);
        }, function (err) {
          console.error("kickContact db error = " + err.message);
          defer.reject();
        }, function () {
          console.log("kickContact db success");
          defer.resolve();
        });
      }, function (err) {
        console.error("kickContact server error = " + err);
        defer.reject();
      });
      return defer;
    }

    return {
      update: update,
      deleteList: deleteList,
      getAllLists: getAllLists,
      addNewList: addNewList,
      updateList: update,
      getSpecificList: getSpecificList,
      deactivateList: deactivateList,
      kickContact: kickContact,
      lists: serverHandlerListV2.lists
    };
  });


