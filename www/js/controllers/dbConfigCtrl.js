angular.module('starter.controllers')
  .controller('dbConfigCtrl', function ($scope,$ionicPlatform, $ionicLoading, $location, $ionicHistory, $cordovaSQLite,dbHandler) {


    console.log ('db Config Fired!!');
    dbHandler.initDB();
    /*
    $ionicPlatform.ready(function() {
        $ionicLoading.show({ template: 'Loading...' });
        if(window.cordova) {
            window.plugins.sqlDB.copy("teamSky.db", function() {
                db = $cordovaSQLite.openDB("teamSky.db");
                $location.path("/lists");
                $ionicLoading.hide();
            }, function(error) {
                console.error("There was an error copying the database: " + error);
                db = $cordovaSQLite.openDB("teamSky.db");
                $location.path("/lists");
                $ionicLoading.hide();
            });
        } else {
            console.log ('Browser Test Case Fired!!');
            db = openDatabase("websql.db", '1.0', "Teamsky WebSQL Database", 2 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql("DROP TABLE IF EXISTS tsList");
                tx.executeSql("DROP TABLE IF EXISTS tsItemCategory");
                tx.executeSql("DROP TABLE IF EXISTS tsItem");

                tx.executeSql("CREATE TABLE IF NOT EXISTS tsList (localListId integer primary key, listName text,listDescription text,serverListId integer,listColor text,listOrder integer)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS tsItemCategory (categoryId integer primary key, categoryName text)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS tsItem (ItemId integer primary key, categoryId integer, itemName text)");

                tx.executeSql("CREATE TABLE IF NOT EXISTS ts (id integer primary key, todo_list_id integer, todo_list_item_name text)");
                tx.executeSql("INSERT INTO tsList (listName,listDescription) VALUES (?,?)", ["Pharmacy SQLite","Medicine list - Periodically"]);
                tx.executeSql("INSERT INTO tsItemCategory (categoryName) VALUES (?)", ["Vitamins"]);

                tx.executeSql("INSERT INTO tsItem (categoryId,itemName) VALUES (?,?)", ["10", "Vitamin C"]);
            });
            $location.path("/lists");
            $ionicLoading.hide();
        }
    });*/

});
