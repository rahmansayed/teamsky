angular.module('starter.services')

  .factory('settings', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler, global) {


      var selectedUsers = [];

      var userSetting = [];

      var verificationData = {
        deviceLocalId: '',
        userServerId: 0,
        deviceServerId: 0,
        vcode: '',
        countryCode: ''
      };

      function getSettingValue(settingName) {

//        console.log("userSetting: " + angular.toJson(userSetting));
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
        return userServerId == 0 ? 'Not Found' : userServerId;
      };
//////////////////////////////////////////////////////////////////
      function getDeviceServerId() {
        var deviceServerId = getSettingValue('deviceServerId');
        return deviceServerId == '' ? 'Not Found' : deviceServerId;
      };


      function addUserSettingtoArray(setting, value) {
        var settingIdx = -1;
        for (var i = 0; i < userSetting.length; i++) {
          if (userSetting[i].setting == setting) {
            settingIdx = i;
            break;
          }
        }
        console.log('addUserSettingtoArray settingIdx = ' + settingIdx);
        if (settingIdx != -1) {
          userSetting[settingIdx].value = value;
        }
        else {
          userSetting.push({
            setting: setting,
            value: value
          });
        }

        console.log('addUserSettingtoArray userSetting = ' + angular.toJson(userSetting));
      }

      function addUserSettingV2(settings) {

        var deferred = $q.defer();

        global.db.transaction(function (tx) {
            var updateQuery = "UPDATE userSetting set value = ? where setting = ?";
            var insertQuery = "INSERT OR IGNORE INTO userSetting(setting,value,lastUpdateDate,lastUpdateBy) VALUES (?,?,?,?)";
            settings.forEach(function (setting) {
              tx.executeSql(updateQuery, [setting.value, setting.name]);
//            console.log("addUserSetting res1 = " + angular.toJson(res.rowsAffected));
              tx.executeSql(insertQuery, [setting.name, setting.value, new Date().getTime(), 'S']);
//              console.log("addUserSetting res2 = " + angular.toJson(res2.rowsAffected));
              addUserSettingtoArray(setting.name, setting.value);
              deferred.resolve();
            });
          },
          function (err) {
            console.error("addUserSetting db err = " + err.message);
            deferred.reject(err);
          },
          function () {
            deferred.resolve();
          }
        );
        return deferred.promise;
      }


/////////////////////////////////////////////////////////////////////////////////

      function addUserSetting(setting, value) {

        var deferred = $q.defer();

        global.db.transaction(function (tx) {
          var updateQuery = "UPDATE userSetting set value = ? where setting = ?";
          tx.executeSql(updateQuery, [value, setting], function (tx, res) {
//            console.log("addUserSetting res1 = " + angular.toJson(res.rowsAffected));
            var insertQuery = "INSERT OR IGNORE INTO userSetting(setting,value,lastUpdateDate,lastUpdateBy) VALUES (?,?,?,?)";
            tx.executeSql(insertQuery, [setting, value, new Date().getTime(), 'S'], function (tx, res2) {
//              console.log("addUserSetting res2 = " + angular.toJson(res2.rowsAffected));
              addUserSettingtoArray(setting, value);
              deferred.resolve();
            }, function (err) {
              console.error("addUserSetting insert error");
              // update array
              deferred.reject();
            });
          }, function (err) {
            console.error("addUserSetting update error");
            deferred.reject();
          });
        }, function (err) {
          console.error("addUserSetting db err = " + err.message);
          deferred.reject(err);
        }, function () {
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
            userSetting = [];
            for (var i = 0; i < res.rows.length; i++) {
              userSetting.push(res.rows.item(i));
            }
            console.log("getUserSetting success = " + angular.toJson(userSetting));
            deferred.resolve(userSetting);
          }, function (error) {
            //Error Callback
            console.log("getUserSetting error = " + error.message);
            deferred.reject(error);
          });
        });
        return deferred.promise;
      };

      function setSettings(updates) {
        var promises = [];
        for (var i in updates) {
          switch (i) {
            case "name" :
              promises.push(addUserSetting("displayName", updates[i]));
              break;
            case "preferredLanguage":
              promises.push(addUserSetting("language", updates[i]));
              break;
            case "currentLocation":
              promises.push(addUserSetting("country", updates[i]));
              break;
            default:
              promises.push(addUserSetting(i, updates[i]));
              break;
          }
        }
        return $q.all(promises);
      }


      function setSettingsV2(updates) {
        var settings = [];
        for (var i in updates) {
          switch (i) {
            case "name" :
              settings.push({
                name: "displayName",
                value: updates[i]
              });
              break;
            case "preferredLanguage":
              settings.push({
                name: "language",
                value: updates[i]
              });
              break;
            case "currentLocation":
              settings.push({
                name: "country",
                value: updates[i]
              });
              break;
            default:
              settings.push({
                name: i,
                value: updates[i]
              });
              break;
          }
        }
        return addUserSettingV2(settings);
      }

///////////////////////////////////////////////////////////////////////

      return {
        verificationData: verificationData,
        getUserSetting: getUserSetting,
        isVerified: isVerified,
        addUserSetting: addUserSetting,
        getUserServerId: getUserServerId,
        getDeviceServerId: getDeviceServerId,
        getSettingValue: getSettingValue,
        setSettings: setSettings,
        setSettingsV2: setSettingsV2,
        userSetting: userSetting

      };
    }
  )
;

