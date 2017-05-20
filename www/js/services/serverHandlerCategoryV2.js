angular.module('starter.services')

  .factory('serverHandlerCategoryV2', function ($http, global, $q, dbHandler) {
      // this function is used to truncate the categories table
      function deleteCategoryLocal() {
        console.log("Start deleteCategoryLocal");

        var defer = $q.defer();
        var query = "delete from category ";
        console.log("Statement Run: " + query);


        dbHandler.runQuery(query, [], function (res) {
          console.log("Delete category Done");
          var query = "delete from category_tl ";
          console.log("Statement Run: " + query);


          dbHandler.runQuery(query, [], function (res) {
            console.log("Delete category_tl Done");
            defer.resolve('All deleted');

          }, function (err) {
            console.log(err);
            defer.reject(err);
          });
        }, function (err) {
          console.log(err);
          defer.reject(err);
        });


        return defer.promise;
      };

      function addCategoryTranslation(categoryLocalId, translation) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query_tl_insert = "insert into category_tl (categoryLocalId,language,categoryName) values (?,?,?)";
          for (var j = 0; j < translation.length; j++) {
            var transCategoryName = translation[j].name;
            var transLang = translation[j].lang;

            tx.executeSql(query_tl_insert, [categoryLocalId, transLang, transCategoryName]);
          }
        }, function (err) {
          console.error("addCategoryTranslation db err = " + err.message);
          defer.reject();
        }, function () {
          //console.log("addCategoryTranslation db success");
          defer.resolve();
        });
        return defer.promise;
      }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function addCategoryLocal(category) {
        console.log("addCategoriesLocal category = " + JSON.stringify(category));

        var defer = $q.defer();

        var query_insert = "insert into category (categoryLocalId,categoryServerId,categoryName) values (null,?,?)";

        global.db.transaction(function (tx) {

            tx.executeSql(query_insert, [category._id, category.categoryName], function (tx, res) {

              addCategoryTranslation(res.insertId, category.translation).then(function () {
            //    console.log("addCategoriesLocal addCategoryTranslation success ");
                defer.resolve();
              }, function (err) {
                console.error("addCategoriesLocal addCategoryTranslation error " + error.message);
                defer.reject(err);
              });
            }, function (err) {
              console.error("addCategoriesLocal trx error " + error.message);
              defer.reject(err);
            });
          }
          , function (error) {
            console.error("addCategoriesLocal db error" + error.message);
            defer.reject(error);
          },
          function () {
          });

        return defer.promise;
      }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
      function syncCategoriesDownstream() {

        //deleteCategoryLocal();
        var defer = $q.defer();

        var query = "SELECT  max(categoryServerId) as maxCategoryServerId  FROM category ";

        global.db.transaction(function (tx) {
            tx.executeSql(query, [], function (tx, result) {
              console.log("syncCategoriesDownstream maxCategoryServerId result.rows.item(0) = " + JSON.stringify(result.rows.item(0)));
              var maxCategoryServerId;
              maxCategoryServerId = result.rows.item(0).maxCategoryServerId || '000000000000000000000000';
              console.log("syncCategoriesDownstream maxCategoryServerId " + maxCategoryServerId);

              var data = {
                maxCategoryServerId: maxCategoryServerId
              };

              $http.post(global.serverIP + "/api/categories/get", data)
                .then(function (serverResponse) {
                  console.log("syncCategoriesDownstream serverResponse =  " + JSON.stringify(serverResponse));

                  var promises = [];
                  for (var i = 0; i < serverResponse.data.length; i++) {
                    promises.push(addCategoryLocal(serverResponse.data[i]));
                  }
                  $q.all(promises).then(function () {
                    console.log('syncCategoriesDownstream $q success');
                    defer.resolve();
                  }, function () {
                    console.reject('syncCategoriesDownstream $q error');
                    defer.reject();
                  });
                }, function (err) {
                  console.error('syncCategoriesDownstream server err ' + err.message);
                  defer.reject(err);
                });
            }, function (err) {
              console.error("syncCategoriesDownstream error " + JSON.stringify(err));
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


