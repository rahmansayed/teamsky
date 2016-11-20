angular.module('starter.services.serverListHandler', [])

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list



  .factory('serverListHandler', function ($http, global,$q) {

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
        var defer = $q.defer();

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
            defer.resolve(response.data.listServerId);

          });

        //TODO update local DB with ServerID
          
          return defer.promise;

      },
//------------------------updateList
      updateList: function (list) {

        listServerId=123;
        deviceServerId=123;

        data = {
          listServerId: list.serverListId,
          listName:list.title,
          listColour:"Red",
          listOrder:"1"
        };

        console.log("data = "+data);


        $http.post("http://" + global.serverIP + "/api/list/update" , data)

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

        $http.post("http://" + global.serverIP + "/api/list/delete" , data)

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

