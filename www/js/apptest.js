// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('starter', ['ionic',
  'ionic.service.core',
  'starter.controllers.accountCtrl',
  'starter.controllers.addCtrl',
  'starter.controllers.addItem',
  'starter.controllers.addItemCtrl',
  'starter.controllers.editCtrl',
  'starter.controllers.listCtrl',
  'starter.controllers.listItem',
  'starter.controllers.verifyCtrl',
  'starter.controllers.listDtlsCtrl',
  'starter.services.serverListHandler',
  'starter.services.cloud',
  'starter.services.global',
  'starter.services.itemHandler',
  'starter.services.listHandler',
  'starter.services.local',
  'starter.services.userMgmt',
  'ngCordova',
  'ion-floating-menu'])

.run(function ($ionicPlatform, global, local, $cordovaPreferences, serverListHandler,$location) {
  //.run(function ($ionicPlatform, global, local, $cordovaPreferences,$location) {

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

      $cordovaPreferences.fetch('userName')
        .success(function (value) {
          alert("Success: " + value);
          global.userName = value;
        })
        .error(function (error) {
          alert("Error: " + error);
          $location.path('/account');

        });

      /*var push = PushNotification.init({
       "android": {"senderID": "842803018154"},
       "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {}
       });

       push.on('registration', function (data) {
       console.log(data.registrationId);
       global.dataKey = data.registrationId;
       //                callAjax(data.registrationId);
       });

       //      push.setMultiNotificationMode(); // pushNotification - Pushnotification Plugin Object


       push.on('notification', function (msg) {
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

       push.on('error', function (e) {
       alert(e.message);
       });
       */
      /*local.init();

       local.addMasterData('items', {name: "milk"});
       */
      //local.addPlusSync({item: "AX", qty: 1}, "testing");
      //local.addPlusSync({item: "BX", qty: 2}, "testing");
      //local.addPlusSync({item: "CX", qty: 3}, "testing");
      //local.addPlusSync({item: "DX", qty: 4}, "testing");

      // Test Create
      var timestamp = new Date() / 1000;
/*
      var list1 = {
        listLocalId: "1",
        listName:"osamatest"+timestamp,
        title:"osamatest"+timestamp,
        listColour:"Red",
        listOrder:"1"
      };
      serverListHandler.createList(list1);
*/

      // Test Update
    /*  var list2= {
        listServerId: "5830afe375bd580400edbbcd",
        listName:"osamatest"+timestamp,
        title:"osamatest"+timestamp,
        listColour:"Red",
        listOrder:"1"
      };
      serverListHandler.updateList(list2);

*/

   // Test Delete
      var list3 = {
        listServerId: "5830afe375bd580400edbbcd"};
      serverListHandler.deleteList(list3);





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













  $scope.contacts = [
    { name: 'Gordon Freeman' },
    { name: 'Barney Calhoun' },
    { name: 'Lamarr the Headcrab' },
  ];

  $ionicModal.fromTemplateUrl('templates/modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  
  $scope.createContact = function(u) {        
    $scope.contacts.push({ name: u.firstName + ' ' + u.lastName });
    $scope.modal.hide();
  };
