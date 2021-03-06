angular.module('starter.services')

//TODO Move some code to Global area
//TODO SYNCh List
// TODO Unify the function names
//TODO Invited user cannot delete the list


  .factory('dbHelper', function (global, $q, settings) {

      /***********************************************************************************************************************
       *
       * @param items
       */

      function getItemslocalIds(items) {
        console.log("dbHelper getItemslocalIds " + angular.toJson(items));
        var itemsRet = [];
        var defer = $q.defer();
        var query = "select mi.itemServerId,  mi.itemLocalId, mtl.itemName, ctl.categoryName, mtl.language itemLang, ctl.language catLang" +
          " from masterItem mi, masterItem_tl mtl, category c, category_tl  ctl " +
          " where mi.itemLocalId = mtl.itemLocalId " +
          " and mi.categoryLocalId = c.categoryLocalId " +
          " and ctl.categoryLocalId = c.categoryLocalId " +
          " and mi.itemServerId in ( ";
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
              itemsRet.push(result.rows.item(i));
            }
            console.log('dbHelper getItemslocalIds itemsRet ' + angular.toJson(itemsRet));
            defer.resolve(itemsRet);
          }, function (err) {
            console.error('dbHelper getItemslocalIds error ' + err.message);
            defer.reject();
          });
        }, function (err) {
          console.error('dbHelper getItemslocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getItemslocalIds DONE');
        });
        return defer.promise;
      }

      function getListsLocalIds(lists, entries) {
        console.log("dbHelper getListsLocalIds " + angular.toJson(lists));
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
              var cnt = 0;

              for (var k = 0; k < entries.length; k++) {
                if (entries[k].listServerId == result.rows.item(i).listServerId) {
                  cnt++;
                }
              }

              listsRet.push({
                listServerId: result.rows.item(i).listServerId,
                listLocalId: result.rows.item(i).listLocalId,
                cnt: cnt
              })
            }
            console.log('dbHelper getListsLocalIds listRet ' + angular.toJson(listsRet));
            defer.resolve(listsRet);
          }, function (err) {
            console.error('dbHelper getListsLocalIds error ' + err.message);
            defer.reject();
          });
        }, function (err) {
          console.error('dbHelper getListsLocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getListsLocalIds DONE');
        });
        return defer.promise;
      }

      function getRetailersLocalIds(retailers) {
        console.log("dbHelper getRetailersLocalIds " + angular.toJson(retailers));
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
                retailerLocalId: result.rows.item(i).retailerLocalId,
                retailerName: result.rows.item(i).retailerName
              })
            }
            console.log('dbHelper getRetailersLocalIds retailerRet ' + angular.toJson(retailersRet));
            defer.resolve(retailersRet);
          }, function (err) {
            console.error('dbHelper getRetailersLocalIds error ' + err.message);
            defer.reject();
          });
        }, function (err) {
          console.error('dbHelper getRetailersLocalIds error ' + err.message);
          defer.reject();
        }, function () {
          console.log('dbHelper getRetailersLocalIds DONE');
        });
        return defer.promise;
      }

      function buildLocalIds(entries) {
        var result = {};
        var items = [];
        var retailers = [];
        var lists = [];

        for (var i = 0; i < entries.length; i++) {
          lists.push(entries[i].entryServerId.listServerId);
          if (entries[i].entryServerId.userItemServerId) {
            items.push(entries[i].entryServerId.userItemServerId);
          }
          else {
            items.push(entries[i].entryServerId.itemServerId);
          }
          if (entries[i].entryServerId.retailerServerId)
            retailers.push(entries[i].entryServerId.retailerServerId);
          else if (entries[i].entryServerId.userRetailerServerId) {
            retailers.push(entries[i].entryServerId.userRetailerServerId);
          }
        }

        return $q.all({
          retailers: getRetailersLocalIds(retailers),
          lists: getListsLocalIds(lists, entries),
          items: getItemslocalIds(items)
        });
      }

          function buildLocalIds2(entries) {
        var result = {};
        var items = [];
        var retailers = [];
        var lists = [];

        for (var i = 0; i < entries.length; i++) {
          lists.push(entries[i].listServerId);
          if (entries[i].itemServerId) {
            items.push(entries[i].itemServerId);
          }
          else {
            items.push(entries[i].itemServerId);
          }
          if (entries[i].retailerServerId)
            retailers.push(entries[i].retailerServerId);
          else if (entries[i].retailerServerId) {
            retailers.push(entries[i].retailerServerId);
          }
        }

        return $q.all({
          retailers: getRetailersLocalIds(retailers),
          lists: getListsLocalIds(lists, entries),
          items: getItemslocalIds(items)
        });
      }
    
    
      function insertLocalRetailerDownstream(retailers) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
            // checking if there are items that need to be sync'd
            retailers.forEach(function (retailer) {
              var query = "insert or ignore into retailer " +
                "(retailerLocalId, retailerName, retailerServerId, origin, flag) values" +
                "(null,?, ?, 'O', 'S')";
              tx.executeSql(query, [retailer.retailerName, retailer._id], function (tx, res) {
                var query_tl_insert = "insert or ignore into retailer_tl  (retailerLocalId,language,retailerName) values (?,?,?)";
                tx.executeSql(query_tl_insert, [res.insertId, 'EN', retailer.retailerName]);
                tx.executeSql(query_tl_insert, [res.insertId, 'AR', retailer.retailerName]);
              });
            });
          }
          ,
          function (err) {
            console.error("insertLocalRetailerDownstream error " + angular.toJson(err.message));
            defer.reject(err);
          }
          ,
          function () {
            console.log("insertLocalRetailerDownstream successfully");
            defer.resolve();
          }
        );

        return defer.promise;
      }


      function insertLocalItemsDownstream(items) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          // checking if there are items that need to be sync'd
          var getDefaultCategoryId = "select categoryLocalId from category where categoryName = 'New Items'";
          tx.executeSql(getDefaultCategoryId, [], function (tx, res) {
            items.forEach(function (item) {

              var query = "insert or ignore into masterItem " +
                "(itemLocalId, itemName, categoryLocalId, vendorLocalId, itemServerId, origin, flag, genericFlag, itemPriority) values" +
                "(null,?,?,'',?,'O', 'S', 0,0)";

              tx.executeSql(query, [item.itemName, res.rows.item(0).categoryLocalId, item._id], function (tx, res2) {
                var query_lang = "INSERT INTO masterItem_tl (itemLocalId, language, itemName, lowerItemName) values (?,?,?, ?)";
                tx.executeSql(query_lang, [res2.insertId, 'EN', item.itemName, item.itemName.toLowerCase()]);
                tx.executeSql(query_lang, [res2.insertId, 'AR', item.itemName, item.itemName.toLowerCase()]);
              });
            });
          });
        }, function (err) {
          console.error("insertLocalItemsDownstream error " + angular.toJson(err.message));
          defer.reject(err);
        }, function () {
          console.log("insertLocalItemsDownstream loaded successfully");

          defer.resolve();
        });

        return defer.promise;
      }

      function getLocalIds(entry, localIdsMap) {
        console.log("getLocalIds settings.getSettingValue('language').substr(0, 2).toUpperCase())  = " + settings.getSettingValue('language').substr(0, 2).toUpperCase());
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
            if ((localIdsMap.items[i].itemServerId == entry.itemServerId) &&
              (entry.language == localIdsMap.items[i].itemLang) && (localIdsMap.items[i].catLang == settings.getSettingValue('language').substr(0, 2).toUpperCase())) {
              result.itemLocalId = localIdsMap.items[i].itemLocalId;
              result.itemName = localIdsMap.items[i].itemName;
              result.categoryName = localIdsMap.items[i].categoryName;
              break;
            }
          }
          else {
            if ((localIdsMap.items[i].itemServerId == entry.userItemServerId) &&
              (entry.language == localIdsMap.items[i].itemLang) && (localIdsMap.items[i].catLang == settings.getSettingValue('language').substr(0, 2).toUpperCase())) {
              result.itemLocalId = localIdsMap.items[i].itemLocalId;
              result.itemName = localIdsMap.items[i].itemName;
              result.categoryName = localIdsMap.items[i].categoryName;
              break;
            }
          }
        }

        for (var i = 0; i < localIdsMap.retailers.length; i++) {
          if (entry.retailerServerId) {
            if (localIdsMap.retailers[i].retailerServerId == entry.retailerServerId) {
              result.retailerLocalId = localIdsMap.retailers[i].retailerLocalId;
              result.retailerName = localIdsMap.retailers[i].retailerName;
              break;
            }
          }
          if (entry.userRetailerServerId) {
            if (localIdsMap.retailers[i].retailerServerId == entry.userRetailerServerId) {
              result.retailerLocalId = localIdsMap.retailers[i].retailerLocalId;
              result.retailerName = localIdsMap.retailers[i].retailerName;
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
            console.error("dbHelper.getCategoryLocalIdByName err = " + err.message);
            defer.reject(err);
          });
        return defer.promise;
      };

      function buildCatgegoriesMap(serverResponse) {
        var defer = $q.defer();
        var categoryMap = [];

        var query = "select categoryName, categoryLocalId " +
          " from category c " +
          " where c.categoryName in (";
        for (var i = 0; i < serverResponse.length; i++) {
          query = query + "'" + serverResponse[i].categoryName + "'";
          if (i < serverResponse.length - 1) {
            query = query + ",";
          }
        }
        query = query + ")";
        //console.log("dbHelper.buildCatgegoriesMap query = " + query);
        global.db.transaction(function (tx) {
          tx.executeSql(query, [], function (tx, res) {
            for (var i = 0; i < res.rows.length; i++) {
              categoryMap.push({
                categoryName: res.rows.item(i).categoryName,
                categoryLocalId: res.rows.item(i).categoryLocalId
              });
            }
//            console.log("dbHelper.buildCatgegoriesMap categoryMap = " + angular.toJson(categoryMap));
            defer.resolve(categoryMap);
          }, function (err) {
            console.error("dbHelper.buildCatgegoriesMap err = " + err.message);
            defer.reject(err);
          });
        }, function (err) {
          console.error("dbHelper.buildCatgegoriesMap err = " + err.message);
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

      function getRetailerLocalIdfromMap(retailerServerId, retailerMap) {
        for (var i = 0; i < retailerMap.length; i++) {
          if (retailerServerId) {
            if (retailerMap[i].retailerServerId == retailerServerId) {
              return retailerMap[i];
            }
          }
        }
      }
    
    function getLocalIdFromServerId (serverId,reqReturn){
        var defer = $q.defer();
        var ret = {};
        var query = " ";
        
        console.log('aalatief - getLocalIdFromServerId serverId: '+serverId+'reqReturn'+reqReturn );
        
       switch (reqReturn) {
       case "category":
        query = "select distinct categoryLocalId as localId " +
                    " from category c " +
                    " where c.categoryServerId = ?; ";
        break;
        case "list":
        query = " select l.listlocalid localId "+
                " from list l "+
                " where l.listserverid = ? ; " ;
        break; 
        case "item":
           
         query = "select distinct i.itemlocalid localId " +
                 " from masteritem  i " +
                 " where i.itemserverid = ? ;"  ;
        console.log('aalatief - case Item Entered: ' + query);         
        break;         
        case "retailer":
        query = "select distinct r.retailerlocalid localId " +
        " from retailer r " +
        " where r.retailerserverid = ?; ";     
        break;         
               
       }
        global.db.transaction(function (tx) {
          tx.executeSql(query, [serverId],
          function (tx, res) {
              console.log("dbHelper.getLocalIdFromServerId = " + JSON.stringify(res.rows));
            ret.localId = res.rows.item(0).localId;
            defer.resolve(ret);
          }, function (err) {
            console.error("dbHelper.getLocalIdFromServerId err = " + err.message);
            defer.reject(err);
          });},function(error){
            
            
        })
        return defer.promise;
        
    }


      return {
        getListsLocalIds: getListsLocalIds,
        getRetailersLocalIds: getRetailersLocalIds,
        buildLocalIds: buildLocalIds,
        buildLocalIds2:buildLocalIds2,
        insertLocalItemsDownstream: insertLocalItemsDownstream,
        insertLocalRetailerDownstream: insertLocalRetailerDownstream,
        getLocalIds: getLocalIds,
        getCategoryLocalIdfromMap: getCategoryLocalIdfromMap,
        buildCatgegoriesMap: buildCatgegoriesMap,
        getRetailerLocalIdfromMap: getRetailerLocalIdfromMap,
        getLocalIdFromServerId: getLocalIdFromServerId  
      }
    }
  )
;
