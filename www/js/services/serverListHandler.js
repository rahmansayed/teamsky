angular.module('starter.services.serverlistHandler', [])

//TODO Create List
// TODO Share List
//TODO Check User Exist
//TODO SYNCh List
//TODO List Colour


  .factory('serverlistHandler', function ($http, global) {

    var lists = angular.fromJson(window.localStorage['lists'] || []);

    function saveToLocalStorage() {

      window.localStorage['lists'] = angular.toJson(lists);
    };

    return {
      list: function () {

        return lists;
      },

//------------------------getListId
      getListId: function (listName) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].listName === listName) {
            return lists[i];
          }
        }
        return undefined;
      },
//------------------------checkInvitedUser

      checkInvitedUser: function (contact) {
        data = {
          contact: contact
         };
        console.log("data = "+data);
        $http.post('http://' + global.serverIP + "/api/list/checkInvitedUser" , data)

          .then(function (response) {
            console.log('listhandler.addUser ' + response);
          });
      },

//------------------------createList
      createList: function (listName,listLocalId) {
        data = {
          listName: listName,
          listLocalId:listLocalId,
          userServerId:"123"
        };

        console.log("data = "+data);
        $http.post('http://' + global.serverIP + "/api/list/create" , data)

          .then(function (response) {
            console.log('serverlistHandler' + response);
          });

        //TODO update local DB with ServerID

      },
//------------------------updateList
      updateList: function (listName,newListName) {

        listServerId=getListId(listName);
        data = {
          listServerId: listServerId,
          newListName:newListName};

        console.log("data = "+data);


        $http.post('http://' + global.serverIP + "/api/list/create" , data)

          .then(function (response) {
            console.log('serverlistHandler' + response);
          });

      },
//------------------------deleteList
      deleteList: function (listName) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].id === listId) {
            lists.splice(i, 1);
            saveToLocalStorage();
            return;
          }
        }
        ;
      },
//------------------------shareList

      shareList: function (listServerId, invitedUserServerId) {
        data = {
          invitedUserServerId: invitedUserServerId,
          listServerId:listServerId
        };
        console.log("data = "+data);
        $http.post('http://' + global.serverIP + "/api/list/invite" , data)

          .then(function (response) {
            console.log('listhandler.addUser ' + response);
          });
      }


    };
  });


