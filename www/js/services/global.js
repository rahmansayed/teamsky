angular.module('starter.services')
  .factory('global', function () {
    var db = {};
    var settings = new Array();
    var dataKey;
    var serverIP = 'https://secret-savannah-80432.herokuapp.com';
    //var serverIP = 'http://129.0.89.36:4000';
    //var serverIP = 'http://192.168.100.6:4000';
    //var serverIP = 'http://127.0.0.1:4000';
    var userName;
    var userServerId = "";
    var deviceServerId = "";
    var countryCode = "+966";
    var masterItems = new Array();
    var simCountry = '';
    var deviceUUID = "TEST";
    var verificationData = {
      deviceLocalId: '',
      userServerId: '',
      deviceServerId: '',
      vcode: '',
      countryCode: ''
    };

    var currentListEntries = {listOpenEntries: {}, listCrossedEntries: []};
    var currentList = {};
    var lists = {lists: []};

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
      userServerId: userServerId,
      deviceServerId: deviceServerId,
      countryCode: countryCode,
      initialize: initialize,
      verificationData: verificationData,
      masterItems: masterItems,
      deviceUUID: deviceUUID,
      currentListEntries: currentListEntries,
      currentList: currentList,
      simCountry: simCountry,
      lists: lists
    };
  });

