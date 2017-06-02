angular.module('starter.services')

  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2, contactHandler, $location, $state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2, serverHandlerRetailerV2, serverHandlerEntryEvents) {


    function syncMasterData() {
      var defer = $q.defer();

      serverHandlerCategoryV2.syncCategoriesDownstream().then(function () {
        console.log('syncMasterData calling syncMasterItemsDownstream');
        $q.all([serverHandlerItemsV2.syncMasterItemsDownstream(), serverHandlerRetailerV2.syncMasterRetailersDownstream()]).then(function () {
          console.log("syncMasterData $q success");
          defer.resolve();
        }, function () {
          console.error("syncMasterData $q error");
          defer.reject();
        });
      });
      return defer.promise;
    }

    function syncLocalData() {
      var defer = $q.defer();
      serverHandlerListV2.syncListsUpstream().then(function () {
        console.log('serverHandler syncListsUpstream done');
        contactHandler.listContactsUpstreamer();
        serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
            console.log('serverHandler syncLocalItemsUpstream done');
            serverHandlerEntryV2.syncEntriesUpstream().then(function () {
              $q.all([
                serverHandlerEntryEvents.syncEventUpstream('SEEN'),
                serverHandlerEntryV2.syncUpdatesUpstream(),
                serverHandlerEntryEvents.syncEventUpstream('CROSS')]).then(function () {
                defer.resolve();
              }, function (err) {
                console.error('syncLocalData $q.all error ' + angular.toJson(err));
                defer.reject();
              });
            }, function (err) {
              console.error('syncLocalData syncEntriesUpstream error ' + angular.toJson(err));
              defer.reject();
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
      console.log("syncInit start");
      var defer = $q.defer();
      $q.all([syncMasterData(), syncLocalData(), serverHandlerListV2.syncListsDownstream()]).then(function () {
        console.log("syncInit $q.all success");
        syncDownStreamData().then(function () {
          console.log("syncInit syncDownStreamData success");
          defer.resolve();
        }, function (err) {
          console.error("syncInit syncDownStreamData error = " + err);
          defer.reject();
        });
      }, function () {
        console.error("syncInit $q.all error");
        defer.reject();
      });
      return defer.promise;
    }

// handle a server notification
    function syncDownStreamData() {
      var defer = $q.defer();
      contactHandler.downloadContactsPhotos();
      serverHandlerEntryV2.syncEntrieDownstream().then(function (affectedLists) {
        console.log('syncDownStreamData syncEntrieDownstream affectedLists ' + angular.toJson(affectedLists));
        serverHandlerEntryEvents.syncEventDownstream(null, 'CROSS');
        serverHandlerEntryEvents.syncEventDownstream(null, 'DELIVER').then(function (affectedLists) {
            console.log('syncDeliveryDownstream affectedLists = ' + angular.toJson(affectedLists));

            serverHandlerEntryEvents.syncEventDownstream(null, 'SEEN').then(function (affectedLists) {
              console.log('syncSeenDownstream affectedLists = ' + angular.toJson(affectedLists));
              defer.resolve();
            }, function (err) {
              console.error("syncDownStreamData syncEventDownstream SEEN err = " + err);
              defer.reject();
            });
          }, function (err) {
            console.error("syncDownStreamData syncDownStreamData DELIVER err = " + err);
            defer.reject();
          }
        );
      }, function (err) {
        console.error("syncDownStreamData syncEntrieDownstream ERROR");
        defer.reject();
      });

      serverHandlerEntryEvents.syncEventDownstream(null, 'CROSS').then(function (affectedLists) {
        console.log('syncCrossingsDownstream affectedLists = ' + angular.toJson(affectedLists));
        serverHandlerEntryEvents.syncEventUpstream('CROSS');
      });

      return defer.promise;
    }

    return {
      syncInit: syncInit,
      syncLocalData: syncLocalData
    }
  })
;


