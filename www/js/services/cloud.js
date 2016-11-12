angular.module('starter.services.cloud', [])
  .factory('cloud', function ($http, global, $q) {

    var getServerReply = function (tableName, entry, insertId) {
        var data = {
          entry: entry,
          localId: insertId,
          userName: global.userName
        };

        var deferred = $q.defer();
        $http.post("http://" + global.serverIP + "/api/" + tableName, {data: data}).then(
          function (response) {
            console.log("success " + response.data);
            deferred.resolve(response.data);
          },
          function (error) {
            console.error(error);
            deferred.reject('response ' + error);
          });

        return deferred.promise;
      };

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
      },
      getServerReply: getServerReply
    };

  })
;
