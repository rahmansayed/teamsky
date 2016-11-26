angular.module('starter.services')
  .factory('userMgmt', function ($http, $cordovaPreferences, global, $state) {
    return {
      subscribe: function (data) {
        var ret;
        //$scope.settings.mobile = '999';
        console.log("Mobile Number = " + data.userName);
        global.userName = data.userName;
        /*var data = {
         settings: $scope.settings,
         userName: $scope.settings.mobile,
         password: $scope.password,
         datakey: global.dataKey
         };*/
        $http.post(global.serverIP + "/api/user", data)
        /*$http.get("http://" + global.serverIP + "/cloud_test/registerUser.php?user_name=" + $scope.settings.mobile +
         "&password=" + $scope.password +
         "&datakey=" + global.dataKey)
         */
          .then(function (response) {
              ret = response.data;
              $cordovaPreferences.store('userName', data.userName)
                .success(function (value) {
                  alert("Store Success: " + value);
                  $state.go('verify');
                })
                .error(function (error) {
                  alert("Error: " + error);
                });
            }
            //LocalStorageModule.set('user_name', $scope.user_name);
            //settings.setSetting("user_name", $scope.user_name);
          );
        return ret;
      }
    }
  });
