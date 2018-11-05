angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandlerListV2', function ($http, global, $q, contactHandler, $state) {


      var lists = {
        lists: []
      };

      function maintainGlobalLists(list, operation) {
        console.log('maintainGlobalLists entry = ' + angular.toJson(list));
        console.log('maintainGlobalLists operation = ' + operation);

        if ($state.current.name == "lists") {
          console.log('maintainGlobalLists global.lists = ' + angular.toJson(lists));
          var listIdx = -1;

          for (var i = 0; i < lists.lists.length; i++) {
            if (lists.lists[i].listLocalId == list.listLocalId) {
              listIdx = i;
              break;
            }
          }

          switch (operation) {
            case 'ADD':
              if (listIdx == -1) {
                lists.lists.push(list);
              }
              break;
            case 'DELETE':
              if (listIdx != -1) {
                lists.lists.splice(listIdx, 1);
              }
              break;
            case 'ADD ENTRY':
              if (listIdx > -1)
                lists.lists[listIdx].totalOpen = lists.lists[listIdx].totalOpen + 1;
              lists.lists[listIdx].newCount = lists.lists[listIdx].newCount + 1;
              break;
            case 'CROSS ENTRY':
              if (listIdx > -1) {
                lists.lists[listIdx].totalCrossed = lists.lists[listIdx].totalCrossed + 1;
                lists.lists[listIdx].totalOpen = lists.lists[listIdx].totalOpen - 1;
              }
              break;
            case 'UPDATE':
              if (listIdx != -1) {
                lists.lists[listIdx].listName = list.listName;
              }
              break;
            case 'UPDATE SERVERID':
              if (listIdx != -1) {
                lists.lists[listIdx].listServerId = list.listServerId;
              }
              break;
          }
          console.log('maintainGlobalLists AFTER lists = ' + angular.toJson(lists));
        }
      }

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
              console.log('serverListHandler checkUser reponse' + angular.toJson(response));
              defer.resolve(response.data.userServerId);
            },
            function (error) {
              console.error('serverListHandler checkUser error' + angular.toJson(error));
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
          deviceServerId: parseInt(global.deviceServerId),/*deviceServerId*/ //updated by aalatief ,
          userServerId:parseInt(global.userServerId)    //added by aalatief 1-11-2018 to know who invited the user
        };
        console.log("inviteToList  List to Be inviteToList => " + angular.toJson(data));

        $http.post(global.serverIP + "/api/list/invite", data)

          .then(function (response) {
            console.log(" inviteToList Response Result => " + response);
            defer.resolve(response.data.listServerId);
            consoleLog(" inviteToList Response Done");
          }, function (error) {
            defer.reject(error);
            console.error("serverHandlerListV2 " + " inviteToList " + " error " + angular.toJson(error));
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
            console.error("ServerHandlerListV2 invite error " + angular.toJson(error));
          }
        );
        return defer.promise;
      }

      /*************************************************************************************************************************
       * this function records the list in the server and updates the local record with the listServerId
       * @param list
       */

      function createList(list) {

        console.log("serverListHandler.createList list = " + angular.toJson(list));
        var defer = $q.defer();

        data = {
      userServerId: parseInt(global.userServerId),
          deviceServerId: parseInt(global.deviceServerId),
          listDetails: {
            listLocalId: list.listLocalId,
            listName: list.listName,
            listDesc: list.listDescription,
            listColour: list.listColour,
            listOrder: list.listOrder
          }
        };

        console.log("createList List to Be Created = " + angular.toJson(data));

        $http.post(global.serverIP + "/api/list/create", data)
          .then(function (response) {
              console.log("serverListHandler.createList server response " + angular.toJson(response));
              global.db.transaction(function (tx) {
                var query = "update list set listServerId = ? , flag = 'S' where listLocalId = ?";
                tx.executeSql(query, [response.data.listServerId, list.listLocalId], function (tx, result) {
                  console.log("serverListHandler.createList Rows affected = " + result.rowsAffected);
                  defer.resolve(response.data.listServerId);
                  list.listServerId = response.data.listServerId;
                  maintainGlobalLists(list, "UPDATE SERVERID");
                }, function (error) {
                  console.error("serverListHandler.createList db update error = " + angular.toJson(error));
                  defer.reject(error);
                });
              });
            },
            function (error) {
              console.error("serverListHandler.createList error " + angular.toJson(error));
              defer.reject(error);
            });

        return defer.promise;
      };

      /******************************************************************************************************************
       * this function is used to sync local lists with the server
       */
      function syncListsUpstream() {
        console.log("syncListsUpstream In syncLists");
        var defer = $q.defer();
        var promises = [];
        global.db.transaction(function (tx) {
          var query = "select * from list where listServerId = ''";
          tx.executeSql(query, [], function (tx, result) {
//            consoleLog("result = " + angular.toJson(result));
// consoleLog("result.rows = " + angular.toJson(result.rows));
//            consoleLog("result.rows.length = " + angular.toJson(result.rows.length));
            for (i = 0; i < result.rows.length; i++) {
              var list = result.rows.item(i);
              var listDetails =
                {
                  listLocalId: list.listLocalId,
                  listName: list.listName,
                  listDesc: list.listDescription,
                  listColour: list.listColour,
                  listOrder: list.listOrder
                }
              ;

              console.log("serverHandlerListV2.syncListsUpstream calling createlist for " + angular.toJson(listDetails));
              promises.push(createList(listDetails));
            }
            $q.all(promises).then(function () {
              defer.resolve();
            }, function () {
              defer.reject();
            });
          }, function (error) {
            console.error("error = " + angular.toJson(error));
            defer.reject();
          });
        });
        return defer.promise;
      }


      function upsertContacts(contactList, listLocalId) {
        var defer = $q.defer();
        var promises = contactList.map(function (contact) {
          return contactHandler.upsertContact(contact);
        });

        $q.all(promises).then(function (res) {
          console.log("upsertContacts resolved res = " + res);
          global.db.transaction(function (tx) {
            var query = 'insert or ignore into listUser (listLocalId, contactLocalId) values (?,?)';
            res.forEach(function (contact) {
              tx.executeSql(query, [listLocalId, contact.contactLocalId]);
            });
          }, function (err) {

          }, function () {

          });
          defer.resolve(res);
        }, function () {
          console.log("upsertContacts error");
          defer.reject();
        });

        return defer.promise;
      }

      function upsertProspects(prospectList, listLocalId) {
        upsertContacts(prospectList, listLocalId);
      }

      function upsertRelatedUsers(relatedUsers, listLocalId) {
        var contactList = relatedUsers.map(function (relatedUser) {
          return {
            name: relatedUser.name,
            numbers: [relatedUser.username],
            contactServerId: relatedUser.userid
          };
        });

        upsertContacts(contactList, listLocalId);
      }

      /******************************************************************************************************************
       * this function is checks if the serverlist exist locally if not it inserts it
       * @param list
       */
      function upsertServerList(list) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
            var query = "select listLocalId, ifnull(deleted, 'N') deleted from list where listServerId = ?";
            // check if list exists
            var listLocalId;
            console.log("aalatief upsertServerList: List : " + list);
            tx.executeSql(query, [list.list._id], function (tx, result) {
                var myList = {
                  listName: list.list.listname,
                  listServerId: list.list._id,
                  listOwnerServerId: list.ownerServerId
                };
                if (result.rows.length == 0) {
                  console.log("serverHandlerListV2.upsertServer ListInserting list " + angular.toJson(list));
                  var insertQuery = "insert into list(listLocalId,listName,listServerId, flag, origin, listOwnerServerId, newCount, crossCount) values (null,?,?, 'S', 'S', ?, 0, 0)";
                  tx.executeSql(insertQuery, [list.list.listname, list.list._id, list.ownerServerId], function (tx, res) {
                    myList.listLocalId = res.insertId;
                    maintainGlobalLists(myList, "ADD");
                    upsertProspects(list.list.prospectusers, res.insertId);
                    upsertRelatedUsers(list.list.relatedusers, res.insertId);
                    defer.resolve({
                      status: 'Y',
                      list: myList
                    });
                  });
                }
                else {
                  myList.listLocalId = result.rows.item(0).listLocalId;
                  if (result.rows.item(0).deleted == 'Y') {
                    var activateQuery = "update list set deleted = 'N' where listLocalId = ?";
                    maintainGlobalLists(myList, "ADD");
                    tx.executeSql(activateQuery, [result.rows.item(0).listLocalId], function (tx, res) {
                      defer.resolve({status: 'Y'});
                    });
                  } else {
                    defer.resolve({
                      status: 'N',
                      list: myList
                    });
                  }
                  upsertProspects(list.list.prospectusers, result.rows.item(0).listLocalId);
                  upsertRelatedUsers(list.list.relatedusers, result.rows.item(0).listLocalId);
                }
              }
              ,
              function (error) {
                console.error("serverHandlerListV2.upsertServer count query = " + angular.toJson(error.message));
                defer.reject(error);
              }
            );
          }
          ,
          function (error) {
            console.error("serverHandlerListV2.upsertServer db error " + angular.toJson(error.message));
            defer.reject(error);
          }
          ,
          function () {
          }
        )
        ;

        return defer.promise;
      }

      /******************************************************************************************************************
       * this function is checks if the serverlist exist locally if not it inserts it
       * @param list
       */
      function deactivateServerList(listServerId) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
            // determine if the list needs update
            var query = "select listLocalId from list where listServerId = ? and ifnull(deleted,'N') = 'N'";
            tx.executeSql(query, [listServerId], function (tx, res) {
                if (res.rows.length > 0) {
                  var updateQuery = "update list set deleted = 'Y' where listServerId = ?";
                  tx.executeSql(updateQuery, [listServerId]);
                  defer.resolve({status: 'Y'})
                }
                else {
                  defer.resolve({status: 'N'})
                }
              },
              function (error) {
                console.error("serverHandlerListV2.deactivateServerList db error " + angular.toJson(error.message));
                defer.reject(error);
              });
          }
          ,
          function (error) {
            console.error("serverHandlerListV2.deactivateServerList db error " + angular.toJson(error.message));
            defer.reject(error);
          },
          function () {
            console.log("serverHandlerListV2.deactivateServerList db OK ");
            defer.resolve();
          }
        );

        return defer.promise;
      }

      /******************************************************************************************************************
       * this function is used to retrieve lists from the server and record in the local tables
       */
      function syncListsDownstream() {

        var defer = $q.defer();
        var upsertPromises = [];
        var deactivatePromises = [];
        var data = {
          userServerId: parseInt(global.userServerId)
        };

        console.log("Start syncListsDownstream data = " + angular.toJson(data));

        $http.post(global.serverIP + "/api/list/user", data)
      .then(function (response) {
            console.log("serverHandlerListV2.syncListsDownstream http Response Result =  " + angular.toJson(response));
            // will check if the list already exist in the local table if not then create it
            for (var i = 0; i < response.data.length; i++) {
              if (response.data[i].ownerServerId == global.userServerId) {
                if (response.data[i].list.status == 'Active') {
                  upsertPromises.push(upsertServerList(response.data[i]));
                }
                else {
                  //TODO create deactivate function
                  deactivatePromises.push(deactivateServerList(response.data[i].list._id));
                }
              } else {
                // determing my user index
                for (var j = 0; j < response.data[i].list.relatedusers.length; j++) {
                  if (response.data[i].list.relatedusers[j].userid == global.userServerId) {
                    if (response.data[i].list.relatedusers[j].status == 'Active' && response.data[i].list.status == 'Active') {
                      upsertPromises.push(upsertServerList(response.data[i]));
                    }
                    else {
                      //
                      deactivatePromises.push(deactivateServerList(response.data[i].list._id));
                      console.log('serverHandlerListV2 deactivated list found  = ' + JSON.stringify(response.data[i].list._id));
                    }
                    break;
          }
                }
              }
            }
            $q.all(upsertPromises).then(function (res) {
              var anyNew = false;
              for (var i = 0; i < res.length; i++) {
                console.log("syncListsDownstream $q Result " + i + " " + angular.toJson(res[i].status));
                if (res[i].status == 'Y') {
                  anyNew = true;
                  break;
                }
              }
              defer.resolve(anyNew);
            }, function (err) {
              console.error("syncListsDownstream $q error  = " + err.message);
              defer.reject(err);
            });
          }, function (error) {
            console.error("serverHandlerListV2 syncListsDownstream http error =  " + JSON.stringify(error));
            defer.reject(error);
          });

        return defer.promise;
      };

      /***********************************************************************************************************************
       *
       * @param list
       */

      function deleteList(list) {

        var defer = $q.defer();
        console.log("Start deleteList");

        data = {
          listServerId: list.listServerId,
          deviceServerId: parseInt(global.deviceServerId),
          userServerId:parseInt(global.userServerId)    
        };

        console.log("deleteList List to Be Deleted => " + angular.toJson(data));

        $http.post(global.serverIP + "/api/list/deactivate", data)

          .then(function (response) {
            console.log(" deleteList Response Result => " + angular.toJson(response));

            defer.resolve(response.data.listServerId);
            console.log(" deleteList Response Done");
          }, function (err) {
            console.error('deleteList error ' + err.message);
            defer.reject();
          });

        return defer.promise;
      }

      /***********************************************************************************************************************
       *
       * @param list
       */
      function updateList(list) {
        var defer = $q.defer();
        console.log("Start updateList");
        data = {
          listLocalId: list.listLocalId,
          listServerId: list.listServerId,
          listName: list.listName,
          listDesc: list.listDescription,
          listColour: "Red",
          listOrder: "1",
          userServerId: parseInt(global.userServerId)
        };
        console.log(" List to Be Updated => " + angular.toJson(data));

        $http.post(global.serverIP + "/api/list/update", data)
          .then(function (response) {
            console.log(" updateList Response Result => " + response);
            defer.resolve();
          }, function (err) {
            defer.reject();
          });
        return defer.promise;
      }

      function kickContact(listLocalId, contactLocalId) {

        var defer = $q.defer();
        // retrieving the serverIds for the list and contact
        // if the contact does not have a serverId, then send the phone numbers for the prospect
        global.db.transaction(function (tx) {
          var query = "select list.ListServerId, contact.contactServerId, phoneNumber, contactStatus" +
            " from list, contact" +
            " where list.listLocalId = ? " +
            " and contact.contactLocalId = ?";

          tx.executeSql(query, [listLocalId, contactLocalId], function (tx, res) {
            var data = {
              listServerId: res.rows.item(0).listServerId,
              invitedUserServerId: res.rows.item(0).contactServerId,
              contactStatus: res.rows.item(0).contactStatus,
              phoneNumber: res.rows.item(0).phoneNumber,
              userServerId: parseInt(global.userServerId),
              deviceServerId: parseInt(global.deviceServerId)
            };

            $http.post(global.serverIP + "/api/list/kickContact", data).then(function (res) {
              defer.resolve(res);
            }, function (err) {
              console.error('kickContact server error = ' + angular.toJson(err));
              defer.reject();
            });
          }, function (err) {
            console.error('kickContact db query error = ' + angular.toJson(err));
            defer.reject();
          });
        }, function (err) {
          console.error('kickContact db error = ' + angular.toJson(err));
          defer.reject();
        }, function () {

        });

        return defer.promise;
      }

      return {
        createList: createList,
        syncListsUpstream: syncListsUpstream,
        syncListsDownstream: syncListsDownstream,
        updateList: updateList,
        deleteList: deleteList,
        upsertServerList: upsertServerList,
        deactivateServerList: deactivateServerList,
        kickContact: kickContact,
        maintainGlobalLists: maintainGlobalLists,
        lists: lists
      }
    }
  )
;


