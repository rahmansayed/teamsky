angular.module('starter.controllers')
  .controller('verifyCtrl', function ($scope, global, contactHandler, $http, $state, settings, $ionicHistory, serverHandler, localItemHandlerV2, $timeout, $interval) {
      $scope.settings = {};
      var data = {};

      $ionicHistory.nextViewOptions({
        disableBack: true
      });

      $scope.buttonEnabled = false;


      /* $timeout(function() {
       $scope.buttonEnabled = true;
       $scope.waitSecond =  $scope.waitSecond-1;
       alert('5 sec');
       }, 5000).then(null);
       */
      $scope.remaining = 15;

      countdown = function countdown(remaining) {
        if (remaining == 0) {
          document.getElementById('countdown').innerHTML = 'done';
          $scope.$apply(function () {
            $scope.buttonEnabled = true;

          });
        }

        else {
          document.getElementById('countdown').innerHTML = remaining;
          setTimeout(function () {
            countdown(remaining - 1);
          }, 1000);
        }
      };

      countdown($scope.remaining);

      /* (function countdown(remaining) {
       if (remaining == 0) {
       document.getElementById('countdown').innerHTML = 'done';
       $scope.$apply(function () {
       $scope.buttonEnabled = true;

       });
       }

       else {
       document.getElementById('countdown').innerHTML = remaining;
       setTimeout(function () {
       countdown(remaining - 1);
       }, 1000);
       }
       })($scope.remaining);*/

      $scope.verify = function (vCode) {
        data = {
          deviceLocalId: settings.verificationData.deviceLocalId,
          userServerId: settings.verificationData.userServerId,
          deviceServerId: settings.verificationData.deviceServerId,
          vCode: vCode,
          countryCode: settings.verificationData.countryCode
        };
        /*  console.log('aalatief Verify, User Data:'+angular.toJson($scope.verify));    */
        console.log('28/2/2017 - aalatief : date: ' + angular.toJson(data));
        //$scope.settings.mobile = '999';
        $http.post(global.serverIP + "/api/user/activate", data)
          .then(function (response) {
            alert(angular.toJson(response.data));
            $state.go('account');
            global.userServerId = response.data.userServerId;
            global.deviceServerId = response.data.deviceServerId;

            console.log('06/02/2017 - verifyCtrl - aalatief after Verify: User Server ID:' + global.userServerId);
            console.log('06/02/2017 - verifyCtrl - aalatief after Verify: Device Server ID:' + global.deviceServerId);
            /*console.log('aaaltief: user to be updated:'+angular.toJson(data)); */

            var otherSettings = {
              /*preferredLanguage: response.data.preferredLanguage,*/
              dateOfBirth: response.data.dateOfBirth || '',
              gender: response.data.gender || '',
              name: response.data.name || '',
              /*currentLocation: response.data.currentLocation,*/
              verified: 'Y',
              userServerId: response.data.userServerId,
              deviceServerId: response.data.deviceServerId,
              countryCode: data.countryCode
            };

            settings.setSettingsV2(otherSettings).then(function () {
              contactHandler.downloadContactPhoto(global.userServerId).then(function (res) {
                settings.addUserSetting('photo', res).then(function () {
                  $state.go('account');
                });
                console.log('downloadContactPhoto User Setting: ' + angular.toJson(settings.userSetting));
              }, function () {
                $state.go('account');
              });
            });

            serverHandler.syncInit()
              .then(function (response) {
                  localItemHandlerV2.getAllMasterItem()
                    .then(function (result) {
                        global.masterItems = result;
                        console.log('13/03/2017 - aalatief - global.masterItems populated = ');
                      }
                      , function (error) {
                        console.error('global.masterItems Item Load Fail:' + angular.toJson(error));
                      });
                },
                function (error) {
                });
            /*console.log('USER VERIFIED, User Data:'+angular.toJson($scope.verify)); */
            //TODO go to lists only after succussfull verification
          },
                function (error) {
                  alert('Wrong Code, Verification code: ' + vCode);
                });
      }

    $scope.getDirection = function () {
//        console.log('userSetting: ' + angular.toJson(settings.userSetting));
      $scope.language = settings.getSettingValue('language');
//        console.log('getDirection: '+angular.toJson( $scope.language));
      if ($scope.language == 'english') {
        return {direction: "ltr",fontFamily:"AndikaNewBasic"};
      }
      else {
        return {direction: "rtl",fontFamily:"GessLight"};
      }

    }
      
      $scope.getImgDirection = function () {
      $scope.language = settings.getSettingValue('language');
      /* console.log('getDirection: '+angular.toJson( $scope.language));*/
      if ($scope.language == 'english') {
        return {transform: "scaleX(-1)"};
      }

      }

      $scope.resendVCode = function () {
        $scope.buttonEnabled = false;
        $scope.remaining = 15;
        countdown($scope.remaining);
        var data = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId,
          sendSMS: 'N'
        };

        $http.post(global.serverIP + "/api/user/resendVerificationCode", data).then(function (res) {
          alert(angular.toJson(res.data));
        }, function (err) {
          console.error('resendVerificationCode error = ' + err.message);
        });
      }
    }
  );

