angular.module('starter.controllers')
  .controller('AccountCtrl', function ($scope, global, $cordovaPreferences, $http, $location,
                                       $cordovaContacts, userMgmt, $cordovaCamera, $cordovaFileTransfer, $cordovaProgress) {
    $scope.settings = {
      enableFriends: true
    };

    var data = {
      userName: $scope.settings.mobile,
      datakey: global.dataKey
    };

    $scope.subscribe = function () {
      var data = {
        userName: $scope.settings.mobile,
        datakey: global.dataKey,
        deviceUUID: global.deviceUUID
      };
      userMgmt.subscribe(data);
    }

    $scope.swiped = function () {
      console.log("Swiped");
    };

//    $cordovaContacts.find({}).then(function (allContacts) { //omitting parameter to .find() causes all contacts to be returned
    //$cordovaContacts.pickContact().then(function (allContacts) { //omitting parameter to .find() causes all contacts to be returned
    $scope.pickContact = function () {
      navigator.contacts.pickContact(function (allContacts) {
        var data =
        {
          user: global.userName,
          contacts: allContacts
        };

        $http.post(global.serverIP + "/cloud_test/upload_contacts.php", {data: data}).then(
          function (response) {
            console.log("success upload contacts \n" + response);
          },
          function (error) {
            console.error(error);
          }
        );
      });
    }

    $scope.capture = function () {
      var options = {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
//        targetWidth: 100,
//        targetHeight: 100,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: true,
        correctOrientation: true
      };

      $cordovaCamera.getPicture(options).then(function (fileURI) {
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = 'sampleFile';//fileURI.substr(fileURI.lastIndexOf('/') + 1);

        options.mimeType = "image/jpeg";
        options.params = {
          username: "1001"
        }; // if we need to send parameters to the server request

        /*options.headers = {
         "Content-type" : "image/jpeg; multipart/form-data; charset=utf8",
         "Content-Disposition": 'form-data; name="file"; filename="file"'
         };
         */
        //options.chunkedMode = false;
        $cordovaProgress.showSimpleWithLabelDetail(true, "Loading", "detail");
        $cordovaFileTransfer.upload('http://' + global.serverIP + '/upload', fileURI, options)
          .then(function (result) {
            for (var p in result) {
              console.log(p + ' = ' + result[p]);
              $cordovaProgress.hide();
            }
          }, function (err) {
            console.log('Error = ' + JSON.stringify(err));
          }, function (progress) {
            // constant progress updates
            $cordovaProgress.hide();
            $cordovaProgress.showSimpleWithLabelDetail(true, "Loading", 'Uploaded '+progress.loaded+" / "+progress.total);
            console.log('Progress = ' + JSON.stringify(progress));
          });


        /*        var image = document.getElementById('myImage');
         image.src = "data:image/jpeg;base64," + imageData;
         console.log('\n' + imageData);
         */
      }, function (err) {
        console.log('Error ' + err);
      });
    }
  });


