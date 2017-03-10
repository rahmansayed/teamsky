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
          var query = "SELECT i.itemLocalId, itl.itemName, itl.lowerItemName, c.categoryName , itl.language " +
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

      function isRTL(s) {
        var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
          rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
          rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');

        return rtlDirCheck.test(s);
      };

      /*-------------------------------------------------------------------------------------*/
      /*Search Item Function*/
      var searchItems = function (searchFilter) {
        console.log('searchItems isRTL = ' + isRTL(searchFilter));
        var lang = isRTL(searchFilter) ? 'AR' : 'EN';

        var deferred = $q.defer();
        if (searchFilter.length > 3) {
          console.log('searchItemsDB searchFilter = ' + searchFilter);
          var words = searchFilter.toLowerCase().split(" ");
          var matches = [];
          for (var j = 0; j < items.length; j++) {
            var match = true;
            for (var i = 0; i < words.length; i++) {
              if (items[j].lowerItemName.indexOf(words[i]) == -1 ||
                items[j].language != lang
              ) {
                match = false;
                break;
              }
            }
            if (match) {
              matches.push(items[j]);
            }
          }
          deferred.resolve(matches);
        } else {
          deferred.resolve([]);
        }
        return deferred.promise;
      }

      var searchItemsDB = function (searchFilter) {
        console.log('searchItemsDB isRTL = ' + isRTL(searchFilter));
        var deferred = $q.defer();
        if (searchFilter.length > 3) {
          console.log('searchItemsDB searchFilter = ' + searchFilter);

          var query = "SELECT i.itemLocalId, itl.itemName, itl.lowerItemName , c.categoryName , itl.language " +
            " FROM (category as c INNER JOIN masterItem as i ON c.categoryLocalId = i.categoryLocalId) INNER JOIN masterItem_tl as itl ON itl.itemlocalId = i.itemlocalId " +
            " where ";

          var words = searchFilter.toLowerCase().split(" ").map(function (word) {
            return " (itl.lowerItemName like '%" + word + "%' )"
          });
          for (var i = 0; i < words.length; i++) {
            if (i == 0) {
              query = query + words[i];
            }
            else {
              query = query + 'AND ' + words[i];
            }
          }
          if (isRTL(searchFilter)) {
            query = query + " AND itl.language='AR'"
          } else {
            query = query + " AND itl.language='EN'"
          }
          console.log('searchItemsDB query = ' + query)
          global.db.transaction(function (tx) {
            tx.executeSql(query, [], function (tx, res) {
              var matchedItems = [];
              for (var i = 0; i < res.rows.length; i++) {
                matchedItems.push(res.rows.item(i));
              }
              deferred.resolve(matchedItems);
              console.log('res = ' + JSON.stringify(res));
            }, function (err) {
              console.log('searchItemsDB err = ' + err.message);
            });
          })
        }
        else {
          deferred.resolve([]);
        }

        return deferred.promise;
      }

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
              var query_lang = "INSERT INTO masterItem_tl (itemLocalId, language, itemName, lowerItemName) values (?,?,?)";
              tx.executeSql(query_lang, [res.insertId, 'EN', item.itemName, item.itemName.toLowerCase()], function (tx, res2) {
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
        //searchItems: searchItemsDB,
        categoryName: categoryName,
        initcap: initcap,
        addMasterItem: addMaserItem,
        getAllMasterItem: getAllMasterItem
      };
    }
  );
