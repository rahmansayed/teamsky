angular.module('starter.controllers')
  .controller('langCtrl', function ($scope, $state, $q, camera, $translate, $ionicPopup, settings, $timeout, $http, global, $filter, $ionicHistory, $ionicSideMenuDelegate, $ionicGesture) {
    
     $scope.userData = {};  
    
    
      $scope.saveUserSetting = function () {
      console.log("updateProfile userData = " + JSON.stringify($scope.userData));
      var data = {};
      var promises = [];
      for (var attribute in $scope.userData) {
        if ($scope.userData[attribute]) {
          console.log("updateProfile userData['" + attribute + "'] = " + JSON.stringify($scope.userData[attribute]));
          switch (attribute) {
            case  'country' :
              promises.push(settings.addUserSetting(attribute, $scope.userData[attribute].code));
              data.currentLocation = $scope.userData[attribute].code;
              break;
            case 'selected':
              var dob = new Date($scope.userData.selected.selectedYear,
                $scope.userData.selected.selectedMonth.id - 1, $scope.userData.selected.selectedDay);
              //dob = dob + dob.getTimezoneOffset() * 60000;
              promises.push(settings.addUserSetting('dateOfBirth', dob));
              data.dateOfBirth = dob;
              break;
            default:
              promises.push(settings.addUserSetting(attribute, $scope.userData[attribute]));
              data[attribute] = $scope.userData[attribute];
          }
        }
      }
      $q.all(promises).then(function () {
        alert('Profile Info Saved');
        $state.go('subscribe');
      });
      // calling the server
/*      data.userServerId = global.userServerId;
      data.deviceServerId = global.deviceServerId;
      $http.post(global.serverIP + "/api/user/updateProfile", data).then(function (res) {
        console.log('saveUserSetting server res = ' + JSON.stringify(res));
      }, function (err) {
        console.error('saveUserSetting server err = ' + JSON.stringify(err));
      });*/
      $translate.use($scope.userData.language.substr(0, 2));
    }
    
    
});