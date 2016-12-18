angular.module('starter.services')

  .factory('serverHandlerMaster', function ($http, global,$q,dbHandler) {

    //------------------------Global Variable
    var defer = $q.defer();
    var serviceName ="serverHandlerMaster";
    var categoryList =[];
    var categoryList2 =[];
    var categoryServerId = [];


    //------------------------consoleLog

    function consoleLog(text){
      //return;
      console.log(serviceName+"  =>  "+text);
    };

    //------------------------deleteCategoryLocal
    function deleteCategoryLocal(){
      consoleLog("Start deleteCategoryLocal");

      var query = "delete from category "
      consoleLog("Statement Run: " + query);


      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Delete Done");

      }, function (err) {
        consoleLog(err);
      });



      var query = "delete from category_tl "
      consoleLog("Statement Run: " + query);


      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Delete Done");

      }, function (err) {
        consoleLog(err);
      });



      consoleLog("End deleteCategoryLocal");
    };

    //------------------------addCategoryLocal
    function addCategoryLocal(){
      consoleLog("Start addCategoryLocal");

      var query = "insert into category (categoryLocalId,categoryServerId,categoryName) values (?,?,?)"
      consoleLog("Query => " + query);



      for (var i = 0; i < categoryList2.data.length; i++) {

        var   categoryLocalId   =100+i;
        var   categoryServerId  =categoryList2.data[i]._id;
        var   categoryName      =categoryList2.data[i].categoryName;
        var   translationLength = categoryList2.data[1].translation.length;



        dbHandler.runQuery(query,[categoryLocalId,categoryServerId,categoryName],

          function(response) {
            consoleLog("category Added =>");
            defer.resolve(response);
          }, function (error) {
            consoleLog("Statement Error");

            consoleLog(error);
            defer.resolve(error);
          });





        var query2 = "insert into category_tl (categoryLocalId,language,categoryName) values (?,?,?)"
        consoleLog("Query => " + query2);

        for (var j = 0; j < translationLength; j++) {

          var   transCategoryName =categoryList2.data[i].translation[j].categoryName;
          var   transLang         =categoryList2.data[i].translation[j].lang;


          dbHandler.runQuery(query2,[categoryLocalId,transLang,transCategoryName],

            function(response) {
              consoleLog("category Transaltion Added =>");
              defer.resolve(response);

            }, function (error) {
              consoleLog("Statement Error");

              consoleLog(error);
              defer.resolve(error);
            });

        }




      }

      consoleLog("End addCategoryLocal");

    };






    //-----------------------------------------
    //------------------------synchCategory
    function synchCategory() {

      //deleteCategoryLocal();
      consoleLog( "Start synchCategory");
      // Start Read Local DB from table category
      consoleLog("Start Read Local DB from table category");
      var query = "SELECT  *  FROM category ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(localResponse) {

          consoleLog("Statement True");
          categoryList = localResponse.rows;
          consoleLog("Result JSON=> categoryServerId " + JSON.stringify(categoryList));


          for(i=0; i<categoryList.length; i++){
            categoryServerId.push(categoryList[i].categoryServerId);
          }


          consoleLog("Result JSON=> categoryServerId " + JSON.stringify(categoryServerId));

          //////////////////////////////
          // Send The local list to server and get the difference
          consoleLog("Start Call Server");

          $http.post( global.serverIP + "/api/categories" ,categoryServerId)
            .then(function (serverResponse) {
              consoleLog(" Server List Back Correctly" );
              consoleLog("true" );
              categoryList2 = serverResponse;

              consoleLog( " updateList Response Result => categoryList2 "+ JSON.stringify(categoryList2));

              consoleLog(" End updateList Response Done" );


              addCategoryLocal();

            });
          consoleLog("End Call Server");
          consoleLog("///////////////////////////////////////");
          consoleLog("///////////////////////////////////////");


          defer.resolve(localResponse);
        }, function (error) {
          consoleLog(error);
          defer.resolve(error);
        });

      consoleLog("End Read Local DB from table category");




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


