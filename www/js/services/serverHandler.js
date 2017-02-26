angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2,$location,$state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2) {

    var defer = $q.defer();
    var lists = angular.fromJson(window.localStorage['lists'] || []);
    var serviceName = "serverHandler";
    var userServerId = "582c3f6d30126504007c6bdf";
    var deviceServerId = "582c3f6d30126504007c6be0";


    //------------------------consoleLog

    function consoleLog(text) {
      //return;
      console.log(serviceName + "  =>  " + text);
    }

    function saveToLocalStorage() {

      window.localStorage['lists'] = angular.toJson(lists);
    };

    return {
      list: function () {
        return lists;
      },
//------------------------getUserServerId
      //TODO moved to global
      getUserServerId: function () {
        return "123";
      },
//------------------------getListId
      //TODO moved to global
      getListId: function (listName) {
        for (var i = 0; i < lists.length; i++) {
          if (lists[i].listName === listName) {
            return lists[i];
          }
        }
        return undefined;
      },
//------------------------checkInvitedUser
      //TODO moved to global
      checkInvitedUser: function (contact) {
        data = {
          contact: contact
        };
        console.log("data = " + data);
        $http.post(global.serverIP + "/api/list/checkInvitedUser", data)

          .then(function (response) {
            console.log('serverListHandler' + response);
          });
      },
      //------------------------SynchInitTest
      // Osama Init Function Launched by The App Start
      SynchInitTest: function () {
        consoleLog("Start SynchInitTest");
        /*global.db.transaction(function (tx) {
         var query = "delete from userInfo";
         tx.executeSql(query);
         query = "delete from userSetting";
         tx.executeSql(query);
         }, function (error) {
         consoleLog("Error = " + JSON.stringify(error));
         }, function (res) {
         consoleLog("Response = " + JSON.stringify(res));
         });*/
        //serverHandlerCategoryV2.deleteCategories();
        /*       serverHandlerCategoryV2.deleteCategories().then(function () {
         serverHandlerCategoryV2.syncCategories().then(function () {
         serverHandlerItemsV2.deleteItemsLocal().then(function () {
         serverHandlerItemsV2.syncMasterItems();
         })
         });
         });*/
        serverHandlerListV2.syncListsDownstream().then(function (res) {
            console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
            console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
            console.log("$state.params = " + JSON.stringify($state.params));
            if ($location.url() == '/lists') {
              $state.reload();
            }
            serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
              if ($location.url().startsWith('/item')) {
                console.log('NOTIFICATION ENTRY RES ' + JSON.stringify(res));
                for (var i = 0; i < res.length; i++) {
                  console.log("$state.listId = " + $state.params.listId);
                  if (res[i].listLocalId == $state.params.listId) {
                    console.log('NOTIFICATION ENTRY LIST MATCH reloading');
                    $state.reload();
                  }
                }
              }
            }, function (err) {

            });
          }
          ,
          function () {
            console.log("SERVER HANDLER ERROR")
          }
        );


        serverHandlerCategoryV2.syncCategoriesDownstream().then(function () {
          serverHandlerItemsV2.syncMasterItemsDownstream();
        });
        serverHandlerListV2.syncListsUpstream().then(function () {
          console.log('serverHandler syncListsUpstream done');
          serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
            console.log('serverHandler syncLocalItemsUpstream done');
            serverHandlerEntryV2.syncEntriesUpstream();
          })
        });

        serverHandlerEntryV2.syncCrossingsDownstream().then(function(){
          console.log('syncCrossingsDownstream complete');
          serverHandlerEntryV2.syncCrossingsUptream();
        });
        /*
         var list = {
         listLocalId: 1485085399062,
         listName: 'testlist3',
         listDesc: 'testlist3',
         listColour: 'red',
         listOrder: 3
         };
         serverHandlerListV2.createList(list);

         */

        //serverHandlerMasterItem.synchMasterItem();


        // Temp Function to be removed later
        //serverHandlerTemp.tempDataMasterItem();
        //serverHandlerTemp.tempDataCategory();


        consoleLog("End SynchInitTest");
      },
//------------------------Synch
      SynchTable: function (tableName) {

        consoleLog("Start SynchTable");


        var query = "SELECT * from tsList WHERE listServerId is null";
        dbHandler.runQuery(query, [],
          function (res) {


            console.log("Statement Run: " + query[j]);


          }, function (err) {
            console.log(err);
          });


        consoleLog("End SynchTable");

      },
//------------------------createList
      createList: function (list) {

        consoleLog("Start createList");

        data = {
          listLocalId: list.listLocalId,
          listName: list.listName,
          listDesc: list.listDesc,
          listColour: list.listColour,
          listOrder: list.listOrder,
          userServerId: userServerId,
          deviceServerId: deviceServerId
        };

        consoleLog(" List to Be Created = " + JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/create", data)


          .then(function (response) {

            consoleLog(" createList Response Result => " + JSON.stringify(response));
            defer.resolve(response.data.listServerId);
            consoleLog(" createList Response Done");

          });

        return defer.promise;
      },
//------------------------updateList
      updateList: function (list) {

        consoleLog("Start updateList");


        data = {
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
            defer.resolve(response.data.listServerId);
            consoleLog(" updateList Response Done");

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

      inviteToList: function (listLocalId, invitedUserServerId) {

        consoleLog("Start inviteToList");

        listServerId = getListId(listLocalId);


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
          });

        return defer.promise;

      }

    };
  });


