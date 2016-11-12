angular.module('starter.services.local', [])
  .factory('local', function ($cordovaSQLite, global, cloud) {

    var dropAllTables = function () {
      $cordovaSQLite.execute(global.db, "DROP TABLE items");
      $cordovaSQLite.execute(global.db, "DROP TABLE list");
      $cordovaSQLite.execute(global.db, "DROP TABLE lists");
      $cordovaSQLite.execute(global.db, "DROP TABLE list_users");
      $cordovaSQLite.execute(global.db, "DROP TABLE item_uoms");
      $cordovaSQLite.execute(global.db, "DROP TABLE list_entries");
    };

    var init = function () {
      global.db = $cordovaSQLite.openDB({name: 'my.db', location: 'default'});
      //$cordovaSQLite.execute(global.db, "DROP TABLE list");
      //$cordovaSQLite.execute(global.db, "DROP TABLE settings");

      /*        $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS uoms (" +
       "id integer primary key," +
       "name text," +
       "server_id integer)");
       */
      dropAllTables();
      $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS items (" +
        "id integer primary key," +
        "name text," +
        "server_id integer)");

      $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS lists (" +
        "id integer primary key," +
        "name text," +
        "server_id integer)");

      $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS list_users (" +
        "id integer primary key," +
        "list_id text," +
        "contact_id number," +
        "user_number text," +
        "server_status text," +
        "server_id integer)");

      $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS item_uoms (" +
        "id integer primary key," +
        "item_id integer," +
        "uom text," +
        "server_id integer)");

      $cordovaSQLite.execute(global.db, "CREATE TABLE IF NOT EXISTS list_entries (" +
        "id integer primary key," +
        "list_id integer," +
        "item_id integer," +
        "uom text," +
        "qty integer," +
        "notes text," +
        "server_id integer)");
    };
    /******************************************************************************************************************/
    var setServerReply = function (tableName, localId, serverReply) {
      var query;

      if (serverReply.hasOwnProperty('server_status')) {
        query = "update " + tableName + " set server_id = " + serverReply.server_id +
          ", server_status = " + serverReply.server_status +
          " where id = ?";
      }
      else {
        query = "update " + tableName + " set server_id = " + serverReply.server_id +
          " where id = ?";
      }
      $cordovaSQLite.execute(global.db, query, [localId])
        .then(function (res) {
          console.log('serverId set SUCCESS');
        }, function (err) {
          console.log('serverId set FAILED');
        });
    };
    /******************************************************************************************************************/
    var addMasterData = function (tableName, object) {
      var query = "INSERT INTO " + tableName + " (name) VALUES (?)";
      $cordovaSQLite.execute(global.db, query, [object.name])
        .then(function (res) {
            console.log("Added: " + res.insertId);
            cloud.getServerReply(tableName, object, res.insertId).then(function (serverReply) {
              setServerID(tableName, res.insertId, serverReply.serverId);
            }, function (err) {
              console.log("ERROR: " + err);
            });
          },
          function (err) {
            console.error(err);
          }
        );
    };
    /******************************************************************************************************************/
    var addListUser = function (object) {
      var queries = [];
      for (i = 0; i < object.user_number.length; i++) {
        queries[i] = ["INSERT INTO list_users (list_id ,contact_id, user_number ) VALUES (?, ?)",
          [object.list_id, object.contact_id, object.user_number[i]]];
      }

      $cordovaSQLite.execute(global.db, queries)
        .then(function (res) {
            console.log("Added: " + res.insertId);
            cloud.getServerReply('list_users', object, res.insertId).then(function (serverReply) {
              setServerReply(list_users, res.insertId, serverReply);
            }, function (err) {
              console.log("ERROR: " + err);
            });
          },
          function (err) {
            console.error(err);
          }
        );
    };

    return {

      addMasterData: addMasterData,

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
        var query = "delete from list_items where id = ?";
        console.log("id = " + id);
        $cordovaSQLite.execute(global.db, query, [id]).then(function (res) {
          console.log("removeId: " + res.insertId);
        }, function (err) {
          console.error(err);
        });
      },
      addPlusSync: function (listEntry) {
        var query = "INSERT INTO list_items (list_id, item_id, uom_id, qty) VALUES (?,?, ?,?)";
        $cordovaSQLite.execute(global.db, query, [listEntry.listId, listEntry.itemId, listEntry.uomId, listEntry.qty, "NEW"])
          .then(function (res) {
              console.log("Added: " + res.insertId);
              cloud.add(item, list, res.insertId);
            },
            function (err) {
              console.error(err);
            }
          );
      },

      addFromCloud: function (listEntry, serverId) {
        var query = "INSERT INTO list_items (list_id, item_id, uom_id, qty, server_id) VALUES (?,?, ?,?, ?)";
        $cordovaSQLite.execute(global.db, query, [listEntry.listId, listEntry.itemId, listEntry.uomId, listEntry.qty, serverId])
          .then(function (res) {
              console.log("Added FROM CLOUD: " + res.insertId);
              cloud.addBack(cloudID, res.insertId);
            },
            function (err) {
              console.error(err);
            }
          );
      },
      init: init
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
  });
