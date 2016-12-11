angular.module('starter.services')

  .factory('serverHandlerMaster', function ($http, global,$q,dbHandler) {

    //------------------------Global Variable
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

      var query = "SELECT  * FROM category ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(response) {
          consoleLog("Statement True");
          consoleLog("Result => " + response);
          consoleLog("Result JSON=> " + JSON.stringify(response));
          defer.resolve(response);

        }, function (error) {
          consoleLog(error);
          defer.resolve(error);
        });
      //////////////////////////////
  /*    consoleLog("Start Call Server");

      $http.post( global.serverIP + "/api/categories" , "")

        .then(function (response) {
          consoleLog( " updateList Response Result => "+ response);
          //defer.resolve(response.data.listServerId);
          consoleLog(" updateList Response Done" );

        });

      consoleLog("End Call Server");
      //////////////////////////////
      var query = "UPDATE category  SET categoryName=?";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,["categoryName"+10],
        function(response) {
          consoleLog("Statement True");
          consoleLog("Result => " + response);
          consoleLog("Result JSON=> " + JSON.stringify(response));
          defer.resolve(response);

        }, function (error) {
          consoleLog(error);
          defer.resolve(error);
        });
*/

      return defer.promise;

      consoleLog( "End synchCategory");
    };




    //-----------------------------------------
   //------------------------synchMasterItem
    function synchMasterItem () {

      consoleLog( "Start synchMasterItem");

      var query = "SELECT  * FROM masterItem ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(response) {
          consoleLog("Statement True");
          consoleLog("Result => " + JSON.stringify(response));

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


