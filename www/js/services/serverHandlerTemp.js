angular.module('starter.services')



  .factory('serverHandlerTemp', function ($http, global,$q,dbHandler) {

    var defer = $q.defer();
    var serviceName ="serverHandlerTemp";


    //------------------------consoleLog

    function consoleLog(text){
    //return;
     console.log(serviceName+"  =>  "+text);
    };
    //-----------------------------------------
    //------------------------tempDataCategory
    function tempDataCategory(){

      var query = "delete from category "

      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Statement Run: " + query);
      }, function (err) {
        consoleLog(err);
      });

      var query = "insert into category (categoryLocalId,categoryName) values (?,?)"

       for  (var j=1;j<20;j++) {

         dbHandler.runQuery(query, [10+j, 'category => '+j], function (res) {
           consoleLog("Statement Run: " + query);
         }, function (err) {
           consoleLog(err);
         });
       }

    };

//-----------------------------------------
    //------------------------tempDataMasterItem
    function tempDataMasterItem(){


      var query = "delete from masterItem "

      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Statement Run: " + query);
      }, function (err) {
        consoleLog(err);
      });

      var query = "insert into masterItem (itemLocalId,itemName) values (?,?)"

      for  (var j=1;j<20;j++) {

        dbHandler.runQuery(query, [10+j, 'masterItem => '+j], function (res) {
          consoleLog("Statement Run: " + query);
        }, function (err) {
          consoleLog(err);
        });
      }


    };


    return {
//-----------------------------------------
//------------------------synchCategory
      tempDataCategory:tempDataCategory,
      tempDataMasterItem:tempDataMasterItem




    };
  });


