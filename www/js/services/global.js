angular.module('starter.services')
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    //var serverIP = 'http://192.168.100.11:3000';
    var userName;

    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName
    };
  });

