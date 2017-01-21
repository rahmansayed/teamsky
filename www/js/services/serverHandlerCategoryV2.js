angular.module('starter.services')

  .factory('serverHandlerCategoryV2', function ($http, global, $q, dbHandler) {

      //------------------------Global Variable

      var serviceName = "serverHandlerCategoryV2";
      var categoryListLocal = [];
      var categoryListServer = [];
      var categoryServerId = [];

      //------------------------consoleLog
      function consoleLog(text) {
        //return;
        console.log(serviceName + "  =>  " + text);
      };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // this function is used to truncate the categories table
      function deleteCategoryLocal() {
        consoleLog("Start deleteCategoryLocal");

        var defer = $q.defer();
        var query = "delete from category "
        consoleLog("Statement Run: " + query);


        dbHandler.runQuery(query, [], function (res) {
          consoleLog("Delete category Done");
          var query = "delete from category_tl "
          consoleLog("Statement Run: " + query);


          dbHandler.runQuery(query, [], function (res) {
            consoleLog("Delete category_tl Done");
            defer.resolve('All deleted');

          }, function (err) {
            consoleLog(err);
            defer.reject(err);
          });
        }, function (err) {
          consoleLog(err);
          defer.reject(err);
        });


        return defer.promise;
      };

      //------------------------addCategoryLocal
      function addCategoriesLocal(categoriesList) {
        consoleLog("categoriesList = " + JSON.stringify(categoriesList));

        var defer = $q.defer();

        var query_insert = "insert into category (categoryLocalId,categoryServerId,categoryName) values (?,?,?)";
        var query_tl_insert = "insert into category_tl (categoryLocalId,language,categoryName) values (?,?,?)";


        global.db.transaction(function (tx) {

            for (var i = 0; i < categoriesList.length; i++) {

              var categoryLocalId = 100 + i;
              var categoryServerId = categoriesList[i]._id;
              var categoryName = categoriesList[i].categoryName;

              consoleLog("categoryLocalId = " + categoryLocalId);
              consoleLog("categoryServerId = " + categoryServerId);
              consoleLog("categoryName = " + categoryName);

              tx.executeSql(query_insert, [categoryLocalId, categoryServerId, categoryName]);

              for (var j = 0; j < categoriesList[i].translation.length; j++) {

                var transCategoryName = categoriesList[i].translation[j].categoryName;
                var transLang = categoriesList[i].translation[j].lang;

                tx.executeSql(query_tl_insert, [categoryLocalId, transLang, transCategoryName]);
              }
            }
          }, function (error) {
            consoleLog("Statement Error addCategoriesLocal " + error);

            consoleLog(error);
            defer.resolve(error);
          },
          function (response) {
            consoleLog("category Added =>");
            defer.resolve(response);
          });

        consoleLog("End addCategoryLocal");
        return defer.promise;

      }
      ;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncCategories() {

        //deleteCategoryLocal();
        var defer = $q.defer();
        consoleLog("Start syncCategories");
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


        var query = "SELECT  max(categoryServerId) maxCategoryServerId  FROM category ";
        consoleLog("Query => " + query);

        dbHandler.runQuery(query, [],
          function (localResponse) {

            consoleLog("Statement True");
            consoleLog("localResponse.rows = " + JSON.stringify(localResponse.rows));
            var maxCategoryServerId;
            if (!localResponse.rows[0].maxCategoryServerId) {
              maxCategoryServerId = 0;
            } else {
              maxCategoryServerId = localResponse.rows[0].maxCategoryServerId;
            }
            ;

            consoleLog("Result JSON=> maxCategoryServerId " + maxCategoryServerId);

            consoleLog("Start Call Server");

            var data = {
              maxCategoryServerId: maxCategoryServerId
            };

            $http.post(global.serverIP + "/api/categories/get", data)
              .then(function (serverResponse) {
                consoleLog(" Server List Back Correctly");
                consoleLog("true");
                categoryListServer = serverResponse;

                consoleLog(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));

                consoleLog(" End updateList Response Done");


                addCategoriesLocal(serverResponse.data);

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

        consoleLog("End synchCategory");

      };


      return {
//-----------------------------------------
//------------------------synchCategory
        syncCategories: syncCategories,
        deleteCategories: deleteCategoryLocal


      };
    }
  );

