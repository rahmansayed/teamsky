angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerListV2', function ($http, global, $q) {

      var serviceName = "serverHandlerListV2";

      //------------------------consoleLog

      function consoleLog(text) {
        //return;
        console.log(serviceName + "  =>  " + text);
      };

      /***********************************************************************************************************************
       * the function returns the userServerId of the contact number
       * @param contactNumbers array of all the contact numbers in international format
       * @param listServerId
       */
      function checkUser(contactNumbers, listServerId) {
        var defer = $q.defer();

        var data = {
          userServerId: global.userServerId,
          listServerId: listServerId,
          contact: contactNumbers
        };

        $http.post(global.serverIP + "/api/user/check", data)

          .then(function (response) {
              console.log('serverListHandler checkUser reponse' + JSON.stringify(response));
              defer.resolve(response.data.userServerId);
            },
            function (error) {
              console.log('serverListHandler checkUser error' + JSON.stringify(error));
              defer.reject(error);
            });

        return defer.promise;
      }

      /******************************************************************************************************************
       * this function creates the server record of the user, this function should be called after retrieving the
       * invitedUserServerId from check user
       * @param listLocalId
       * @param invitedUserServerId
       */
      function inviteToList(listServerId, invitedUserServerId) {

        var defer = $q.defer();
        consoleLog("Start inviteToList");

        data = {
          invitedUserServerId: invitedUserServerId,
          listServerId: listServerId,
          deviceServerId: deviceServerId
        };
        consoleLog(serviceName + " List to Be inviteToList => " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/invite", data)

          .then(function (response) {
            consoleLog(" inviteToList Response Result => " + response);
            defer.resolve(response.data.listServerId);
            consoleLog(" inviteToList Response Done");
          }, function (error) {
            defer.reject(error);
            console.log("serverHandlerListV2 " + " inviteToList " + " error " + JSON.stringify(error));
          });

        return defer.promise;

      }

      function invite(listServerId, contactNumbers) {
        var defer = $q.defer();

        checkUser(contactNumbers, listServerId).then(
          function (result) {
            console.log("ServerHandlerListV2 invite userServerId = " + result.userServerId);
            inviteToList(listServerId, result.userServerId);
          }, function (error) {
            console.log("ServerHandlerListV2 invite error " + JSON.stringify(error));
          }
        )
        return defer.promise;
      }

      /*************************************************************************************************************************
       * this function records the list in the server and updates the local record with the listServerId
       * @param list
       */

      function createList(list) {

        console.log("serverListHandler.createList list = " + JSON.stringify(list));
        var defer = $q.defer();

        data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId,
          listDetails: {
            listLocalId: list.listLocalId,
            listName: list.listName,
            listDesc: list.listDesc,
            listColour: list.listColour,
            listOrder: list.listOrder
          }
        };

        consoleLog(" List to Be Created = " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/create", data)
          .then(function (response) {
              console.log("serverListHandler.createList server response " + JSON.stringify(response));
              global.db.transaction(function (tx) {
                var query = "update list set listServerId = ? , flag = 'S' where listLocalId = ?";
                tx.executeSql(query, [response.data.listServerId, list.listLocalId], function (tx, result) {
                  console.log("serverListHandler.createList Rows affected = " + result.rowsAffected);
                  defer.resolve(response.data.listServerId);
                }, function (error) {
                  console.log("serverListHandler.createList db update error = " + JSON.stringify(error));
                  defer.reject(error);
                });
              });
            },
            function (error) {
              console.log("serverListHandler.createList error " + JSON.stringify(error));
              defer.reject(error);
            });

        return defer.promise;
      };

      /******************************************************************************************************************
       * this function is used to sync local lists with the server
       */
      function syncListsUpstream() {
        consoleLog("In syncLists");
        var defer = $q.defer();
        var promises = [];
        global.db.transaction(function (tx) {
          var query = "select * from list where listServerId = ''";
          tx.executeSql(query, [], function (tx, result) {
//            consoleLog("result = " + JSON.stringify(result));
// consoleLog("result.rows = " + JSON.stringify(result.rows));
//            consoleLog("result.rows.length = " + JSON.stringify(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              var list = result.rows.item(i);
              var listDetails =
                  {
                    listLocalId: list.listLocalId,
                    listName: list.listName,
                    listDesc: list.listDesc,
                    listColour: list.listColour,
                    listOrder: list.listOrder
                  }
                ;

              console.log("serverHandlerListV2.syncListsUpstream calling createlist for " + JSON.stringify(listDetails));
              promises.push(createList(listDetails));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (error) {
            consoleLog("error = " + JSON.stringify(error));
            defer.reject();
          });
        });
        return defer.promise;
      }

      /******************************************************************************************************************
       * this function is checks if the serverlist exist locally if not it inserts it
       * @param list
       */
      function upsertServerList(list) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
            var query = "select count(*) as cnt from list where listServerId = ?";

            tx.executeSql(query, [list.listServerId], function (tx, result) {
                if (result.rows.item(0).cnt == 0) {
                  console.log("serverHandlerListV2.upsertServer ListInserting list " + JSON.stringify(list));
                  var insertQuery = "insert into list(listLocalId,listName,listServerId, flag, origin) values (null,?,?, 'S', 'S')";
                  tx.executeSql(insertQuery, [list.listName, list.listServerId]);
                  defer.resolve({status: 'Y'});
                }
                else {
                  defer.resolve({status: 'N'});
                }
              }
              ,
              function (error) {
                console.log("serverHandlerListV2.upsertServer count query = " + JSON.stringify(error.message));
                defer.reject(error);
              }
            );
          }
          ,
          function (error) {
            console.log("serverHandlerListV2.upsertServer db error " + JSON.stringify(error.message));
            defer.reject(error);
          }
          ,
          function () {
          }
        )
        ;

        return defer.promise;
      }
      ;

      /******************************************************************************************************************
       * this function is used to retrieve lists from the server and record in the local tables
       */
      function syncListsDownstream() {

        var defer = $q.defer();
        var promises = [];
        var data = {
          userServerId: global.userServerId
        };

        console.log("Start syncListsDownstream data = " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/user", data)
          .then(function (response) {
            console.log("serverHandlerListV2.syncListsDownstream http Response Result =  " + JSON.stringify(response));
            // will check if the list already exist in the local table if not then create it
            for (var i = 0; i < response.data.length; i++) {
              var list = {
                listServerId: response.data[i]._id,
                listName: response.data[i].listname
              };

              promises.push(upsertServerList(list));
            }
            $q.all(promises).then(function (res) {
              var anyNew = false;
              for (var i = 0; i < res.length; i++) {
                console.log("syncListsDownstream $q Result " + i + " " + JSON.stringify(res[i].status));
                if (res[i].status == 'Y') {
                  anyNew = true;
                }
              }
              defer.resolve(anyNew);
            }, function (err) {
              console.log("syncListsDownstream $q error  = " + err.message);
              defer.reject(err);
            });
          }, function (error) {
            console.log("serverHandlerListV2 syncListsDownstream http error =  " + error.message);
            defer.reject(error);
          });

        return defer.promise;
      };

      /***********************************************************************************************************************
       *
       * @param list
       */

      function deleteList(list) {

        consoleLog("Start deleteList");

        data = {
          listServerId: list.listServerId,
          deviceServerId: deviceServerId
        };

        consoleLog(" List to Be Deleted => " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/deactivate", data)

          .then(function (response) {
            consoleLog(" deleteList Response Result => " + JSON.stringify(response));

            defer.resolve(response.data.listServerId);
            consoleLog(" deleteList Response Done");
          });

        return defer.promise;
      }

      /***********************************************************************************************************************
       *
       * @param list
       */
      function updateList(list) {
        var defer = $q.defer();
        consoleLog("Start updateList");
        data = {
          listLocalId: list.listLocalId,
          listServerId: list.listServerId,
          listName: list.listName,
          listDescription: list.listDescription,
          listColour: "Red",
          listOrder: "1"
        };
        consoleLog(" List to Be Updated => " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/update", data)
          .then(function (response) {
            consoleLog(" updateList Response Result => " + response);
            defer.resolve();
          }, function (err) {
            defer.reject();
          });
        return defer.promise;
      }

      return {
        createList: createList,
        syncListsUpstream: syncListsUpstream,
        syncListsDownstream: syncListsDownstream,
        updateList: updateList,
        deleteList: deleteList
      }
    }
  )
;


