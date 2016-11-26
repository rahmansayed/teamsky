angular.module('starter.services.dbHandler', [])

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
        
       var query = [ "CREATE TABLE IF NOT EXISTS list ( listLocalId integer primary key,listName text,listDescription text,listServerId text,listColor text,listOrder integer,lastUpdateDate integer )",
        
        "CREATE TABLE IF NOT EXISTS listUser (listLocalId integer,contactLocalId integer,contactStatus text,privilage text )",
                    
        "CREATE TABLE IF NOT EXISTS masterItem (itemLocalId integer primary key,itemName text,itemCategoryId integer,vendorId integer,itemServerId text,itemPriority integer,lastUpdateDate integer)",
        
        "CREATE TABLE IF NOT EXISTS category (categoryLocalId integer primary key,categoryName text,categoryServerId text)",
                    
        "CREATE TABLE IF NOT EXISTS vendor (vendorLocalId integer primary key,vendorName text,vendorServerId text,lastUpdateDate integer)",
        
        "CREATE TABLE IF NOT EXISTS entry (entryLocalId integer primary key,listLocalId integer,itemLocalId integer,entryServerId text,quantity real,uom text,retailerLocalId integer,entryFlag text,lastUpdateDate integer)",
        
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
    
function addNewList(list) {
        
		var deferred = $q.defer();
		var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder) VALUES (?,?,?,?,?,?)";
		runQuery(query,[list.listLocalId,list.listName,list.listDescription,list.listServerId,'',''],function(response){
			//Success Callback
			console.log(response);
			deferred.resolve(response);
		},function(error){
			//Error Callback
			console.log(error);
			deferred.reject(error);
		});

		return deferred.promise;
	};

    function getAllLists(){
        var deferred = $q.defer();
        var query = "SELECT * from tsList";
        runQuery(query,[],function(response){
            //Success Callback
            console.log(response);
            list = response.rows;
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log(error);
            deferred.reject(error);
        });

        return deferred.promise;
    };
    
    function deleteList(id) {
        var deferred = $q.defer();
        var query = "DELETE FROM list WHERE listLocalId = ?";
        runQuery(query,[id],function(response){
            //Success Callback
            console.log(response);
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log(error);
            deferred.reject(error);
        });

        return deferred.promise;
    };
    
    function updateList(list) {
    var deferred = $q.defer();
    var query = "Update list set listName =? , listDescription= ? WHERE listLocalId = ?";
    runQuery(query,[list.listName,list.listDescription,list.listLocalId],function(response){
        //Success Callback
        console.log(response);
        deferred.resolve(response);
    },function(error){
        //Error Callback
        console.log(error);
        deferred.reject(error);
    });

    return deferred.promise;
    };
    


    return {
      initDB:initDB,
      runQuery: runQuery ,
      addNewList:addNewList,
      getAllLists:getAllLists,
      deleteList:deleteList,
      updateList:updateList
    };
});