angular.module('starter.services.listHandler', [])

  .factory('listHandler', function ($http, global) {

    var lists = angular.fromJson(window.localStorage['lists'] || []);

    function saveToLocalStorage() {

      window.localStorage['lists'] = angular.toJson(lists);
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
      },

      move: function (list, fromIndex, toIndex) {
        lists.splice(fromIndex, 1);
        lists.splice(toIndex, 0, list);
        saveToLocalStorage();
      },
      update: function (list) {

        for (var i = 0; i < lists.length; i++) {

          if (lists[i].id === list.id) {
            lists[i] = list;
            saveToLocalStorage();
            return;
          }
        }
        ;
      },
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

      addUser: function (listId, contact) {
        data = {
          shareWith: contact
        };

        $http.post('http://' + global.serverIP + "/api/user/" + global.userName + '/' + listId, data)

          .then(function (response) {
            console.log('listhandler.addUser ' + response);
          });
      }

    };
  });


