angular.module('starter.services')

  .factory('camera', function (global, $q) {


      function capture() {
        var defer = $q.defer();
        var options = {
          'buttonLabels': ['Take Picture', 'Select From Gallery'],
          'addCancelButtonWithLabel': 'Cancel'
        };
        navigator.notification.confirm(
          "Please select photo source ", // the message
          function (index) {
            switch (index) {
              case 1:
                doGetCameraPhoto().then(function (res) {
                  defer.resolve(res);
                });
                break;
              case 2:
                doGetGalleryPhoto().then(function (res) {
                  defer.resolve(res);
                });
                break;
            }
          },
          "Select Photo", // a title
          ["Camera", "Gallery"]    // text of the buttons
        );

        return defer.promise;
      }

      function doGetCameraPhoto() {
        var defer = $q.defer();
        var options = {
          quality: 20,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.CAMERA,
          correctOrientation: true,
          cameraDirection: Camera.Direction.FRONT
        };

        navigator.camera.getPicture(function (imageURI) {
          window.resolveLocalFileSystemURL(imageURI, function (fileEntry) {
            // Do something with the FileEntry object, like write to it, upload it, etc.
            // writeFile(fileEntry, imgUri);
            storeFile(imageURI).then(function (fileURI) {
              defer.resolve(fileURI);
            });
            console.log("got file: " + fileEntry.fullPath);
            // displayFileData(fileEntry.nativeURL, "Native URL");
          }, function () {
            // If don't get the FileEntry (which may happen when testing
            // on some emulators), copy to a new FileEntry.
          });
        }, function (message) {
          alert('Failed because: ' + message);
        }, options);
        return defer.promise;
      }


      function doGetGalleryPhoto() {
        var defer = $q.defer();
        var options = {
          quality: 20,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        };

        navigator.camera.getPicture(function (imageURI) {
            storeFile(imageURI).then(function (fileURI) {
              defer.resolve(fileURI);
            });
          }, function (message) {
            alert('Failed because: ' + message);
          },
          options
        );

        return defer.promise;
      }


      function storeFile(imageURI) {
        var defer = $q.defer();
        window.resolveLocalFileSystemURL(imageURI, function success(fileEntry) {
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getDirectory("contactPhotos/", {create: true}, function (de) {
              fileEntry.copyTo(de, global.userServerId + '.jpg', function (fe) {
                console.log("file created successfully x = " + fe.toURL());
                uploadFile(fe.toURL());
                defer.resolve(fe.toURL());
              }, function () {
                console.error("file creation error");
              }, null);

            }, function () {
              // If don't get the FileEntry (which may happen when testing
              // on some emulators), copy to a new FileEntry.
              console.error("window.resolveLocalFileSystemURL(imageURI) error " + angular.toJson(err));
            });
          }, function () {
            // If don't get the FileEntry (which may happen when testing
            // on some emulators), copy to a new FileEntry.
            console.error("window.resolveLocalFileSystemURL(imageURI) error " + angular.toJson(err));
          });
        }, function (err) {
          console.error("window.resolveLocalFileSystemURL(imgUri) error " + angular.toJson(err));
        });
        return defer.promise;
      };

      function uploadFile(fileURI) {
        var options = new FileUploadOptions();
        options.fileKey = "userPhoto";
        options.mimeType = "image/jpeg";
        options.params = {
          userServerId: global.userServerId,
          deviceServerId: global.deviceServerId
        };

        var ft = new FileTransfer();
        ft.upload(fileURI, encodeURI(global.serverIP + "/photos/uploadProfilePhoto"),
          function (res) {
            console.log("Code = " + res.responseCode);
          },
          function (error) {
            console.error("upload error = " + angular.toJson(error));
            alert("An error has occurred: Code = " + error.code);
          },
          options);
      }

      return {
        capture: capture
      };
    }
  )
;

