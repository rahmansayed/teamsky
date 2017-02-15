angular.module('starter.services')
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    //var serverIP = 'http://192.168.8.101:3000';
    //var serverIP = 'http://129.0.0.36:3000';
    var userName;
    var userServerId="";
    var deviceServerId="";

    function initialize(){
      global.db.transaction(function(tx){

      });
    };

    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName,
      userServerId: userServerId,
      deviceServerId: deviceServerId,
      initialize : initialize
    };
  });

