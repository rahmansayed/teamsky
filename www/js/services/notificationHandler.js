angular.module('starter.services')

  .factory('notificationHandler', function (global, $q, serverHandlerEntryV2, serverHandlerListV2, $location, $state, contactHandler) {

      function handleNotification(msg) {
        console.log('notificationHandler msg = ' + JSON.stringify(msg));
        serverHandlerListV2.syncListsDownstream().then(function (res) {
            console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
            console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
            console.log("$state.params = " + JSON.stringify($state.params));
            if ($location.url() == '/lists') {
              $state.reload();
            }
            serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
              if ($location.url().toString().startsWith('/item')) {
                console.log('NOTIFICATION ENTRY RES ' + JSON.stringify(res));
                for (var i = 0; i < res.length; i++) {
                  console.log("$state.listId = " + $state.params.listId);
                  if (res[i].listLocalId == $state.params.listId) {
                    console.log('NOTIFICATION ENTRY LIST MATCH reloading');
                    $state.reload();
                  }
                }
              }
              serverHandlerEntryV2.syncCrossingsDownstream().then(function (affectedLists) {
                console.log('syncCrossingsDownstream affectedLists = ' + JSON.stringify(affectedLists));
              });
              serverHandlerEntryV2.syncDeliveryDownstream().then(function (affectedLists) {
                console.log('syncDeliveryDownstream affectedLists = ' + JSON.stringify(affectedLists));
              });
              serverHandlerEntryV2.syncSeenDownstream().then(function (affectedLists) {
                console.log('syncSeenDownstream affectedLists = ' + JSON.stringify(affectedLists));
              });
              serverHandlerEntryV2.syncUpdatesDownstream().then(function (affectedLists) {
                console.log('syncUpdatesDownstream affectedLists = ' + JSON.stringify(affectedLists));
              });

              contactHandler.checkProspects();
            }, function (err) {

            });
          }
          ,
          function () {
            console.log("SERVER HANDLER ERROR")
          }
        );
      }

      return {
        handleNotification: handleNotification
      }
    }
  )
;
