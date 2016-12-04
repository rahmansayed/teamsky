angular.module('starter.services')



  .factory('serverHandlerMaster', function ($http, global,$q,dbHandler) {

    var defer = $q.defer();
    var serviceName ="serverHandlerMaster";


    //------------------------consoleLog

    function consoleLog(text){
    //return;
     console.log(serviceName+"  =>  "+text);
    };

    //-----------------------------------------
    //------------------------synchCategory
    function synchCategory() {

      consoleLog( "Start synchCategory");

      var query = "select * from category ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(res) {
          consoleLog("Statement True");
          consoleLog("Result => " + JSON.stringify(res));

        }, function (err) {
          console.log(err);
        });
      //////////////////////////////
      consoleLog("Call Server");

      $http.post( global.serverIP + "/api/categories" , "")

        .then(function (response) {
          consoleLog( " updateList Response Result => "+ response);
          //defer.resolve(response.data.listServerId);
          consoleLog(" updateList Response Done" );

        });

      consoleLog("After Call Server");


      return defer.promise;

      consoleLog( "End synchCategory");
    };
    //-----------------------------------------
   //------------------------synchMasterItem
    function synchMasterItem () {

      consoleLog( "Start synchMasterItem");

      var query = "select * from masterItem ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(res) {
          consoleLog("Statement True");
          consoleLog("Result => " + JSON.stringify(res));

        }, function (err) {
          console.log(err);
        });
      ///////////// /////////////////
      consoleLog("Call Server");

      $http.post( global.serverIP + "/api/items" , "")

        .then(function (response) {
          consoleLog( " updateList Response Result => "+ response);
          //defer.resolve(response.data.listServerId);
          consoleLog(" updateList Response Done" );

        });

      consoleLog("After Call Server");


      return defer.promise;


      consoleLog( "End synchMasterItem");
    }


    return {
//-----------------------------------------
//------------------------synchCategory
      synchCategory: synchCategory,
      synchMasterItem:synchMasterItem




    };
  });


