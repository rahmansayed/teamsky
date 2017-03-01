angular.module('starter.services')

  .factory('serverHandler', function ($http, global, $q, dbHandler, serverHandlerCategoryV2, $location, $state,
                                      serverHandlerItemsV2, serverHandlerListV2, serverHandlerEntryV2) {


    function SynchInitTest() {
      console.log("Start SynchInitTest");

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
          }, function (err) {

          });
        }
        ,
        function () {
          console.log("SERVER HANDLER ERROR")
        }
      );


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

      serverHandlerEntryV2.syncCrossingsDownstream().then(function () {
        console.log('syncCrossingsDownstream complete');
        serverHandlerEntryV2.syncCrossingsUpstream();
      });

      serverHandlerEntryV2.syncDeliveryDownstream();
      console.log("End SynchInitTest");
    };

    return {
      SynchInitTest: SynchInitTest
    }
  });


