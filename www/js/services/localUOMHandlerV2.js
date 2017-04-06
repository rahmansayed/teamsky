angular.module('starter.services')

  .factory('localUOMHandlerV2', function ($q, $state, global) {

      var uoms = [];

      function init() {
        var defer = $q.defer();
        global.db.transaction(function (tx) {

          var query = "INSERT OR IGNORE INTO UOMS(uomName) values (?)";
          var basicUOMList = [
            "Kilogram",
            "Pound",
            "Piece",
            "Each",
            "Litre",
            "Ml"
          ];
          basicUOMList.forEach(function (uom) {
            tx.executeSql(query, [uom]);
          });
        }, function (error) {
          console.error("localUOMHandlerV2 init db error");
          defer.reject();
        }, function () {
          defer.resolve();
        });
        return defer.promise;
      }

      /*Get All Master items and push on items Array*/
      function getAllUOMs() {
        var defer = $q.defer();

        uoms = [];
        global.db.transaction(function (tx) {
          var query = "SELECT uomName from UOMS";
          tx.executeSql(query, [], function (tx, res) {
            //console.log("localUOMHandlerV2.getAllUOMs query res = " + JSON.stringify(res));
            for (var i = 0; i < res.rows.length; i++) {
              uoms.push(res.rows.item(i).uomName);
            }
            console.log("localUOMHandlerV2.getAllUOMs uoms = " + JSON.stringify(uoms));
            defer.resolve(uoms);

          }, function (err) {
            console.log("localUOMHandlerV2.getAllUOMs query err = " + err.message);
            defer.reject();
          })
        }, function (err) {
          console.log("localUOMHandlerV2.getAllUOMs query err = " + err.message);
          defer.reject();
        }, function () {
        });
        return defer.promise;
      };

      function uomExist(uom) {
        //localStorage
        for (var i = 0; i < uoms.length; i++) {
          if (uoms[i].toLowerCase() == uom.toLowerCase()) {
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
      function searchUoms(searchFilter) {
        console.log('searchItems isRTL = ' + isRTL(searchFilter));
        var lang = isRTL(searchFilter) ? 'AR' : 'EN';
        var deferred = $q.defer();
        if (searchFilter.length > 2) {
          console.log('searchUoms searchFilter = ' + searchFilter);
          var words = searchFilter.toLowerCase().split(" ");
          var matches = [];
          for (var j = 0; j < uoms.length; j++) {
            var match = true;
            for (var i = 0; i < words.length; i++) {
              //console.log("searchItems items[j] = " + JSON.stringify(items[j]))
              if (uoms[j].indexOf(words[i]) == -1) {
                match = false;
                break;
              }
            }
            if (match) {
              matches.push(uoms[j]);
            }
          }
          deferred.resolve(matches);
        } else {
          deferred.resolve([]);
        }
        return deferred.promise;
      }


      /*-------------------------------------------------------------------------------------*/
      /*Add New Master Item*/
      function addMasterUOM(uom) {

        var deferred = $q.defer();

        if (!uomsExist(uom)) {

          console.log('addMasterUOM uom = ' + JSON.stringify(uom));

          global.db.transaction(function (tx) {
            var query_uom = "INSERT INTO UOMS (uomName) values (?)";
            tx.executeSql(query_uom, [uom]);
          }, function (error) {
            console.error('addMasterUOM = error' + error.message);
            deferred.reject(error);
          }, function () {
            uoms.push(uom);
            deferred.resolve();
          });
        }
        return deferred.promise;
      };

      /*-------------------------------------------------------------------------------------*/
      return {
        searchUoms: searchUoms,
        uoms: uoms,
        init: init,
        getAllUOMs: getAllUOMs
      };
    }
  );
