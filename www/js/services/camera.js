angular.module('starter.services')

  .factory('camera', function (global) {


    function capture() {
      var options = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI
      };

      navigator.camera.getPicture(function (imageURI) {
        window.resolveLocalFileSystemURL(imageURI, function (fileEntry) {

          // Do something with the FileEntry object, like write to it, upload it, etc.
          // writeFile(fileEntry, imgUri);
          console.log("got file: " + fileEntry.fullPath);
          // displayFileData(fileEntry.nativeURL, "Native URL");

        }, function () {
          // If don't get the FileEntry (which may happen when testing
          // on some emulators), copy to a new FileEntry.
        });
      }, function (message) {
        alert('Failed because: ' + message);
      }, options);
    }


    return {
      capture:capture
    };
  });

