angular.module('starter.services')

  .factory('dbHandler', function ($ionicPlatform, $cordovaSQLite,$q,$ionicLoading, $location) {

  /*var lists = angular.fromJson(window.localStorage['lists'] || []);*/
        var db = null;
        var list;

    function runQuery(query,dataParams,successCb,errorCb)
		{
		  $ionicPlatform.ready(function() {
			    $cordovaSQLite.execute(db, query,dataParams).then(function(res) {
			      successCb(res);
			    }, function (err) {
			      errorCb(err);
			    });
		  }.bind(this));
		};

    function initDB() {
           if(window.cordova)
		  	 {
			  	db = $cordovaSQLite.openDB("teamSky.db");
                $location.path("/lists");
			 }
            else
			 {
                db = window.openDatabase("teamSky.db", '1.0', 'Team Sky DB',  2 * 1024 * 1024);
                $location.path("/lists");
            }
      /*db = $cordovaSQLite.openDB("teamSky.db");*/
       /*var query = "DROP TABLE IF EXISTS tsList";
            runQuery(query,[],function(res) {
          console.log("table dropped ");
        }, function (err) {
          console.log(err);
        });    */

       var query = [ 
        "drop table entry",
           
        "drop table masterItem",
           
       
        
        "CREATE TABLE IF NOT EXISTS list ( listLocalId integer primary key,listName text,listDescription text,listServerId text,listColor text,listOrder integer,lastUpdateDate integer )",

        "CREATE TABLE IF NOT EXISTS listUser (listLocalId integer,contactLocalId integer,contactStatus text,privilage text )",

        "CREATE TABLE IF NOT EXISTS masterItem (itemLocalId integer primary key,itemName text,CategoryLocalId integer,vendorLocalId integer,itemServerId text,itemPriority integer,lastUpdateDate integer)",

        "CREATE TABLE IF NOT EXISTS category (categoryLocalId integer primary key,categoryName text,categoryServerId text)",

        "CREATE TABLE IF NOT EXISTS vendor (vendorLocalId integer primary key,vendorName text,vendorServerId text,lastUpdateDate integer)",

        "CREATE TABLE IF NOT EXISTS entry (entryLocalId integer primary key,listLocalId integer,itemLocalId integer,entryServerId text,quantity real,uom text,retailerLocalId integer,entryCrossedFlag text,lastUpdateDate integer)",

        "CREATE TABLE IF NOT EXISTS retailer (retailerLocalId integer primary key,retailerName text,retailerServerId text,lastUpdateDate integer)",

        "CREATE TABLE IF NOT EXISTS sync (tableName text primary key,lastSyncDate integer)",

        "DROP TABLE IF EXISTS tsList"
           
        

        ];

        for  (var j=0;j<query.length;j++){
          runQuery(query[j],[],function(res) {
          console.log("Statement Run: " + query[j]);
        }, function (err) {
          console.log(err);
        });
        };

        /*runQuery(query,[],function(res) {
          console.log("table created ");
        }, function (err) {
          console.log(err);
        });*/


};





    return {
      initDB:initDB,
      runQuery: runQuery
     
    };
});
