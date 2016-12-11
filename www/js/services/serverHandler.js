angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list



  .factory('serverHandler', function ($http, global,$q,dbHandler,serverHandlerMaster,serverHandlerTemp) {

    var defer = $q.defer();
    var lists = angular.fromJson(window.localStorage['lists'] || []);
    var serviceName ="serverHandler";
    var userServerId="582c3f6d30126504007c6bdf";
    var deviceServerId="582c3f6d30126504007c6be0";



    //------------------------consoleLog

    function consoleLog(text){
    //return;
     console.log(serviceName+"  =>  "+text);
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
        console.log("data = "+data);
        $http.post(global.serverIP + "/api/list/checkInvitedUser" , data)

          .then(function (response) {
            console.log('serverListHandler' + response);
          });
      },
      //------------------------SynchInitTest
      // Osama Init Function Launched by The App Start
      SynchInitTest:function () {
        consoleLog( "Start SynchInitTest");


        serverHandlerMaster.synchCategory();
        //serverHandlerMaster.synchMasterItem();



        // Temp Function to be removed later
        //serverHandlerTemp.tempDataMasterItem();
        //serverHandlerTemp.tempDataCategory();


        consoleLog( "End SynchInitTest");
         },
//------------------------Synch
      SynchTable:function (tableName) {

        consoleLog( "Start SynchTable");


        var query = "SELECT * from tsList WHERE listServerId is null";
        dbHandler.runQuery(query,[],
          function(res) {


            console.log("Statement Run: " + query[j]);


          }, function (err) {
            console.log(err);
          });





        consoleLog( "End SynchTable");

      },
//------------------------createList
      createList: function (list) {

        consoleLog( "Start createList");

        data = {
          listLocalId:list.listLocalId,
          listName: list.listName,
          listDesc:list.listDesc,
          listColour:list.listColour,
          listOrder:list.listOrder,
          userServerId:userServerId,
          deviceServerId:deviceServerId
        };

        consoleLog( " List to Be Created = "+ JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/create" , data)



          .then(function (response) {

            consoleLog(" createList Response Result => " + JSON.stringify(response));
            defer.resolve(response.data.listServerId);
            consoleLog(" createList Response Done" );

          });

          return defer.promise;
      },
//------------------------updateList
      updateList: function (list) {

        consoleLog("Start updateList");


        data = {
          listServerId: list.listServerId,
          listName:list.listName,
          listDescription:list.listDescription,
          listColour:"Red",
          listOrder:"1"

        };

        consoleLog(" List to Be Updated => "+ JSON.stringify(data));


        $http.post( global.serverIP + "/api/list/update" , data)

          .then(function (response) {
            consoleLog( " updateList Response Result => "+ response);
            defer.resolve(response.data.listServerId);
            consoleLog(" updateList Response Done" );

          });

        return defer.promise;


      },
//------------------------deleteList
      deleteList: function (list) {

        consoleLog("Start deleteList");

        data = {
          listServerId:list.listServerId,
          deviceServerId:deviceServerId
        };

        consoleLog( " List to Be Deleted => "+ JSON.stringify(data));

        $http.post( global.serverIP + "/api/list/deactivate" , data)

          .then(function (response) {
            consoleLog( " deleteList Response Result => "+ JSON.stringify(response));
            defer.resolve(response.data.listServerId);
            consoleLog(" deleteList Response Done" );
         });

        return defer.promise;

      },
//------------------------shareList

      inviteToList: function (listLocalId,invitedUserServerId) {

        consoleLog( "Start inviteToList");

        listServerId=getListId(listLocalId);


        data = {
          invitedUserServerId: invitedUserServerId,
          listServerId:listServerId,
          deviceServerId:deviceServerId
        };
        consoleLog(serviceName+ " List to Be inviteToList => "+ JSON.stringify(data));

        $http.post(global.serverIP + "/api/list/invite" , data)

          .then(function (response) {
            consoleLog(" inviteToList Response Result => "+ response);
            defer.resolve(response.data.listServerId);
            consoleLog(" inviteToList Response Done" );
          });

        return defer.promise;

      }

    };
  });

