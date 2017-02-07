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

      consoleLog("Start createList");
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
            consoleLog(" createList Response Result => " + JSON.stringify(response));
            consoleLog(" createList Response Done");
            global.db.transaction(function (tx) {
              var query = "update list set listServerId = ? where listLocalId = ?";
              tx.executeSql(query, [response.data.listServerId, list.listLocalId], function (tx, result) {
                defer.resolve(response.data.listServerId);
                consoleLog('Rows affected = ' + result.rowsAffected)
              }, function (error) {
                defer.reject(error);
                consoleLog('error = ' + JSON.stringify(error));

              });
              consoleLog(" updateList Response Done");
            });
          },
          function (error) {
            consoleLog("createList error " + JSON.stringify(error));
            defer.reject(error);
          });

      return defer.promise;
    };


    return {
//------------------------createList
      createList: createList,
      // this function is used to synchronize all the un-sync'd lists
      syncListsUpstream: function () {
        consoleLog("In syncLists")
        var defer = $q.defer();
        var promises = []
        global.db.transaction(function (tx) {
          var query = "select * from list where listServerId = ''";
          tx.executeSql(query, [], function (tx, result) {
            consoleLog("result = " + JSON.stringify(result));
            consoleLog("result.rows = " + JSON.stringify(result.rows));
            consoleLog("result.rows.length = " + JSON.stringify(result.rows.length));
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

              consoleLog("calling createlist for " + listDetails);
              promises.push(createList(listDetails));
            }
            defer = $q.all(promises);
          }, function (error) {
            consoleLog("error = " + JSON.stringify(error));
          });
        });
        return defer;
      },
//------------------------updateList
      updateList: function (list) {

        consoleLog("Start updateList");


        data = {
          listLocalId: list.listLocalId,
          listName: list.listName,
          listDescription: list.listDescription,
          listColour: "Red",
          listOrder: "1"

        };

        consoleLog(" List to Be Updated => " + JSON.stringify(data));


        $http.post(global.serverIP + "/api/list/update", data)

          .then(function (response) {
            consoleLog(" updateList Response Result => " + response);

          });

        return defer.promise;


      },
//------------------------deleteList
      deleteList: function (list) {

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

      },
//------------------------shareList


    };
  });


