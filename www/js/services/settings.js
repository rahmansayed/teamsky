angular.module('starter.services')

  .factory('settings', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler, global) {


      var selectedUsers = [];

      var userSetting = [];

      var verificationData = {
        deviceLocalId: '',
        userServerId: '',
        deviceServerId: '',
        vcode: '',
        countryCode: ''
      };

      function getSettingValue(settingName) {
        for (var j = 0; j < userSetting.length; j++) {
          if (userSetting[j].setting == settingName) {
            return userSetting[j].value;
          }
        }
        return '';
      };

      /*Check whther is verified */
      function isVerified() {
        return getSettingValue('verified') == 'Y';
      };
////////////////////////////////////////////////////////////////////////////
      function getUserServerId() {
        var userServerId = getSettingValue('userServerId');
        return userServerId == '' ? 'Not Found' : userServerId;
      };
//////////////////////////////////////////////////////////////////
      function getDeviceServerId() {
        var deviceServerId = getSettingValue('deviceServerId');
        return deviceServerId == '' ? 'Not Found' : deviceServerId;
      };


/////////////////////////////////////////////////////////////////////////////////

      function addUserSetting(setting, value) {

        var deferred = $q.defer();

        global.db.transaction(function (tx) {
          var updateQuery = "UPDATE userSetting set value = ? where setting = ?";
          tx.executeSql(updateQuery, [value, setting], function (tx, res) {
            console.log("addUserSetting res = " + JSON.stringify(res));
            var insertQuery = "INSERT OR IGNORE INTO userSetting(setting,value,lastUpdateDate,lastUpdateBy) VALUES (?,?,?,?)";
            tx.executeSql(insertQuery, [setting, value, new Date().getTime(), 'S']);
          });
        }, function (err) {
          console.error("addUserSetting err = " + err.message);
          deferred.reject(err);
        }, function () {
          deferred.resolve();
        });
        return deferred.promise;
      };


///////////////////////////////////////////////////////////////////////////////////////

      function getUserSetting() {
        var deferred = $q.defer();
        var query = "SELECT *  FROM userSetting u";
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
            //Success Callback
            for (var i = 0; i < res.rows.length; i++) {
              userSetting.push(res.rows.item(i));
            }
            deferred.resolve(userSetting);
          }, function (error) {
            //Error Callback
            console.log("getUserSetting error = " + error.message);
            deferred.reject(error);
          })
        });
        return deferred.promise;
      };

///////////////////////////////////////////////////////////////////////

      return {
        verificationData: verificationData,
        getUserSetting: getUserSetting,
        isVerified: isVerified,
        addUserSetting: addUserSetting,
        getUserServerId: getUserServerId,
        getDeviceServerId: getDeviceServerId,
        getSettingValue: getSettingValue
      };
    }
  );

