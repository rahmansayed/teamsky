angular.module('starter.controllers')
  .controller('verifyCtrl', function ($scope, global, $http, $state) {
    $scope.settings = {};
    
    $scope.verify = function (vCode) {
      var data = {
        userServerId:'58553bb81e546ea068a1bb73' ,
        deviceServerId:'58553bb81e546ea068a1bb74',  
        vCode: vCode
      };
        console.log('date: '+JSON.stringify(data));
      //$scope.settings.mobile = '999';
      $http.post(global.serverIP+ "/api/user/activate" , data)
        .then(function (response) {
          alert(response.data);
          //TODO go to lists only after succussfull verification
          $state.go('lists');
        });
    }
  });

