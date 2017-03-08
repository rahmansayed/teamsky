angular.module('starter.services')

  .factory('localItemHandlerV2', function ($q, $timeout, dbHandler, $state, global) {

      var selected = [];
      var items = [];
      var selectedItems = [];
      var checkedItems = [];
      var listId;
      var y;
      var x;
      var z;


      /*Get All Master items and push on items Array*/
      function getAllMasterItem() {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "SELECT i.itemLocalId, itl.itemName, lower(itl.itemName) lowerItemName , c.categoryName , itl.language " +
            " FROM (category as c INNER JOIN masterItem as i ON c.categoryLocalId = i.categoryLocalId) INNER JOIN masterItem_tl as itl ON itl.itemlocalId = i.itemlocalId " +
            " order by i.itemPriority desc";
          tx.executeSql(query, [], function (tx, res) {
            console.log("localItemHandlerV2.getAllMasterItem query res = " + JSON.stringify(res));
            for (var i = 0; i < res.rows.length; i++) {
              items.push(res.rows.item(i));
            }
            defer.resolve(items);

          }, function (err) {
            console.log("localItemHandlerV2.getAllMasterItem query err = " + err.message);
            defer.reject();
          })
        }, function (err) {
          console.log("localItemHandlerV2.getAllMasterItem query err = " + err.message);
          defer.reject();
        }, function () {
        });
        return defer.promise;
      };
      /*-------------------------------------------------------------------------------------*/
      /*Get local item Id*/
      function getLocalItemId(itemName) {
        var defer = $q.defer();

        global.db.transaction(function (tx) {
          var query = "SELECT i.itemLocalId from masterItem as i where i.itemName = ?";
          tx.executeSql(query, [itemName], function (tx, res) {
              console.log("localItemHandlerV2.getLocalItemId query res = " + JSON.stringify(res));
              defer.resolve(res.rows.item(0).itemLocalId);
            }, function (err) {
              console.log("localItemHandlerV2.getLocalItemId query err = " + err.message);
            }
          )
        }, function (err) {
          console.log("localItemHandlerV2.getLocalItemId query err = " + err.message);
        }, function () {

        });

        return defer.promise;
      };
      /*-------------------------------------------------------------------------------------*/
      /*Sort Items array*/
      items = items.sort(function (a, b) {

        var itemA = a.itemName.toLowerCase();
        var itemB = b.itemName.toLowerCase();

        if (itemA > itemB) return 1;
        if (itemA < itemB) return -1;
        return 0;
      });
      /*-------------------------------------------------------------------------------------*/
      /*Check if Master Item already exists*/
      function masterItemExist(Item) {
        //localStorage
        for (var i = 0; i < items.length; i++) {
          if (items[i].itemName.toLowerCase() == Item.itemName.toLowerCase()) {
            return true;
          }
        }
        ;
        return false;
      };
      /*-------------------------------------------------------------------------------------*/
      /*Convert string into init capital*/
      function initcap(name) {
        var returnedName = name.substring(0, 1).toUpperCase()
          + name.substring(1, name.length).toLowerCase();
        return returnedName;
      };

      /*-------------------------------------------------------------------------------------*/
      /*Search Item Function*/
      var searchItems = function (searchFilter) {
          //console.log('searchItems searchFilter = ' + searchFilter);

          var deferred = $q.defer();
          var words = searchFilter.toLowerCase().split(" ");
          var matches = [];
          for (var j = 0; j < items.length; j++) {
            var match = true;
            for (var i = 0; i < words.length; i++) {
              if (items[j].lowerItemName.indexOf(words[i]) == -1) {
                match = false;
                break;
              }
            }
            if (match) {
              matches.push(items[j]);
            }
          }

          /*       console.log('items array: ' + JSON.stringify(items));*/
          /*      $timeout( function(){*/
          /*console.log('Matches : ' + JSON.stringify(matches));*/
          deferred.resolve(matches);

          /*       }, 1);*/

          return deferred.promise;
        }
        ;
      /*-------------------------------------------------------------------------------------*/
      /*Add New Master Item*/
      function addMaserItem(item) {

        var deferred = $q.defer();

        if (!masterItemExist(item)) {

          item.language = 'EN';
          console.log('addMaserItem item = ' + JSON.stringify(item));
          items.push(item);

          global.db.transaction(function (tx) {
            var query_item = "INSERT INTO masterItem " +
              "(itemLocalId,itemName,categoryLocalId,vendorLocalId,itemServerId,itemPriority,lastUpdateDate, origin, flag) " +
              "VALUES (?,?,?,?,?,?,?, 'L', 'N')";
            tx.executeSql(query_item, [null/*item.itemLocalId*/, item.itemName, 1, '', '', '', new Date().getTime()], function (tx, res) {
              var query_lang = "INSERT INTO masterItem_tl (itemLocalId, language, itemName) values (?,?,?)";
              tx.executeSql(query_lang, [res.insertId, 'EN', item.itemName], function (tx, res2) {
                deferred.resolve(res.insertId);
              }, function (err) {
                console.log('addMaserItem = error' + error);
                deferred.reject(error);
              });
            }, function (err) {
              console.log('addMaserItem = error' + error);
              deferred.reject(error);
            });
          });

        }
        return deferred.promise;
      };
      /*-------------------------------------------------------------------------------------*/
      /*Get Category Name*/
      function categoryName(itemName) {
        /*console.log(itemName);*/
        for (var i = 0; i < items.length; i++) {
          if (items[i].itemName == itemName) {
            console.log('Category Name Function: ' + items[i].categoryName);
            return items[i].categoryName;
          }
        }

      };
      /*-------------------------------------------------------------------------------------*/
      return {
        searchItems: searchItems,
        categoryName: categoryName,
        initcap: initcap,
        addMasterItem: addMaserItem,
        getAllMasterItem: getAllMasterItem
      };
    }
  );
