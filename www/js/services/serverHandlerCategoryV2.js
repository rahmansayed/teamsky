angular.module('starter.services')

  .factory('serverHandlerCategoryV2', function ($http, global, $q, dbHandler) {

      //------------------------Global Variable

      var serviceName = "serverHandlerCategoryV2";
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function addCategoriesLocal(categoriesList) {
        //consoleLog("categoriesList = " + JSON.stringify(categoriesList));

        var defer = $q.defer();

        var query_insert = "insert into category (categoryLocalId,categoryServerId,categoryName) values (?,?,?)";
        var query_tl_insert = "insert into category_tl (categoryLocalId,language,categoryName) values (?,?,?)";


        global.db.transaction(function (tx) {

            for (var i = 0; i < categoriesList.length; i++) {

              var categoryLocalId = 100 + i;
              var categoryServerId = categoriesList[i]._id;
              var categoryName = categoriesList[i].categoryName;

              /*
               consoleLog("categoryServerId = " + categoryServerId);
               consoleLog("categoryName = " + categoryName);
               consoleLog("categoryLocalId = " + categoryLocalId);
               */

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
            defer.reject(error);
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


        var query = "SELECT  max(categoryServerId) as maxCategoryServerId  FROM category ";
        consoleLog("Query => " + query);

        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, result) {
            console.log("Statement True");
            console.log("maxCategoryServerId result.rows = " + JSON.stringify(result.rows));
            console.log("maxCategoryServerId result.rows.item = " + JSON.stringify(result.rows.item));
            console.log("maxCategoryServerId result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
            var maxCategoryServerId;
            console.log("Result JSON=> maxCategoryServerId " + maxCategoryServerId);

            maxCategoryServerId = result.rows.item(0).maxCategoryServerId || '000000000000000000000000';

            console.log("Result JSON=> maxCategoryServerId 2 " + maxCategoryServerId);

            console.log("Start Call Server");

            var data = {
              maxCategoryServerId: maxCategoryServerId
            };

            $http.post(global.serverIP + "/api/categories/get", data)
              .then(function (serverResponse) {
                consoleLog(" Server List Back Correctly");
                consoleLog("true");
                categoryListServer = serverResponse;

//                consoleLog(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));

                consoleLog(" End updateList Response Done");


                addCategoriesLocal(serverResponse.data).then(function (string) {
                  defer.resolve(string);
                }, function (error) {
                  defer.reject(error);
                });

              });
            consoleLog("End Call Server");
            consoleLog("///////////////////////////////////////");
            consoleLog("///////////////////////////////////////");

          }, function (err) {
            consoleLog("syncCtegories error " + JSON.stringify(err));
          });

        });
        consoleLog("End Read Local DB from table category");


        return defer.promise;

        consoleLog("End synchCategory");

      };


      return {
        syncCategories: syncCategories,
        deleteCategories: deleteCategoryLocal
      };
    }
  );


