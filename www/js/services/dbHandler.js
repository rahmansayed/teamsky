angular.module('starter.services')

  .factory('dbHandler', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, global, localUOMHandlerV2) {

    /*var lists = angular.fromJson(window.localStorage['lists'] || []);*/

    var list;

    function runQuery(query, dataParams, successCb, errorCb) {
      $ionicPlatform.ready(function () {
        $cordovaSQLite.execute(global.db, query, dataParams).then(function (res) {
          successCb(res);
        }, function (err) {
          //errorCb(err);
          console.log('Error Query Run!!' + 'Query: ' + query + JSON.stringify(err));
        });
      }.bind(this));
      // console.log('Init Query Run!!');


    };

    function initDB() {
      var deferred = $q.defer();
      console.log('init db called!!');
      /*      if (window.cordova) {
       console.log('11/02/2017 - aalatief - initDb from Device');
       global.db = $cordovaSQLite.openDB({name: "teamSky1_12.db", location: 1, createFromLocation: 1});

       /!*$location.path("/subscribe");*!/

       }
       else {*/
      console.log('11/02/2017 - aalatief - initDb from Browser');
      global.db = window.openDatabase("teamSky1_32.db", '1.0', 'Team Sky DB', 2 * 1024 * 1024);

      /*$location.path("/subscribe");*/
      //}
      /*db = $cordovaSQLite.openDB("teamSky.db");*/
      /*var query = "DROP TABLE IF EXISTS tsList";
       runQuery(query,[],function(res) {
       console.log("table dropped ");
       }, function (err) {
       console.log(err);
       });    */

      /*
       var dropQuery1 = ["select entryCrossedFlag from entry" ];

       runQuery(dropQuery1,[],function(response){
       //Success Callback
       console.log('Table not to be dropped:' + response);
       runQuery("drop table entry",[],x,y);
       //deferred.resolve(response);
       },function(error){
       //Error Callback
       console.log('Table to be dropped: '+error);

       //deferred.reject(error);
       });
       */


      var query = [
        /*"drop table entry",

         "drop table masterItem",*/

        /* "DROP TABLE IF EXISTS category",*/
        /*"DROP TABLE IF EXISTS tsList"*/

        /* "drop table userSetting",  */

        "CREATE TABLE IF NOT EXISTS list ( listLocalId integer primary key,listName text,listDescription text,listServerId text,listColor text,listOrder integer,deleted text,origin text, flag text, newCount integer, deliverCount integer, seenCount integer, crossCount integer, updateCount integer, lastUpdateDate integer,lastUpdateBy text, listOwnerServerId text )",

        "CREATE TABLE IF NOT EXISTS list_tl (listLocalId integer,language text,listName text,lastUpdateDate integer,lastUpdateBy text )",


        "CREATE TABLE IF NOT EXISTS listUser (listLocalId integer,contactLocalId integer,privilage text,lastUpdateDate integer,lastUpdateBy text, deleted text,  flag text, UNIQUE(listLocalId, contactLocalId))",

        "CREATE TABLE IF NOT EXISTS contact (contactLocalId integer primary key,contactName text,phoneNumber text UNIQUE,phoneType text,contactServerId text,contactStatus text,photo text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS masterItem (itemLocalId integer primary key,itemName text,categoryLocalId integer,origin text, flag text,vendorLocalId integer,itemServerId text,itemPriority integer, genericFlag integer, lastUpdateDate integer,lastUpdateBy text )",

        "CREATE TABLE IF NOT EXISTS masterItem_tl(itemLocalId integer,language text,itemName text, lowerItemName text, lastUpdateDate integer,lastUpdateBy text )",

        "CREATE TABLE IF NOT EXISTS category (categoryLocalId integer primary key,categoryName text,categoryServerId text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS category_tl (categoryLocalId text ,language text,categoryName text,lastUpdateDate integer,lastUpdateBy text)",


        "CREATE TABLE IF NOT EXISTS vendor (vendorLocalId integer primary key,vendorName text,vendorServerId text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS vendor_tl (vendorLocalId integer,language text,vendorName text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS entry (entryLocalId integer primary key,listLocalId integer,userServerId text, itemLocalId integer,origin text, flag text, deliveredFlag number, seenFlag number, entryServerId text,quantity real,uom text,retailerLocalId integer,entryCrossedFlag text,deleted text,lastUpdateDate integer,lastUpdateBy text, language text)",

        "CREATE TABLE IF NOT EXISTS retailer (retailerLocalId integer primary key,retailerName text UNIQUE,retailerServerId text,lastUpdateDate integer,lastUpdateBy text, origin text, flag text)",

        "CREATE TABLE IF NOT EXISTS retailer_tl (retailerLocalId integer ,language text,retailerName text,lastUpdateDate integer,lastUpdateBy text, UNIQUE(retailerLocalId, language))",

        "CREATE TABLE IF NOT EXISTS sync (tableName text primary key,lastSyncDate integer)",
        "CREATE TABLE IF NOT EXISTS uoms (uomName text primary key)",

        "CREATE TABLE IF NOT EXISTS userSetting(setting text,value text,lastUpdateDate integer,lastUpdateBy text, UNIQUE(setting))"
      ];


      global.db.transaction(function (tx) {
        for (var j = 0; j < query.length; j++) {
          tx.executeSql(query[j]);
          localUOMHandlerV2.init();
        }
      }, function (error) {
        console.error('dbHandler initDB error = ' + error.message);
        deferred.reject(error);
      }, function () {
        deferred.resolve();
      });

      return deferred.promise;
    };


    return {
      initDB: initDB,
      runQuery: runQuery

    };
  });
