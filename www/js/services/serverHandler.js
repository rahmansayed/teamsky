angular.module('starter.services')

  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2, $location, $state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2) {


    function syncInit() {
      console.log("Start syncInit");

      handleNotification();

      serverHandlerCategoryV2.syncCategoriesDownstream().then(function () {
        serverHandlerItemsV2.syncMasterItemsDownstream();
      });
      serverHandlerListV2.syncListsUpstream().then(function () {
        console.log('serverHandler syncListsUpstream done');
        serverHandlerItemsV2.syncLocalItemsUpstream().then(function () {
          console.log('serverHandler syncLocalItemsUpstream done');
          serverHandlerEntryV2.syncEntriesUpstream();
        })
      });

      console.log("End SynchInitTest");
    }

    // handle a server notification
    function handleNotification() {
      serverHandlerListV2.syncListsDownstream().then(function (res) {
          console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
          console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
          console.log("$state.params = " + JSON.stringify($state.params));
          if ($location.url() == '/lists') {
            $state.reload();
          }
          serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
            if ($location.url().startsWith('/item')) {
              console.log('NOTIFICATION ENTRY RES ' + JSON.stringify(res));
              for (var i = 0; i < res.length; i++) {
                console.log("$state.listId = " + $state.params.listId);
                if (res[i].listLocalId == $state.params.listId) {
                  console.log('NOTIFICATION ENTRY LIST MATCH reloading');
                  $state.reload();
                }
              }
            }
            serverHandlerEntryV2.syncDeliveryDownstream().then(function () {
                serverHandlerEntryV2.syncSeenDownstream();
              }, function (err) {
                console.log("syncInit syncDeliveryDownstream err = " + err);
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

      serverHandlerEntryV2.syncCrossingsDownstream().then(function () {
        console.log('syncCrossingsDownstream complete');
        serverHandlerEntryV2.syncCrossingsUpstream();
      });

    }

    return {
      syncInit: syncInit,
      handleNotification: handleNotification
    }
  });


