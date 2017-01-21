angular.module('starter.controllers')
  .controller('verifyCtrl', function ($scope, global, $http, $state,userVerify,dbHandler) {
    $scope.settings = {};
    var data = {};
    
    
    user = userVerify.verificationData();
    
    
    $scope.userInfo=userVerify.selectedUser(user.deviceLocalId);
    
    $scope.verify = function (vCode) {
        data = {
        deviceLocalId: user.deviceLocalId,  
        userServerId:user.userServerId,
        deviceServerId:user.deviceServerId,  
        vCode: vCode
      };
     console.log('aalatief Verify, User Data:'+JSON.stringify($scope.verify));    
        console.log('date: '+JSON.stringify(data));
      //$scope.settings.mobile = '999';
      $http.post(global.serverIP+ "/api/user/activate" , data)
        .then(function (response) {
          alert(response.data);
          
          console.log('aaaltief: user to be updated:'+JSON.stringify(data)); 
          userVerify.updateUserInfo(data,'V');
          console.log('USER VERIFIED, User Data:'+JSON.stringify($scope.verify)); 
          //TODO go to lists only after succussfull verification
          $state.go('lists');
        });
    }
  });

