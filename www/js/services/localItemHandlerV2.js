angular.module('starter.services')

  .factory('itemHandler', function ($q, $timeout, dbHandler, $state) {

    var selected = [];
    var items = [];
    var selectedItems = [];
    var checkedItems = [];
    var listId;
    var y;
    var x;
    var z;
    //items = angular.fromJson(window.localStorage['item']||[]);
    y = getAllMasterItem()
      .then(getMasterSuccessCB, getMasterErrorCB);
    console.log('Y: ' + JSON.stringify(y));
    console.log('master Items: ' + JSON.stringify(items));

    /* x = getAllEntry($state.params.listId)
     .then(getEntrySuccessCB,getEntryErrorCB);
     console.log('Entry Items: ' + JSON.stringify(selectedItems));*/

    z = getCheckedItem()
      .then(getCheckedSuccessCB, getCheckedErrorCB);
    console.log('!!!Checked Items: ' + JSON.stringify(checkedItems));

    function getAllMasterItem() {
      var defer = $q.defer();

      global.db.transaction(function (tx) {
        var query = "SELECT i.itemLocalId, i.itemName, c.categoryName FROM category as c INNER JOIN masterItem as i ON c.categoryLocalId = i.categoryLocalId";
        tx.executeSql(query, [], function (tx, res) {
          console.log("localItemHandlerV2.getAllMasterItem query res = " + JSON.stringify(res));
          defer.resolve(res);
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


    function getMasterSuccessCB(response) {

      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          items.push({
            itemLocalId: response.rows.item(i).itemLocalId,
            itemName: response.rows.item(i).itemName,
            categoryName: response.rows.item(i).categoryName
          });
          console.log('Item Handler create item:' + items);
        }
      } else {
        var message = "No master items created till now.";
      }
    }

    function getMasterErrorCB(error) {
      var message = "Some error occurred in fetching Master items";
    }
    ;

    //Get Checked ITems
    function getCheckedItem() {
      var deferred = $q.defer();
      var query = "SELECT i.itemName, i.itemLocalId, e.entryLocalId, e.entryCrossedFlag, e.lastUpdateDate, i.categoryLocalId, e.listLocalId FROM entry AS e INNER JOIN masterItem AS i ON e.itemLocalId = i.itemLocalId WHERE e.listLocalId= ? and e.entryCrossedFlag='1'";
      //var query = "SELECT i.itemLocalId, i.itemName, i.categoryLocalId FROM masterItem ";
      dbHandler.runQuery(query, [$state.params.listId], function (response) {
        //Success Callback
        console.log('Success Check Query ' + response);
        checkedItem = response.rows;
        console.log('checkedItems: ' + JSON.stringify(checkedItem));
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.log('fail Check query ' + error);
        deferred.reject(error);
      });
      console.log('Cheked Deferred Promise: ' + JSON.stringify(deferred.promise));
      return deferred.promise;
    };


    function getCheckedSuccessCB(response) {

      if (response && response.rows && response.rows.length > 0) {

        for (var i = 0; i < response.rows.length; i++) {
          checkedItems.push({
            listLocalId: response.rows.item(i).listLocalId,
            itemLocalId: response.rows.item(i).itemLocalId,
            itemName: response.rows.item(i).itemName,
            entryCrossedFlag: response.rows.item(i).entryCrossedFlag,
            entryLocalId: response.rows.item(i).entryLocalId
          });
          console.log('Item Handler create item:' + checkedItems);
        }
      } else {
        var message = "No Checked items created till now.";
      }
    };

    function getCheckedErrorCB(error) {
      var message = "Some error occurred in fetching Checekd items";
    }
    ;

    items = items.sort(function (a, b) {

      var itemA = a.itemName.toLowerCase();
      var itemB = b.itemName.toLowerCase();

      if (itemA > itemB) return 1;
      if (itemA < itemB) return -1;
      return 0;
    });


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

    function initcap(name) {
      var returnedName = name.substring(0, 1).toUpperCase()
        + name.substring(1, name.length).toLowerCase();
      return returnedName;
    };


    function isItemChecked(listItem) {
      for (var j = 0; j < checkedItems.length; j++) {
        if (checkedItems[j].listLocalId == listItem.listLocalId && checkedItems[j].itemLocalId == listItem.itemLocalId) {
          return true;
        }
      }
      ;
      return false;
    };


    var searchItems = function (searchFilter) {

      console.log('Searching items for ' + searchFilter);
      var deferred = $q.defer();
      var matches = items.filter(function (item) {
        console.log('The item Returned from Search: ' + item.itemName.toLowerCase());
        if (item.itemName.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) return true;
      })

      console.log('items array: ' + JSON.stringify(items));
      $timeout(function () {
        console.log('Matches : ' + JSON.stringify(matches));
        deferred.resolve(matches);

      }, 100);

      return deferred.promise;
    };


    function itemExitInList(selectedItem) {
      for (var j = 0; j < selectedItems.length; j++) {
        if (selectedItems[j].listLocalId == selectedItem.listLocalId && selectedItems[j].itemName.toLowerCase() == selectedItem.itemName.toLowerCase()) {
          return true;
        }
      }
      ;
      return false;
    };


    function addMaserItem(item) {
      //Local Storage
      if (!masterItemExist(item)) {
        items.push(item);
        window.localStorage['item'] = angular.toJson(items);
        console.log('item created');

        //Sqlite
        var deferred = $q.defer();
        var query = "INSERT INTO masterItem (itemLocalId,itemName,categoryLocalId,vendorLocalId,itemServerId,itemPriority,lastUpdateDate) VALUES (?,?,?,?,?,?,?)";
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
    };

    return {
      item: items,
      getAllMasterItem: getAllMasterItem,
      searchItems: searchItems,
      initcap: function (name) {
        return initcap(name);
      },
      getLocalItemId: getLocalItemId,
      AddMasterItem: addMaserItem,

      deleteAll: function () {

        for (var i = 0; i < selectedItems.length; i++) {

          selectedItems.splice(i, 1);
          saveToLocalStorage();
        }
      }
      ,
      categoryName: function (itemName) {
        /*console.log(itemName);*/
        for (var i = 0; i < items.length; i++) {
          if (items[i].itemName == itemName) {
            console.log('Category Name Function: ' + items[i].categoryName);
            return items[i].categoryName;
          }
        }

      }
      ,
      getItemById: function (itemId) {
        for (var i = 0; i < selectedItems.length; i++) {
          if (selectedItems[i].itemLocalId == itemId) {
            return selectedItems[i];
          }
        }
        return undefined;
      }
    };
  });
