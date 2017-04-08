angular.module('starter.services')

  .factory('userVerify', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler,global) {


    var selectedUsers = [];

    var userSetting = [];
    
    var verificationData = {
      deviceLocalId: '',
      userServerId: '',
      deviceServerId: '',
      vcode: '',
      countryCode: ''
    };

/*Check whther is verified */
    function isVerified() {
      if (userSetting.length > 0) {

        for (var j = 0; j < userSetting.length; j++) {
          if (userSetting[j].setting == 'verified' && userSetting[j].value == 'Y') {
            /* console.log('aalatief: user already verified!! -> ' + ' '+ userSetting.length);*/
            return true;
          }
        }
        ;
      }

      return false;
    };
////////////////////////////////////////////////////////////////////////////
    function getUserServerId() {
      if (userSetting.length > 0) {

        for (var j = 0; j < userSetting.length; j++) {
          if (userSetting[j].setting == 'userServerId') {
            /* console.log('aalatief: user already verified!! -> ' + ' '+ userSetting.length);*/
            return userSetting[j].value;
          }
        }
        ;
      }

      return 'Not Found';
    };
//////////////////////////////////////////////////////////////////
    function getDeviceServerId() {
      if (userSetting.length > 0) {

        for (var j = 0; j < userSetting.length; j++) {
          if (userSetting[j].setting == 'deviceServerId') {
            /* console.log('aalatief: user already verified!! -> ' + ' '+ userSetting.length);*/
            return userSetting[j].value;
          }
        }
        ;
      }
      /*console.log('aalatief: User Array Still Not Loaded-> ' + ' ' + userSetting.length);*/

      return 'Not Found';
    };
///////////////////////////////////////////////////////////////////////////////////
    function getUserSuccessCB(response) {
      selectedUsers = [];
      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          selectedUsers.push({
            deviceLocalId: response.rows.item(i).deviceLocalId,
            dialCode: response.rows.item(i).dialCode,
            userServerId: response.rows.item(i).userServerId,
            deviceServerId: response.rows.item(i).deviceServerId,
            status: response.rows.item(i).status,
            lastUpdateDate: response.rows.item(i).lastUpdateDate,
            lastUpdateBy: response.rows.item(i).lastUpdateBy
          });
          //console.log('aalatief: Pushed User '+JSON.stringfy(selectedUsers))  ;
        }
      } else {
        var message = "No entry created till now.";
      }
    };

    function getUserErrorCB(error) {
      var loadingLists = false;
      var message = "Some error occurred in fetching User";
    }
    ;


    function getUserSetSuccessCB(response) {
      /*userSetting = [];*/
      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          userSetting.push({
            setting: response.rows.item(i).setting,
            value: response.rows.item(i).value,
            lastUpdateDate: response.rows.item(i).lastUpdateDate,
            lastUpdateBy: response.rows.item(i).lastUpdateBy
          });
         
        }
           console.log('04/02/2017 - aalatief : Pushed User '+JSON.stringify(userSetting))  ;
      } else {
        var message = "No entry created till now.";
      }
    };

    function getUserSetErrorCB(error) {
      var loadingLists = false;
      var message = "Some error occurred in fetching User";
    }
    ;

/////////////////////////////////////////////////////////////////////////////////

    function addUserSetting(setting, value) {


      //Sqlite
      var deferred = $q.defer();
      var query = "INSERT INTO userSetting(setting,value,lastUpdateDate,lastUpdateBy) VALUES (?,?,?,?)";
      dbHandler.runQuery(query, [setting, value, new Date().getTime(), 'S'], function (response) {
        //Success Callback
        console.log(response);
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.log(error);
        deferred.reject(error);
      });

      return deferred.promise;
      /* }*/

    };
///////////////////////////////////////////////////////////////////////////////////////    

    
    function getUserSetting() {
      var deferred = $q.defer();
      var query = "SELECT *  FROM userSetting u";
      /*var query = "SELECT * FROM  masterItem ";*/
      dbHandler.runQuery(query, [], function (response) {
        //Success Callback
        console.log(response);
        userSet = response.rows;
        console.log('04/02/2017 - aalatief - User Setting: ' + JSON.stringify(userSet));
        getUserSetSuccessCB(response);
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.log(error);
        getUserSetErrorCB(error);
        deferred.reject(error);
      });
      console.log('Deferred Promise: ' + JSON.stringify(deferred.promise));
      return deferred.promise;
    };
/////////////////////////////////////////////////////////////////////////

    function updateVerificationData(data) {

      console.log('aalatief service, User Data:' + JSON.stringify(data));
      verificationData.deviceLocalId = data.deviceLocalId;
      verificationData.userServerId = data.userServerId;
      verificationData.deviceServerId = data.deviceServerId;
      verificationData.countryCode = data.countryCode;    

      countryCode = data.countryCode;   
      console.log('28/2/2017 - aalatief service after update, User Data:' + JSON.stringify(global.verificationData));

    };
///////////////////////////////////////////////////////////////////////

    return {

      verificationData: verificationData,
      userSetting: userSetting,
      updateVerificationData: updateVerificationData,
      getUserSetting: getUserSetting,
      isVerified: isVerified,
      addUserSetting: addUserSetting,
      getUserServerId: getUserServerId,
      getDeviceServerId: getDeviceServerId
      
    };
  });

