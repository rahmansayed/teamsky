var services = angular.module('starter.services', []);
  .factory('local', function ($cordovaSQLite, global, cloud) {
    // Might use a resource here that returns a JSON array

    /* // Some fake testing data
     var chats = [{
     id: 0,
     name: 'Ben Sparrow',
     lastText: 'You on your way?',
     face: 'img/ben.png'
     }, {
     id: 1,
     name: 'Max Lynx',
     lastText: 'Hey, it\'s me',
     face: 'img/max.png'
     }, {
     id: 2,
     name: 'Adam Bradleyson',
     lastText: 'I should buy a boat',
     face: 'img/adam.jpg'
     }, {
     id: 3,
     name: 'Perry Governor',
     lastText: 'Look at my mukluks!',
     face: 'img/perry.png'
     }, {
     id: 4,
     name: 'Mike Harrington',
     lastText: 'This is wicked good ice cream.',
     face: 'img/mike.png'
     }];
     */


    return {
      all: function () {
        var records = [];
        // $scope.select = function () {
        var query = "SELECT item, qty ,id FROM list";
        $cordovaSQLite.execute(global.db, query).then(function (res) {
          if (res.rows.length > 0) {
            console.log("SELECTED -> " + res.rows.item(0).item + " " + res.rows.item(0).qty);
            for (var i = 0; i < res.rows.length; i++) {
              records.push(res.rows.item(i));
            }
          } else {
            console.log("No results found");
          }
        }, function (err) {
          console.error(err);
        });
        return records;
      },
      remove: function (id) {
        var query = "delete from list where id = ?";
        console.log("id = " + id);
        $cordovaSQLite.execute(global.db, query, [id]).then(function (res) {
          console.log("removeId: " + res.insertId);
        }, function (err) {
          console.error(err);
        });
      },
      addPlusSync: function (item, list) {
        var query = "INSERT INTO list (list, item, qty, status) VALUES (?,?, ?,?)";
        $cordovaSQLite.execute(global.db, query, [list, item.item, item.qty, "NEW"])
          .then(function (res) {
              console.log("Added: " + res.insertId);
              cloud.add(item, list, res.insertId);
            },
            function (err) {
              console.error(err);
            }
          );
      },

      addFromCloud: function (item, list, cloudID) {
        var query = "INSERT INTO list (list, item, qty, status) VALUES (?,?, ?,?)";
        $cordovaSQLite.execute(global.db, query, [list, item.item + ' FROM CLOUD', item.qty, "NEW"])
          .then(function (res) {
              console.log("Added FROM CLOUD: " + res.insertId);
              cloud.addBack(cloudID, res.insertId);
            },
            function (err) {
              console.error(err);
            }
          );
      },
      init: function () {
        global.db = $cordovaSQLite.openDB({name: 'my.db', location: 'default'});
        //$cordovaSQLite.execute(global.db, "DROP TABLE list");
        //$cordovaSQLite.execute(global.db, "DROP TABLE settings");
        $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS list (id integer primary key," +
          "list text," +
          "item text," +
          "qty integer," +
          "status integer)");
      }
    };
    /*,

     get: function (chatId) {
     for (var i = 0; i < chats.length; i++) {
     if (chats[i].id === parseInt(chatId)) {
     return chats[i];
     }
     }
     return null;
     }
     };*/
  })
angular.module('starter.services', [])
  .factory('cloud', function ($http, global) {
    // Might use a resource here that returns a JSON array

    /* // Some fake testing data
     var chats = [{
     id: 0,
     name: 'Ben Sparrow',
     lastText: 'You on your way?',
     face: 'img/ben.png'
     }, {
     id: 1,
     name: 'Max Lynx',
     lastText: 'Hey, it\'s me',
     face: 'img/max.png'
     }, {
     id: 2,
     name: 'Adam Bradleyson',
     lastText: 'I should buy a boat',
     face: 'img/adam.jpg'
     }, {
     id: 3,
     name: 'Perry Governor',
     lastText: 'Look at my mukluks!',
     face: 'img/perry.png'
     }, {
     id: 4,
     name: 'Mike Harrington',
     lastText: 'This is wicked good ice cream.',
     face: 'img/mike.png'
     }];
     */


    return {
      add: function (item, list, localID) {
        var data =
        {
          item: item,
          localID: localID,
          list: list,
          user: global.userName
        };

        $http.post("http://" + global.serverIP + "/cloud_test/item_add.php", {data: data}).then(
          function (response) {
            console.log("sucess " + response);
          },
          function (error) {
            console.error(error);
          }
        );
      },
      remove: function (id) {
        var query = "delete from list where id = ?";
        console.log("id = " + id);
        $cordovaSQLite.execute(global.db, query, [id]).then(function (res) {
          console.log("removeId: " + res.insertId);
        }, function (err) {
          console.error(err);
        });
      },
      addBack: function (cloudID, localID) {
        var data =
        {
          cloudID: cloudID,
          localID: localID,
          user: global.userName
        };

        $http.post("http://" + global.serverIP + "/cloud_test/add_back.php", {data: data}).then(
          function (response) {
            console.log("sucess " + response);
          },
          function (error) {
            console.error(error);
          }
        );
      }
    };
    /*,

     get: function (chatId) {
     for (var i = 0; i < chats.length; i++) {
     if (chats[i].id === parseInt(chatId)) {
     return chats[i];
     }
     }
     return null;
     }
     };*/
  })
angular.module('starter.services', [])
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    //var serverIP = '192.168.100.3';
    var userName;

    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName
    };
  });
