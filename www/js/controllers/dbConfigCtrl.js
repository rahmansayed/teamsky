angular.module('starter.controllers')
  .controller('dbConfigCtrl', function ($scope,$ionicPlatform, $ionicLoading, $location, $ionicHistory, $cordovaSQLite,dbHandler,userVerify,$ionicLoading,$timeout,$q) {


    console.log ('db Config Fired!!');
    var deviceLocalId = '966530572215';
    dbHandler.initDB(deviceLocalId);
    dbHandler.runQuery();
    
    
    $ionicLoading.show({
    template: '<ion-spinner icon="spiral" class="spinner-positive"></ion-spinner> <br>Loading...',
    noBackdrop: true,
    animation: 'fade-in'
  });
    
  
       
     userVerify.getUserInfo()
      
      .then(function(result){
      $scope.users = userVerify.selectedUser();
      console.log('aalatief: Ionic Load success:'+JSON.stringify($scope.users));
      
         if (userVerify.isUserVerified(deviceLocalId)){
        $ionicLoading.hide();
        $location.path("/lists");
      }
         else
             {
                $ionicLoading.hide();
                 $location.path("/subscribe");
                 
             }
              
  }, function(error) {
    // error handling here
    $ionicLoading.hide()
    console.log('aalatief: Ionic Load Fail:'+JSON.stringify(error));;
    $ionicLoading.show({
      template: "unable to connect",
      noBackdrop: true
    });
    $timeout(function() {
       $ionicLoading.hide();
    }, 2000);
  });
                       
    
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
