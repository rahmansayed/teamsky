angular.module('starter.services.serverListHandler', [])

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list



  .factory('serverListHandler', function ($http, global) {

    var lists = angular.fromJson(window.localStorage['lists'] || []);

    var serviceName ="serverItemHandler=> ";

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

//------------------------createList
      createList: function (listLocalId,listName,listDescription,listColour,listOrder) {
        //userServerId=getUserServerId();

        console.log(serviceName + "Start createList");


        userServerId="582c3f6d30126504007c6bdf";
        deviceServerId="582c3f6d30126504007c6be0";

        data = {
          listLocalId:listLocalId,
          listName: listName,
          listColour:listColour,
          listOrder:listOrder,
          userServerId:userServerId,
          deviceServerId:deviceServerId
        };

        console.log(serviceName + "data = "+ JSON.stringify(data));

        $http.post("http://"+global.serverIP + "/api/list/create" , data)

          .then(function (response) {
            console.log(serviceName+" Response " + JSON.stringify(response));
          });

        //TODO update local DB with ServerID

      },
//------------------------updateList
      updateList: function (listLocalId,ListName,listColour,listOrder,listSynch) {

        listServerId=123;
        deviceServerId=123;

        data = {
          listServerId: listServerId,
          ListName:ListName,
          deviceServerId:deviceServerId,
          listColour:listColour,
          listOrder:listOrder,
          listSynch:listSynch
        };

        console.log("data = "+data);


        $http.post(global.serverIP + "/api/list/update" , data)

          .then(function (response) {
            console.log('serverListHandler' + response);
          });

      },
//------------------------deleteList
      deleteList: function (listLocalId) {
        listServerId=getListId(listLocalId);
        deviceServerId=123;

        data = {
          listServerId: listServerId,
          deviceServerId:deviceServerId
        };
        console.log("data = "+data);

        $http.post(global.serverIP + "/api/list/delete" , data)

          .then(function (response) {
            console.log('serverListHandler' + response);
          });

      },
//------------------------shareList

      shareList: function (listLocalId,invitedUserServerId) {

        listServerId=getListId(listLocalId);
        deviceServerId=123;
        data = {
          invitedUserServerId: invitedUserServerId,
          listServerId:listServerId,
          deviceServerId:deviceServerId
        };
        console.log("data = "+data);

        $http.post(global.serverIP + "/api/list/share" , data)

          .then(function (response) {
            console.log('serverListHandler ' + response);
          });
      }

    };
  });


