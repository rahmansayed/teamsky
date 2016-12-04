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
			  	db = $cordovaSQLite.openDB("teamSky1_2.db");
                $location.path("/lists");
			 }
            else
			 {
                db = window.openDatabase("teamSky1_2.db", '1.0', 'Team Sky DB',  2 * 1024 * 1024);
                $location.path("/lists");
            }
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

        "CREATE TABLE IF NOT EXISTS list ( listLocalId integer primary key,listName text,listDescription text,listServerId text,listColor text,listOrder integer,lastUpdateDate integer,lastUpdateBy text )",

        "CREATE TABLE IF NOT EXISTS list_tl (listLocalId integer,language text,listName text,lastUpdateDate integer,lastUpdateBy text )",


        "CREATE TABLE IF NOT EXISTS listUser (listLocalId integer,contactLocalId integer,contactStatus text,privilage text,lastUpdateDate integer,lastUpdateBy text  )",

        "CREATE TABLE IF NOT EXISTS masterItem (itemLocalId integer primary key,itemName text,categoryLocalId integer,vendorLocalId integer,itemServerId text,itemPriority integer,lastUpdateDate integer,lastUpdateBy text )",

        "CREATE TABLE IF NOT EXISTS masterItem_tl (itemLocalId integer,language text,itemName text,lastUpdateDate integer,lastUpdateBy text )",

        "CREATE TABLE IF NOT EXISTS category (categoryLocalId integer primary key,categoryName text,categoryServerId text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS category_tl (categoryLocalId text ,language text,categoryName text,lastUpdateDate integer,lastUpdateBy text)",


        "CREATE TABLE IF NOT EXISTS vendor (vendorLocalId integer primary key,vendorName text,vendorServerId text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS vendor_tl (vendorLocalId integer,language text,vendorName text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS entry (entryLocalId integer primary key,listLocalId integer,itemLocalId integer,entryServerId text,quantity real,uom text,retailerLocalId integer,entryCrossedFlag text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS retailer (retailerLocalId integer primary key,retailerName text,retailerServerId text,lastUpdateDate integer,lastUpdateBy text)",

        "CREATE TABLE IF NOT EXISTS retailer_tl (retailerLocalId integer ,language text,retailerName text,lastUpdateDate integer,lastUpdateBy text)",


        "CREATE TABLE IF NOT EXISTS sync (tableName text primary key,lastSyncDate integer)",






        ];


       //  for  (var j=0;j<query.length;j++){
       //    runQuery(query[j],[],function(res) {
       //    console.log("Statement Run: " + query[j]);
       //  }, function (err) {
       //    console.log(err);
       //  });
       //  };
       //  */
       //
       //  var query1 = "insert into category (categoryLocalId,categoryName) values (?,?)"
       // /* var query1 = "delete from masterItem"; */
       //  runQuery(query1,[10,'Uncategorized'],function(res) {
       //    console.log("Statement Run: " + query1);
       //  }, function (err) {
       //    console.log(err);
       //  });


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
