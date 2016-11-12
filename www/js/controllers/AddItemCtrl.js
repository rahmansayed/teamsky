angular.module('starter.controllers.addItemCtrl', [])
  .controller('AddItemCtrl', function ($scope, global, $cordovaSQLite) {
    console.log("AddItemCtrl");
    $scope.addItem = function () {
      var query = "INSERT INTO list (list, item, qty, status) VALUES (?,?, ?,?)";

      $cordovaSQLite.execute(global.db, query, ["testing", $scope.item.desc, $scope.item.qty, "NEW"]).then(function (res) {
        console.log("INSERT ID -> " + res.insertId);
      }, function (err) {
        console.error(err);
      });
    }
  });
