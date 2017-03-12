angular.module('starter.services')

  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2, $location, $state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2, serverHandlerRetailerV2) {


    function syncInit() {
      console.log("Start syncInit");
      var defer = $q.defer();
      serverHandlerCategoryV2.syncCategoriesDownstream().then(function () {
        console.log('syncInit calling syncMasterItemsDownstream');
        serverHandlerItemsV2.syncMasterItemsDownstream().then(function () {
          console.log('syncInit resolved');
          defer.resolve();
        });
      });
      serverHandlerListV2.syncListsUpstream().then(function () {
        console.log('serverHandler syncListsUpstream done');
        serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
          console.log('serverHandler syncLocalItemsUpstream done');
          serverHandlerEntryV2.syncEntriesUpstream();
        })
      });

      serverHandlerRetailerV2.syncMasterRetailersDownstream().then(function () {
        console.log('serverHandler syncMasterRetailersDownstream done');
      });
      handleNotification();
      return defer.promise;
    }

    // handle a server notification
    function handleNotification() {
      serverHandlerListV2.syncListsDownstream().then(function (res) {
          console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
          console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
          // console.log("$state.params = " + JSON.stringify($state.params));
          if ($location.url() == '/lists') {
            $state.reload();
          }
          serverHandlerEntryV2.syncEntrieDownstream().then(function (affectedLists) {
            // console.log('syncEntrieDownstream affectedLists ' + JSON.stringify(affectedLists));

            if ($location.url().indexOf('/item') == 0) {
              for (var i = 0; i < affectedLists.length; i++) {
                console.log("$state.listId = " + $state.params.listId);
                if (affectedLists[i].listLocalId == $state.params.listId) {
                  console.log('NOTIFICATION ENTRY LIST MATCH reloading');
                  $state.reload();
                }
              }
            }
            serverHandlerEntryV2.syncDeliveryDownstream().then(function (affectedLists) {
                console.log('syncDeliveryDownstream affectedLists = ' + JSON.stringify(affectedLists));

                serverHandlerEntryV2.syncSeenDownstream().then(function (affectedLists) {
                  console.log('syncSeenDownstream affectedLists = ' + JSON.stringify(affectedLists));
                }, function (err) {
                  console.error("syncInit syncSeenDownstream err = " + err);
                });
              }, function (err) {
                console.error("syncInit syncDeliveryDownstream err = " + err);
              }
            );
          }, function (err) {

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

    }

    return {
      syncInit: syncInit,
      handleNotification: handleNotification
    }
  });


