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
      function addCategoryLocal(category) {
        console.log("serverHandlerCategoryV2.addCategoriesLocal category = " + JSON.stringify(category));

        var defer = $q.defer();

        var query_insert = "insert into category (categoryLocalId,categoryServerId,categoryName) values (null,?,?)";
        var query_tl_insert = "insert into category_tl (categoryLocalId,language,categoryName) values (?,?,?)";


        global.db.transaction(function (tx) {

            tx.executeSql(query_insert, [category._id, category.categoryName], function (tx, res) {
              for (var j = 0; j < category.translation.length; j++) {

                var transCategoryName = category.translation[j].categoryName;
                var transLang = category.translation[j].lang;

                tx.executeSql(query_tl_insert, [res.insertId, transLang, transCategoryName]);
              }
            }, function (err) {
              defer.reject(err);
            });
          }
          , function (error) {
            consoleLog("Statement Error addCategoriesLocal " + error.message);

            consoleLog(error);
            defer.reject(error);
          },
          function (response) {
            consoleLog("category Added =>");
            defer.resolve(response);
          });

        return defer.promise;

      }
      ;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncCategoriesDownstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();

        var query = "SELECT  max(categoryServerId) as maxCategoryServerId  FROM category ";

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

//                consoleLog(" updateList Response Result => categoryListServer " + JSON.stringify(categoryListServer));

                  consoleLog(" End updateList Response Done");
                  var promises = [];

                  for (var i = 0; i < serverResponse.data.length; i++) {
                    promises.push(addCategoryLocal(serverResponse.data[i]));
                  }
                  $q.all(promises).then(function () {
                    defer.resolve();
                  }, function () {
                    defer.reject();
                  });
                }, function (err) {
                  defer.reject(err);
                });
            }, function (err) {
              consoleLog("syncCtegories error " + JSON.stringify(err));
              defer.reject(err);
            });
          }
        );

        return defer.promise;
      }


      return {
        syncCategoriesDownstream: syncCategoriesDownstream,
        deleteCategories: deleteCategoryLocal
      };
    }
  )
;


