angular.module('starter.services')
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    var status = 'foreground';
    var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    //var serverIP = 'http://129.0.90.36:4000';
    //var serverIP = 'http://129.0.90.36:4000';
    //var serverIP = 'http://192.168.100.8:4000';
    //var serverIP = 'http://127.0.0.1:4000';
    var userName;
    var userServerId = 0;
    var deviceServerId = 0;
    var countryCode = "+966";
    var masterItems = new Array();
    var simCountry = '';
    var deviceUUID = "TEST";


    var currentListEntries = {listOpenEntries: {}, listCrossedEntries: []};
    var currentList = {};

    var suggestedItem = {suggested: []};

    function initialize() {
      global.db.transaction(function (tx) {

      });
    };


    return {
      db: db,
      settings: settings,
      dataKey: dataKey,
      serverIP: serverIP,
      userName: userName,
      userServerId: parseInt(userServerId),
      deviceServerId:parseInt(deviceServerId),
      countryCode: countryCode,
      initialize: initialize,
      masterItems: masterItems,
      deviceUUID: deviceUUID,
      currentListEntries: currentListEntries,
      currentList: currentList,
      suggestedItem: suggestedItem,
      simCountry: simCountry,
      status: status
    };
  });

