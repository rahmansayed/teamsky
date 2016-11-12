angular.module('starter.services.global',[])
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    //var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    var serverIP = '192.186.100.11:3000';
    var userName;

    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName
    };
  });
