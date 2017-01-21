angular.module('starter.services')

  .factory('serverHandlerMasterItem', function ($http, global, $q, dbHandler) {

    //------------------------Global Variable
    var defer = $q.defer();
    var serviceName = "serverHandlerMasterItem";
    var masterItemLocal = [];
    var masterItemLocal1 = {maxItemServerId: "583eb44e7ca6c8d0712a47d5"};

    var masterItemServer = [];
    var masterItemServerId = [];
    var categoryLocalId = 0;
    var categoryName = "";

    var itemLocalId = 0;
    var itemServerId = "";
    var itemName = "";
    var translationLength = 0;


    //------------------------consoleLog
    function consoleLog(text) {
      //return;
      console.log(serviceName + "  =>  " + text);
    };

    //------------------------getcategoryLocalId
    // not used
    function getcategoryLocalId(pCategoryName) {

      consoleLog("pCategoryName " + pCategoryName);

      var query = "select categoryLocalId from category where categoryName=?"

      dbHandler.runQuery(query, [pCategoryName], function (response) {
        console.log("Statement Run: " + query);
        consoleLog("categoryLocalId=>" + JSON.stringify(response.rows[0].categoryLocalId));
        categoryLocalId = response.rows[0].categoryLocalId;
      }, function (error) {
        console.log(error);
      });
    };


    //------------------------deleteMasterItem
    function deleteMasterItem() {
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
    function addMasterItemLocal() {
      consoleLog("Start addMasterItemLocal");

      for (var i = 0; i < masterItemServer.data.length; i++) {

        consoleLog("-------------------------" + i);
        consoleLog("-------------------------" + JSON.stringify(masterItemServer.data[i]));


        itemLocalId = 100 + i;
        itemServerId = JSON.stringify(masterItemServer.data[i]._id);
        itemName = JSON.stringify(masterItemServer.data[i].itemName);
        categoryName = JSON.stringify(masterItemServer.data[i].categoryName);
        translationLength = JSON.stringify(masterItemServer.data[1].translation.length);
        ii = i;
        categoryLocalId = 0;

        // Get Category ID
        consoleLog("itemName,CategoryName =>" + itemName + "," + categoryName);

        var queryc = "select * from category where categoryName=?";

        dbHandler.runQuery(queryc, [categoryName], function (response) {
            consoleLog("Category Statement true" + categoryName);
            consoleLog("ccccccccccccc =>" + JSON.stringify(response.rows));

            //categoryLocalId=response.rows[0].categoryLocalId;
            //consoleLog("categoryLocalId =>"+categoryName+"," + categoryLocalId);

            // Insert masterItem
            // var query = "insert into masterItem (itemLocalId,itemServerId,itemName,categoryLocalId) values (?,?,?,?)"
            // consoleLog("Query => " + query);
            // consoleLog(itemLocalId+","+itemServerId+","+itemName+","+categoryLocalId);


            // dbHandler.runQuery(query,[itemLocalId,itemServerId,itemName,categoryLocalId],
            //
            //   function(response)
            //   {
            //     consoleLog("MasterItem Added =>");
            //     defer.resolve(response);
            //   },
            //   function (error)
            //   {
            //     consoleLog("Statement Erroryyyyyyyyyyyyyyyyyyyyyyyyy");
            //     consoleLog("Error" + JSON.stringify(error));
            //
            //     consoleLog(error);
            //     defer.resolve(error);
            //
            //   });

            // var query2 = "insert into masterItem_tl (itemLocalId,language,itemName) values (?,?,?)"
            // consoleLog("Query => " + query2);
            //
            // for (var j = 0; j < translationLength; j++) {
            //
            //   var transItemName = masterItemServer.data[ii].translation[j].itemName;
            //   var transLang = masterItemServer.data[ii].translation[j].lang;
            //
            //
            //   dbHandler.runQuery(query2, [itemLocalId, transLang, transItemName],
            //
            //     function (response)
            //     {
            //       consoleLog("MasterItem Transaltion Added =>");
            //       defer.resolve(response);
            //
            //     }, function (error)
            //     {
            //       consoleLog("Statement Error");
            //       consoleLog(error);
            //       defer.resolve(error);
            //     });
            // }

            defer.resolve(response);
          },
          function (error) {
            console.log("Get Category Statement Error");
            return defer.promise;
          });


      }

      return defer.promise;

      consoleLog("End addMasterItemLocal");

    };


    //-----------------------------------------
    //------------------------synchCategory
    function synchMasterItem() {

      deleteMasterItem();
      consoleLog("Start synchMasterItem");
      // Start Read Local DB from table category
      consoleLog("Start Read Local DB from table masterItem");
      var query = "SELECT  max(itemServerId)  maxItemServerId   FROM masterItem ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query, [],
        function (localResponse) {

          consoleLog("Statement True");
          masterItemLocal = localResponse.rows;
          consoleLog("Result JSON=> masterItemLocal " + JSON.stringify(masterItemLocal));

          if (masterItemLocal[0].maxItemServerId == null) {
            consoleLog("Comparison True ");
            //masterItemLocal1[0].maxItemServerId="000";
          }
          else {
            consoleLog("Comparison False ");
            masterItemLocal1.maxItemServerId = masterItemLocal[0].maxItemServerId;

          }
          consoleLog("Array.isArray => " + Array.isArray(masterItemLocal1));
          consoleLog("masterItemLocal1  => " + JSON.stringify(masterItemLocal1));


          /*
           for(i=0; i<masterItemLocal.length; i++){
           masterItemServerId.push(masterItemLocal[i].itemServerId);
           }

           consoleLog("Result JSON=> masterItemServerId " + JSON.stringify(masterItemServerId));
           */
          //////////////////////////////
          // Send The local list to server and get the difference
          consoleLog("Start Call Server");

          $http.post(global.serverIP + "/api/items/get", masterItemLocal1)
            .then(function (serverResponse) {
              consoleLog(" Server List Back Correctly");
              consoleLog("true");
              masterItemServer = serverResponse;

              consoleLog(" updateList Response Result => masterItemServer " + JSON.stringify(masterItemServer));

              consoleLog(" End updateList Response Done");


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

      consoleLog("End synchMasterItem");

    };


    return {
//-----------------------------------------
//------------------------synchMasterItem
      synchMasterItem: synchMasterItem


    };
  });


