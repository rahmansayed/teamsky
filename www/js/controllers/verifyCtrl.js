angular.module('starter.controllers')
  .controller('verifyCtrl', function ($scope, global, $http, $state, settings, $ionicHistory, serverHandler, localItemHandlerV2) {
    $scope.settings = {};
    var data = {};

    $ionicHistory.nextViewOptions({
      disableBack: true
    });


    $scope.verify = function (vCode) {
      data = {
        deviceLocalId: settings.verificationData.deviceLocalId,
        userServerId: settings.verificationData.userServerId,
        deviceServerId: settings.verificationData.deviceServerId,
        vCode: vCode,
        countryCode: settings.verificationData.countryCode
      };
      /*  console.log('aalatief Verify, User Data:'+JSON.stringify($scope.verify));    */
      console.log('28/2/2017 - aalatief : date: ' + JSON.stringify(data));
      //$scope.settings.mobile = '999';
      $http.post(global.serverIP + "/api/user/activate", data)
        .then(function (response) {
          alert(JSON.stringify(response.data));
          global.userServerId = response.data.userServerId;
          global.deviceServerId = response.data.deviceServerId;

          console.log('06/02/2017 - verifyCtrl - aalatief after Verify: User Server ID:' + global.userServerId);
          console.log('06/02/2017 - verifyCtrl - aalatief after Verify: Device Server ID:' + global.deviceServerId);
          /*console.log('aaaltief: user to be updated:'+JSON.stringify(data)); */

          var otherSettings = {
            /*preferredLanguage: response.data.preferredLanguage,*/
            dateOfBirth: response.data.dateOfBirth,
            gender: response.data.gender,
            name: response.data.name,
            currentLocation: response.data.currentLocation,
            verified: 'Y',
            userServerId: response.data.userServerId,
            deviceServerId: response.data.deviceServerId,
            countryCode: data.countryCode
          };

          settings.setSettings(otherSettings).then(function () {
            settings.getUserSetting()
              .then(function (response) {
                console.log('User Setting: '+JSON.stringify(response));
                $state.go('account');
              }, function () {
              })
            ;
          });

          serverHandler.syncInit()
            .then(function (response) {
                localItemHandlerV2.getAllMasterItem()
                  .then(function (result) {
                      global.masterItems = result;
                      console.log('13/03/2017 - aalatief - global.masterItems populated = ');
                    }
                    , function (error) {
                      console.error('global.masterItems Item Load Fail:' + JSON.stringify(error));
                    });

              },
              function (error) {

              });

          /*console.log('USER VERIFIED, User Data:'+JSON.stringify($scope.verify)); */
          //TODO go to lists only after succussfull verification
        });
    }
  });

