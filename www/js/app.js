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

  .run(function ($ionicPlatform, global, $cordovaPreferences, notificationHandler, dbHandler, serverHandlerListV2, $state, serverHandlerEntryV2, $location, serverHandler, userVerify, $ionicLoading, $timeout,localItemHandlerV2) {
        
    $ionicPlatform.ready(function () {


      
      /*Disabe H/W back button in some cases*/
      $ionicPlatform.ready(function () {
    $ionicPlatform.registerBackButtonAction(function (event) {
        if ( ($state.$current.name=="lists") ||
             ($state.$current.name=="subscribe") ||
             ($state.$current.name=="config")||
             ($state.$current.name=="verify")
            ){
               navigator.app.exitApp();
            } else {
                // For all other states, the H/W BACK button is enabled
                navigator.app.backHistory();
            }
        }, 100); 

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
      document.addEventListener("deviceready", function () {

        alert('just to wait');
        /* if (typeof PushNotification === "defined") {*/
        var push = PushNotification.init({
          "android": {"senderID": "992783511835"},
          browser: {
            pushServiceURL: 'http://push.api.phonegap.com/v1/push'
          },
          "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {}
        });

        push.on('registration', function (data) {
          console.log('18/02/2017 - aalatief - app.js: DataKey:' + data.registrationId);
          global.dataKey = data.registrationId;
          //                callAjax(data.registrationId);

          dbHandler.initDB()
            .then(function (result) {
                userVerify.getUserSetting()
                  .then(function (result) {
                      userVerify.getUserSetSuccessCB(result);
                      users = userVerify.userSetting();
                      global.userServerId = userVerify.getUserServerId();
                      global.deviceServerId = userVerify.getDeviceServerId();

                    
                    /*Load Master Items in case user is verified*/
                    localItemHandlerV2.getAllMasterItem()
                    .then(function (result) {
                        global.masterItems  = result;
                           console.log('7/3/2017 - app.run - aalatief: Master Item:' + JSON.stringify(global.masterItems));
                      }
                      , function (error) {
                        console.log('aalatief: List master Item Load Fail:' + JSON.stringify(error));

                      });
                      if (userVerify.isVerified()) {
                        console.log('app.js user verified true');
                        serverHandler.syncInit();
                        $ionicLoading.hide();
                        $location.path("/lists");

                      }
                      else {
                        $ionicLoading.hide();
                        $location.path("/subscribe");

                      }
                      
                      console.log('01/02/2017 - app.run - aalatief: Users:' + JSON.stringify(users));
                      console.log('01/02/2017 - app.run - aalatief: User Server ID:' + global.userServerId);
                      console.log('01/02/2017 - app.run - aalatief: Device Server ID:' + global.deviceServerId);

                    }
                    , function (error) {
                      userVerify.getUserSetErrorCB();
                      console.log('02/02/2017 - app.run - aalatief: userSetting Fail:' + JSON.stringify(error));
                      ;
                    });

              },
              function (error) {
                console.log('02/02/2017 - app.run - aalatief: initDB Fail' + JSON.stringify(error));
              });
        });

        push.on('notification', function (msg) {

          notificationHandler.handleNotification(msg);

        });

        push.on('error', function (e) {
          alert(e.message);
        });


        /*}*/
      });
      /* else{*/
      if (typeof PushNotification != "defined" && !window.cordova) {
        dbHandler.initDB()
          .then(function (result) {
              global.dataKey = 'ZXCV';
              userVerify.getUserSetting()
                .then(function (result) {
                    userVerify.getUserSetSuccessCB(result);
                    users = userVerify.userSetting();
                    global.userServerId = userVerify.getUserServerId();
                    global.deviceServerId = userVerify.getDeviceServerId();
                    
                  /*Load Master Items in case user is verified*/
                    localItemHandlerV2.getAllMasterItem()
                    .then(function (result) {
                        global.masterItems  = result;
                           console.log('7/3/2017 - app.run - aalatief: Master Item:' + JSON.stringify(global.masterItems));
                      }
                      , function (error) {
                        console.log('aalatief: List master Item Load Fail:' + JSON.stringify(error));

                      });
                    if (userVerify.isVerified()) {
                      $ionicLoading.hide();
                      $location.path("/lists");

                      serverHandler.syncInit();
                    }
                    else {
                      $ionicLoading.hide();
                      $location.path("/subscribe");

                    }
                    
                  
/*                        localItemHandlerV2.getAllMasterItem()
                        .then(function (result) {
                            global.masterItems  = result;
                               console.log('7/3/2017 - app.run - aalatief: Master Item:' + JSON.stringify(global.masterItems));
                          }
                          , function (error) {
                            console.log('aalatief: List master Item Load Fail:' + JSON.stringify(error));
                            
                          });*/
                                         
                 /*   global.masterItems  = localItemHandlerV2.masterItems();  */
                 /*   console.log('7/3/2017 - app.run - aalatief: Master Item:' + JSON.stringify(global.masterItems));*/
                  
                  
                    console.log('01/02/2017 - app.run - aalatief: Users:' + JSON.stringify(users));
                    console.log('01/02/2017 - app.run - aalatief: User Server ID:' + global.userServerId);
                    console.log('01/02/2017 - app.run - aalatief: Device Server ID:' + global.deviceServerId);

                  }
                  , function (error) {
                    userVerify.getUserSetErrorCB();
                    console.log('02/02/2017 - app.run - aalatief: userSetting Fail:' + JSON.stringify(error));
                    ;
                  });

            },
            function (error) {
              console.log('02/02/2017 - app.run - aalatief: initDB Fail' + JSON.stringify(error));
            });

      }
      /* }
       */


      /*      $cordovaPreferences.fetch('userName')
       .success(function (value) {
       alert("Success: " + value);
       global.userName = value;
       })
       .error(function (error) {
       alert("Error: " + error);
       $location.path('/config');
       });*/

      //serverHandler.SynchInitTest();


//      push.setMultiNotificationMode(); // pushNotification - Pushnotification Plugin Object

      /*      push.on('notification', function (msg) {

       console.log('Message ');
       console.log(JSON.stringify(msg));
       serverHandlerListV2.syncListsDownstream().then(function (res) {
       console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
       console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
       console.log("$state.params = " + JSON.stringify($state.params));
       if ($location.url() == '/lists') {
       $state.reload();
       }
       serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
       if ($location.url().startsWith('/item')) {
       console.log('NOTIFICATION ENTRY RES ' + JSON.stringify(res));
       for(var i=0; i< res.length; i++){
       console.log("$state.listId = " + $state.params.listId);
       if(res[i].listLocalId == $state.params.listId){
       console.log('NOTIFICATION ENTRY LIST MATCH reloading');
       $state.reload();
       }
       }
       }
       }, function (err) {

       });
       }
       ,
       function () {
       console.log("SERVER HANDLER ERROR")
       }
       );

       });

       push.on('error', function (e) {
       alert(e.message);
       });*/

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
});
