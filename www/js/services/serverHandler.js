angular.module('starter.services')

  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2, $location, $state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2, serverHandlerRetailerV2) {


    function syncMasterData() {
      var defer = $q.defer();

      serverHandlerCategoryV2.syncCategoriesDownstream().then(function () {
        console.log('syncInit calling syncMasterItemsDownstream');
        $q.all([serverHandlerItemsV2.syncMasterItemsDownstream(), serverHandlerRetailerV2.syncMasterRetailersDownstream()]).then(function () {
          defer.resolve();
        });
      });
      return defer.promise;
    }

    function syncLocalData() {
      var defer = $q.defer();
      serverHandlerListV2.syncListsUpstream().then(function () {
        console.log('serverHandler syncListsUpstream done');
        serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
            console.log('serverHandler syncLocalItemsUpstream done');
            serverHandlerEntryV2.syncEntriesUpstream().then(function () {
              $q.all([
                serverHandlerEntryV2.syncSeensUpstream(),
                serverHandlerEntryV2.syncUpdatesUpstream(),
                serverHandlerEntryV2.syncCrossingsUpstream()]).then(function () {
                defer.resolve();
              }, function (err) {
                console.error('syncLocalData $q.all error ' + JSON.stringify(err));
                defer.reject();
              });
            });
          }, function (err) {
            console.error('syncLocalData syncEntriesUpstream error ' + err);
            defer.reject();
          }, function (err) {
            console.error('syncLocalData syncLocalItemsUpstream error ' + err);
            defer.reject()
          }
        );
      }, function (err) {
        console.error('syncLocalData syncListsUpstream error ' + err);
        defer.reject()
      });
      return defer.promise;
    }

    function syncInit() {
      console.log("Start syncInit");
      var defer = $q.defer();
      $q.all([syncMasterData(), syncLocalData()]).then(function () {
        syncDownStreamData().then(function () {
          defer.resolve();
        });
      });
      return defer.promise;
    }

// handle a server notification
    function syncDownStreamData() {
      var defer = $q.defer();
      serverHandlerListV2.syncListsDownstream().then(function (res) {
          console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
          console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
          // console.log("$state.params = " + JSON.stringify($state.params));
          /*
           if ($location.url() == '/lists') {
           $state.reload();
           }
           */
          serverHandlerEntryV2.syncEntrieDownstream().then(function (affectedLists) {
            // console.log('syncEntrieDownstream affectedLists ' + JSON.stringify(affectedLists));
            serverHandlerEntryV2.syncCrossingsDownstream();
            serverHandlerEntryV2.syncDeliveryDownstream().then(function (affectedLists) {
                console.log('syncDeliveryDownstream affectedLists = ' + JSON.stringify(affectedLists));

                serverHandlerEntryV2.syncSeenDownstream().then(function (affectedLists) {
                  console.log('syncSeenDownstream affectedLists = ' + JSON.stringify(affectedLists));
                  defer.resolve();
                }, function (err) {
                  console.error("syncInit syncSeenDownstream err = " + err);
                  defer.reject();
                });
              }, function (err) {
                console.error("syncInit syncDeliveryDownstream err = " + err);
                defer.reject();
              }
            );
          }, function (err) {
            defer.reject();
          });
        }
        ,
        function () {
          console.log("SERVER HANDLER ERROR")
        }
      );

      serverHandlerEntryV2.syncCrossingsDownstream().then(function (affectedLists) {
        console.log('syncCrossingsDownstream affectedLists = ' + JSON.stringify(affectedLists));
        serverHandlerEntryV2.syncCrossingsUpstream();
      });

      return defer.promise;
    }

    return {
      syncInit: syncInit,
      syncLocalData: syncLocalData
    }
  })
;


