angular.module('starter.services.listHandler', [])

  .factory('listHandler', function ($http, global,serverListHandler) {

    var lists = angular.fromJson(window.localStorage['lists'] || []);

    function saveToLocalStorage() {

      window.localStorage['lists'] = angular.toJson(lists);
    };
    
    function update (list) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].id === list.id) {
            lists[i] = list;
            saveToLocalStorage();
            console.log('Update List Called!!'+JSON.stringify(list));
          }
        }
        serverListHandler.updateList(list);
        ;
        
    };

    return {
      list: function () {

        return lists;
      },

      get: function (listId) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].id === listId) {
            return lists[i];
          }
        }
        return undefined;
      },

      create: function (list) {
        lists.push(list);
        saveToLocalStorage();
        //ToDO : Check if Local Success then save to send to server:
        serverListHandler.createList(list.id,list.title,list.description,"RED","1").then(function(listServerId){
         
           
          list.serverListId =listServerId||"0";
        console.log('listServerId' + listServerId);        
        console.log('update server list id'+ JSON.stringify(list) );
            update(list);
       });
        //End To Do  
      },

      move: function (list, fromIndex, toIndex) {
        lists.splice(fromIndex, 1);
        lists.splice(toIndex, 0, list);
        saveToLocalStorage();
      },
      update: update,
        
      remove: function (listId) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].id === listId) {
            lists.splice(i, 1);
            saveToLocalStorage();
            return;
          }
        }
        ;

      },

      addUser: function (listServerId, invitedUserServerId) {
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


