angular.module('starter.services')

  .factory('serverHandlerCategory', function ($http, global,$q,dbHandler) {

    //------------------------Global Variable
    var defer = $q.defer();
    var serviceName ="serverHandlerCategory";
    var categoryListLocal =[];
    var categoryListServer =[];
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
        consoleLog("Delete category Done");

      }, function (err) {
        consoleLog(err);
      });



      var query = "delete from category_tl "
      consoleLog("Statement Run: " + query);


      dbHandler.runQuery(query, [], function (res) {
        consoleLog("Delete category_tl Done");

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



      for (var i = 0; i < categoryListServer.data.length; i++) {

        var   categoryLocalId   =100+i;
        var   categoryServerId  =categoryListServer.data[i]._id;
        var   categoryName      =categoryListServer.data[i].categoryName;
        var   translationLength = categoryListServer.data[1].translation.length;



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

          var   transCategoryName =categoryListServer.data[i].translation[j].categoryName;
          var   transLang         =categoryListServer.data[i].translation[j].lang;


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
      /*var query = "SELECT  max(categoryServerId) maxItemServerId  FROM category ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],function(res) {
        consoleLog("Statement true");
        consoleLog("Result JSON=> categoryServerId " + JSON.stringify(res.rows));
        categoryListLocal = res.rows;
        consoleLog("Result JSON=> nnnnnnnnn " + JSON.stringify(categoryListLocal));

      }, function (err) {
        consoleLog(err);
         });
*/



      var query = "SELECT  max(categoryServerId) maxItemServerId  FROM category ";
      consoleLog("Query => " + query);

      dbHandler.runQuery(query,[],
        function(localResponse) {

          consoleLog("Statement True");
          categoryListLocal = localResponse.rows;
          consoleLog("Result JSON=> categoryServerId " + JSON.stringify(categoryListLocal));


          for(i=0; i<categoryListLocal.length; i++){
            categoryServerId.push(categoryListLocal[i].categoryServerId);
          }


          consoleLog("Result JSON=> categoryServerId " + JSON.stringify(categoryServerId));

          //////////////////////////////
          // Send The local list to server and get the difference
          consoleLog("Start Call Server");

          $http.post( global.serverIP + "/api/categories" ,categoryServerId)
            .then(function (serverResponse) {
              consoleLog(" Server List Back Correctly" );
              consoleLog("true" );
              categoryListServer = serverResponse;

              consoleLog( " updateList Response Result => categoryListServer "+ JSON.stringify(categoryListServer));

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


    return {
//-----------------------------------------
//------------------------synchCategory
      synchCategory: synchCategory,


    };
  });


