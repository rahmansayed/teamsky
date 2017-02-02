// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic',
                          'ionic.service.core',
                          'starter.controllers',
                          'starter.services',
                          'proton.multi-list-picker',
                          'ngCordova',
                          'ion-floating-menu',
                          'angular.filter',
                          'ngRoute'/*,
                          'countrySelect'*/
])
/*var db = null;*/

  .run(function ($ionicPlatform, global, local, $cordovaPreferences, dbHandler, $location,serverHandler,userVerify,$ionicLoading,$location,$timeout) {
    $ionicPlatform.ready(function () {


       
        
        
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
        
               dbHandler.initDB()
      .then(function(result){
           userVerify.getUserSetting()
      
          .then(function(result){
          users = userVerify.userSetting();
          global.userServerId = userVerify.getUserServerId(); 
          global.deviceServerId = userVerify.getDeviceServerId(); 
          console.log('01/02/2017 - app.run - aalatief: Users:'+JSON.stringify(users));
          console.log('01/02/2017 - app.run - aalatief: User Server ID:'+global.userServerId);   
          console.log('01/02/2017 - app.run - aalatief: Device Server ID:'+global.deviceServerId);         
      }
        , function(error) {
            console.log('02/02/2017 - app.run - aalatief: userSetting Fail:'+JSON.stringify(error));;
        });
           
       },
    function(error){
        console.log('02/02/2017 - app.run - aalatief: initDB Fail'+JSON.stringify(error));;

       });

      $cordovaPreferences.fetch('userName')
        .success(function (value) {
          alert("Success: " + value);
          global.userName = value;
        })
        .error(function (error) {
          alert("Error: " + error);
          $location.path('/config');
        });

      serverHandler.SynchInitTest();

  /*    var push = PushNotification.init({
        "android": {"senderID": "842803018154"},
        "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {}
      });
*/
 /*
      push.on('registration', function (data) {
        console.log(data.registrationId);
        global.dataKey = data.registrationId;
//                callAjax(data.registrationId);
      });
*/
//      push.setMultiNotificationMode(); // pushNotification - Pushnotification Plugin Object


 /*     push.on('notification', function (msg) {
        //alert(data.message);
        alert("From " + msg.additionalData.username + "." + msg.additionalData.listname +
          "\n" + msg.additionalData.item + "\n" +
          msg.additionalData.uom +
          " \n" + msg.additionalData.qty + "\n" +
          "with server_id = " + msg.additionalData._id);
        //local.addFromCloud(JSON.parse(msg.data), "testing", msg.title);
        console.log('Message ');
        console.log(JSON.stringify(msg));
        //syncDB($http, 'testing', $cordovaSQLite, global);

// data.title,
// data.count,
// data.sound,
// data.image,
// data.additionalData
      });
*/
  /*    push.on('error', function (e) {
        alert(e.message);
      });
*/
      //local.init();
      //local.addMasterData('items', {name: "milk"});
      //local.addPlusSync({item: "AX", qty: 1}, "testing");
      //local.addPlusSync({item: "BX", qty: 2}, "testing");
      //local.addPlusSync({item: "CX", qty: 3}, "testing");
      //local.addPlusSync({item: "DX", qty: 4}, "testing");


    });

    $ionicPlatform.on('resume', function (resumeEvent) {

        if (resumeEvent.pendingResult) {
          if (resumeEvent.pendingResult.pluginStatus === "OK") {
            console.log('resumeEvent.pendingResult.pluginServiceName = ' + resumeEvent.pendingResult.pluginServiceName);
            var contact = navigator.contacts.create(resumeEvent.pendingResult.result);


            var data =
            {
              user: global.userName,
              contacts: contact
            };

            $http.post("http://" + global.serverIP + "/cloud_test/upload_contacts.php", {data: data}).then(
              function (response) {
                console.log("success upload contacts \n" + response);
              },
              function (error) {
                console.error(error);
              }
            );

          } else {
            console.log(resumeEvent.pendingResult.result);
          }
        }
      }
    );

  });
