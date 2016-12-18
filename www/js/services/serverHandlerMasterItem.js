angular.module('starter.services')

  .factory('serverHandlerMasterItem', function ($http, global,$q,dbHandler) {

    //------------------------Global Variable
    var defer = $q.defer();
    var serviceName ="serverHandlerMasterItem";
    var masterItemLocal =[];
    var masterItemServer =[];
    var masterItemServerId = [];

    //------------------------consoleLog
    function consoleLog(text){
      //return;
      console.log(serviceName+"  =>  "+text);
    };

    //------------------------deleteMasterItem
    function deleteMasterItem(){
      consoleLog("Start deleteMasterItem");

      var query = "delete from masterItem "
      consoleLog("Statement Run: " + query);


      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Delete masterItem Done");

      }, function (err) {
        consoleLog(err);
      });



      var query = "delete from masterItem_tl"
      consoleLog("Statement Run: " + query);


      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Delete masterItem_tl Done");

      }, function (err) {
        consoleLog(err);
      });



      consoleLog("End deleteMasterItem");
    };

    //------------------------addMasterItemLocal
    function addMasterItemLocal(){
      consoleLog("Start addMasterItemLocal");

      var query = "insert into masterItem (itemLocalId,itemServerId,itemName,categoryLocalId) values (?,?,?,?)"
      consoleLog("Query => " + query);



      for (var i = 0; i < masterItemServer.data.length; i++) {

        var   itemLocalId   =100+i;
        var   itemServerId  =masterItemServer.data[i]._id;
        var   itemName      =masterItemServer.data[i].itemName;
        //var   categoryName      =masterItemServer.data[i].categoryName;
        var   translationLength = masterItemServer.data[1].translation.length;



        dbHandler.runQuery(query,[itemLocalId,itemServerId,itemName,100],

          function(response) {
            consoleLog("MasterItem Added =>");
            defer.resolve(response);
          }, function (error) {
            consoleLog("Statement Error");

            consoleLog(error);
            defer.resolve(error);
          });



        var query2 = "insert into masterItem_tl (itemLocalId,language,itemName) values (?,?,?)"
        consoleLog("Query => " + query2);

        for (var j = 0; j < translationLength; j++) {

          var   transItemName =masterItemServer.data[i].translation[j].itemName;
          var   transLang         =masterItemServer.data[i].translation[j].lang;


          dbHandler.runQuery(query2,[itemLocalId,transLang,transItemName],

            function(response) {
              consoleLog("MasterItem Transaltion Added =>");
              defer.resolve(response);

            }, function (error) {
              consoleLog("Statement Error");

              consoleLog(error);
              defer.resolve(error);
            });

        }




      }

      consoleLog("End addMasterItemLocal");

    };






    //-----------------------------------------
    //------------------------synchCategory
    function synchMasterItem() {

      deleteMasterItem();
      consoleLog( "Start synchMasterItem");
      // Start Read Local DB from table category
      consoleLog("Start Read Local DB from table masterItem");
      var query = "SELECT  *  FROM masterItem ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(localResponse) {

          consoleLog("Statement True");
          masterItemLocal = localResponse.rows;
          consoleLog("Result JSON=> masterItemLocal " + JSON.stringify(masterItemLocal));


          for(i=0; i<masterItemLocal.length; i++){
            masterItemServerId.push(masterItemLocal[i].itemServerId);
          }

         consoleLog("Result JSON=> masterItemServerId " + JSON.stringify(masterItemServerId));

          //////////////////////////////
          // Send The local list to server and get the difference
          consoleLog("Start Call Server");

          $http.post( global.serverIP + "/api/items" ,masterItemServerId)
            .then(function (serverResponse) {
              consoleLog(" Server List Back Correctly" );
              consoleLog("true" );
              masterItemServer = serverResponse;

              consoleLog( " updateList Response Result => categoryListServer "+ JSON.stringify(masterItemServer));

              consoleLog(" End updateList Response Done" );


              addMasterItemLocal();

            });
          consoleLog("End Call Server");
          consoleLog("///////////////////////////////////////");
          consoleLog("///////////////////////////////////////");


          defer.resolve(localResponse);
        }, function (error) {
          consoleLog(error);
          defer.resolve(error);
        });





      return defer.promise;

      consoleLog( "End synchMasterItem");

    };


    return {
//-----------------------------------------
//------------------------synchMasterItem
      synchMasterItem: synchMasterItem,


    };
  });


