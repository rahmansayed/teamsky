angular.module('starter.controllers')
  .controller('verifyCtrl', function ($scope, global, $http, $state,userVerify, $ionicHistory, serverHandler) {
    $scope.settings = {};
    var data = {};

      $ionicHistory.nextViewOptions({
    disableBack: true
  });



    user = userVerify.verificationData();


    $scope.userInfo=userVerify.selectedUser(user.deviceLocalId);

    $scope.verify = function (vCode) {
        data = {
        deviceLocalId: user.deviceLocalId,
        userServerId:user.userServerId,
        deviceServerId:user.deviceServerId,
        vCode: vCode,
        countryCode:user.countryCode
      };
   /*  console.log('aalatief Verify, User Data:'+JSON.stringify($scope.verify));    */
        console.log('28/2/2017 - aalatief : date: '+JSON.stringify(data));
      //$scope.settings.mobile = '999';
      $http.post(global.serverIP+ "/api/user/activate" , data)
        .then(function (response) {
          alert(JSON.stringify(response.data));
           global.userServerId = response.data.userServerId;
           global.deviceServerId = response.data.deviceServerId;

           console.log('06/02/2017 - verifyCtrl - aalatief after Verify: User Server ID:' + global.userServerId);
           console.log('06/02/2017 - verifyCtrl - aalatief after Verify: Device Server ID:' + global.deviceServerId);
          /*console.log('aaaltief: user to be updated:'+JSON.stringify(data)); */
          userVerify.updateUserInfo(data,'V');
          userVerify.addUserSetting(userInfo,'verified','Y');
          userVerify.addUserSetting(userInfo,'userServerId',response.data.userServerId);
          userVerify.addUserSetting(userInfo,'deviceServerId',response.data.deviceServerId);
          userVerify.addUserSetting(userInfo,'countryCode',data.countryCode);
          
          serverHandler.syncInit();

          /*console.log('USER VERIFIED, User Data:'+JSON.stringify($scope.verify)); */
          //TODO go to lists only after succussfull verification
          $state.go('lists');
        });
    }
  });

