angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('dbHelper', function (global, $q) {


      function getItemslocalIds(items) {
        console.log("dbHelper getItemslocalIds " + JSON.stringify(items));
        var itemsRet = [];
        var defer = $q.defer();
        var query = "select * from masterItem where itemServerId in ( ";
        for (var i = 0; i < items.length; i++) {
          query = query + "'" + items[i] + "'";
          if (i != items.length - 1)
            query = query + ",";
        }

        query = query + ")";
        console.log('dbHelper getItemslocalIds query = ' + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
              itemsRet.push({
                itemServerId: result.rows.item(i).itemServerId,
                itemLocalId: result.rows.item(i).itemLocalId
              })
            }
            console.log('dbHelper getItemslocalIds itemsRet ' + JSON.stringify(itemsRet));
            defer.resolve(itemsRet);
          }, function (err) {
            console.log('dbHelper getItemslocalIds error ' + err.message);
          });
        }, function (err) {
          console.log('dbHelper getItemslocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getItemslocalIds DONE');
        })
        return defer.promise;
      }

      function getListsLocalIds(lists) {
        console.log("dbHelper getListsLocalIds " + JSON.stringify(lists));
        var listsRet = [];
        var defer = $q.defer();
        var query = "select * from list where listServerId in ( ";
        for (var i = 0; i < lists.length; i++) {
          query = query + "'" + lists[i] + "'";
          if (i != lists.length - 1)
            query = query + ",";
        }

        query = query + ")";
        console.log('dbHelper getListsLocalIds query = ' + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
              listsRet.push({
                listServerId: result.rows.item(i).listServerId,
                listLocalId: result.rows.item(i).listLocalId
              })
            }
            console.log('dbHelper getListsLocalIds listRet ' + JSON.stringify(listsRet));
            defer.resolve(listsRet);
          }, function (err) {
            console.log('dbHelper getListsLocalIds error ' + err.message);
          });
        }, function (err) {
          console.log('dbHelper getListsLocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getListsLocalIds DONE');
        })
        return defer.promise;
      }

      function getRetailersLocalIds(retailers) {
        console.log("dbHelper getListsLocalIds " + JSON.stringify(retailers));
        var retailersRet = [];
        var defer = $q.defer();
        var query = "select * from retailer where retailerServerId in ( ";
        for (var i = 0; i < retailers.length; i++) {
          query = query + "'" + retailers[i] + "'";
          if (i != retailers.length - 1)
            query = query + ",";
        }

        query = query + ")";
        console.log('dbHelper getRetailersLocalIds query = ' + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
              retailersRet.push({
                retailerServerId: result.rows.item(i).retailerServerId,
                retailerLocalId: result.rows.item(i).retailerLocalId
              })
            }
            console.log('dbHelper getRetailersLocalIds retailerRet ' + JSON.stringify(retailersRet));
            defer.resolve(retailersRet);
          }, function (err) {
            console.log('dbHelper getRetailersLocalIds error ' + err.message);
          });
        }, function (err) {
          console.log('dbHelper getRetailersLocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getRetailersLocalIds DONE');
        })
        return defer.promise;
      }

      function buildLocalIds(entries) {
        var result = {};
        var items = [];
        var retailers = [];
        var lists = [];

        for (var i = 0; i < entries.length; i++) {
          lists.push(entries[i].listServerId);
          if (entries[i].userItemServerId) {
            items.push(entries[i].userItemServerId);
          }
          else {
            items.push(entries[i].itemServerId);
          }
          if (entries[i].retailerServerId)
            retailers.push(entries[i].retailerServerId);
        }

        return $q.all({
          retailers: getRetailersLocalIds(retailers),
          lists: getListsLocalIds(lists),
          items: getItemslocalIds(items)
        });
      }

      function insertLocalItemsDownstream(items) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          // checking if there are items that need to be sync'd
          for (var i = 0; i < items.length; i++) {
            var query = "insert into masterItem " +
              "(itemLocalId, itemName, categoryLocalId, vendorLocalId, itemServerId, lastUpdateBy) values" +
              "(null,?,1,'',?,'O')";

            tx.executeSql(query, [items[i].itemName, items[i]._id]);
          }
        }, function (err) {
          console.log("dbHelper items error " + JSON.stringify(err.message));
          defer.reject(err);
        }, function () {
          defer.resolve();
          console.log("dbHelper items loaded successfully");
        });

        return defer.promise;
      }

      function getLocalIds(entry, localIdsMap) {
        var result = {};

        for (var i = 0; i < localIdsMap.lists.length; i++) {
          if (localIdsMap.lists[i].listServerId == entry.listServerId) {
            result.listLocalId = localIdsMap.lists[i].listLocalId;
            break;
          }
        }
        ;

        for (var i = 0; i < localIdsMap.items.length; i++) {
          if (entry.itemServerId) {
            if (localIdsMap.items[i].itemServerId == entry.itemServerId) {
              result.itemLocalId = localIdsMap.items[i].itemLocalId;
              break;
            }
          }
          else {
            if (localIdsMap.items[i].itemServerId == entry.userItemServerId) {
              result.itemLocalId = localIdsMap.items[i].itemLocalId;
              break;
            }
          }
        }

        for (var i = 0; i < localIdsMap.retailers.length; i++) {
          if (entry.retailerServerId) {
            if (localIdsMap.retailers[i].retailerServerId == entry.retailerServerId) {
              result.retailerLocalId = localIdsMap.retailers[i].retailerLocalId;
              break;
            }
          }
        }
        return result;
      }

      function getCategoryLocalIdByName(tx, categoryName) {
        var ret = {};
        var defer = $q.defer();

        ret.tx = tx;
        tx.executeSql("select categoryLocalId from category where categoryName = ?", [categoryName],
          function (tx, res) {
            ret.categoryLocalId = res.rows.item(0).categoryLocalId;
            defer.resolve(ret);
          }, function (err) {
            defer.reject(err);
          });
        return defer.promise;
      };

      function buildCatgegoriesMap(serverResponse) {
        var defer = $q.defer();
        var categoryMap = [];

        var query = "select categoryName, categoryLocalId from category where categoryName in (";
        for (var i = 0; i < serverResponse.length; i++) {
          query = query + "'" + serverResponse[i].categoryName + "'";
          if (i < serverResponse.length - 1) {
            query = query + ",";
          }
        }
        query = query + ")";
        console.log("dbHelper.buildCatgegoriesMap query = " + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
            for (var i = 0; i < res.rows.length; i++) {
              categoryMap.push({
                categoryName: res.rows.item(i).categoryName,
                categoryLocalId: res.rows.item(i).categoryLocalId
              });
            }
            console.log("dbHelper.buildCatgegoriesMap categoryMap = " + JSON.stringify(categoryMap));
            defer.resolve(categoryMap);
          }, function (err) {
            defer.reject(err);
            console.log("dbHelper.buildCatgegoriesMap err = " + err.message);
          });
        }, function (err) {
          defer.reject(err);
        }, function () {
          defer.resolve();
        });
        return defer.promise;
      }

      function getCategoryLocalIdfromMap(categoryName, categoryMap) {
        for (var i = 0; i < categoryMap.length; i++) {
          if (categoryName) {
            if (categoryMap[i].categoryName == categoryName) {
              return categoryMap[i].categoryLocalId;
            }
          }
        }
      }

      return {
        getItemslocalIds: getItemslocalIds,
        getListsLocalIds: getListsLocalIds,
        getRetailersLocalIds: getRetailersLocalIds,
        buildLocalIds: buildLocalIds,
        insertLocalItemsDownstream: insertLocalItemsDownstream,
        getLocalIds: getLocalIds,
        getCategoryLocalIdfromMap: getCategoryLocalIdfromMap,
        buildCatgegoriesMap: buildCatgegoriesMap
      }
    }
  )
;