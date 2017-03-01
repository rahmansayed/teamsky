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
        var query = "SELECT i.itemLocalId, i.itemName, c.categoryName FROM category as c INNER JOIN masterItem as i ON c.categoryLocalId = i.categoryLocalId";
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
      /*    console.log('Searching items for ' + searchFilter);

       console.log('25/2/2017 - aalatief - master items' + JSON.stringify(items));*/
      var deferred = $q.defer();
      var matches = items.filter(function (item) {
        /*        console.log('The item Returned from Search: '+item.itemName.toLowerCase());*/
        if (item.itemName.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) return true;
      })

      /*       console.log('items array: ' + JSON.stringify(items));*/
      /*      $timeout( function(){*/
      /*console.log('Matches : ' + JSON.stringify(matches));*/
      deferred.resolve(matches);

      /*       }, 1);*/

      return deferred.promise;
    };
    /*-------------------------------------------------------------------------------------*/
    /*return master items */
    function masterItems() {
      items = [];

      getAllMasterItem()
        .then(function (result) {
            items = result;
            console.log('25/2/2017 - aalatief: Master items: ' + JSON.stringify(result));
          }
          , function (error) {
            console.log('aalatief: List master Item Load Fail:' + JSON.stringify(error));
            ;
          });
      return items;
    };
    /*-------------------------------------------------------------------------------------*/
    /*Add New Master Item*/
    function addMaserItem(item) {

      var deferred = $q.defer();

      if (!masterItemExist(item)) {
        items.push(item);

        var query = "INSERT INTO masterItem " +
          "(itemLocalId,itemName,categoryLocalId,vendorLocalId,itemServerId,itemPriority,lastUpdateDate, origin, flag) " +
          "VALUES (?,?,?,?,?,?,?, 'L', 'N')";
        dbHandler.runQuery(query, [null/*item.itemLocalId*/, item.itemName, 1, '', '', '', new Date().getTime()], function (response) {
          //Success Callback
          console.log('aaltief: Master Item Added: ' + JSON.stringify(response));
          deferred.resolve(response);
        }, function (error) {
          //Error Callback
          console.log(error);
          deferred.reject(error);
        });

        return deferred.promise;
      }
      console.log('Master item exist');
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
      masterItems: masterItems,
      searchItems: searchItems,
      categoryName: categoryName,
      initcap: initcap,
      addMasterItem: addMaserItem,
      getLocalItemId: getLocalItemId,
      getAllMasterItem: getAllMasterItem
    };
  });
