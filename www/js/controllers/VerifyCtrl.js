angular.module('starter.controllers.verifyCtrl', [])
  .controller('VerifyCtrl', function ($scope, global, $http, $state) {
    $scope.settings = {};

    $scope.verify = function () {
      var data = {
        userName: global.userName,
        vcode: $scope.settings.vCode
      };
      //$scope.settings.mobile = '999';
      $http.post(global.serverIP + "/api/user/" + global.userName, data)
        .then(function (response) {
          alert(response.data);
          //TODO go to lists only after succussfull verification
          $state.go('lists');
        });
    }
  });

