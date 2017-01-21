angular.module('starter.services')
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    //var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    var serverIP = 'http://192.168.100.7:3000';
    var userName;
    var userServerId="582c3f6d30126504007c6bdf";
    var deviceServerId="582c3f6d30126504007c6be0";

    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName
    };
  });

