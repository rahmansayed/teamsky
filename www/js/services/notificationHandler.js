angular.module('starter.services')

  .factory('notificationHandler', function (global, $q, serverHandlerEntryV2, serverHandlerListV2, $location, $state, contactHandler) {

      function handleNotification(msg) {
        console.log('notificationHandler msg = ' + JSON.stringify(msg));
        switch (msg.additionalData.details.type) {
          case 'NEW LIST':
            serverHandlerListV2.upsertServerList(msg.additionalData.details.list).then(function () {
              if ($state.current.name == "lists") {
                $state.reload();
              }
            });
            break;
          case "NEW ENTRY":
            serverHandlerEntryV2.syncEntrieDownstream(msg.additionalData.details).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + JSON.stringify(affectedLists));
              console.log("handleNotification  $state.params = " + JSON.stringify($state.params));
              console.log("handleNotification  $state.current.name = " + JSON.stringify($state.current.name));
            });
            break;
          case "CROSSED":
            serverHandlerEntryV2.syncCrossingsDownstream(msg.additionalData.details).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + JSON.stringify(affectedLists));
              console.log("handleNotification  $state.params = " + JSON.stringify($state.params));
              console.log("handleNotification  $state.current.name = " + JSON.stringify($state.current.name));
              /*
               if ($state.current.name == "item") {
               if (affectedLists.filter(function (list) {
               return list.listLocalId == $state.params.listId;
               }).length > 0) {
               $state.reload();
               }
               }
               */
            });
            break;

          case "DELIVERED":
            serverHandlerEntryV2.syncDeliveryDownstream(msg.additionalData.details).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + JSON.stringify(affectedLists));
              console.log("handleNotification  $state.params = " + JSON.stringify($state.params));
              console.log("handleNotification  $state.current.name = " + JSON.stringify($state.current.name));
              if ($state.current.name == "item") {
                if (affectedLists.filter(function (list) {
                    return list.listLocalId == $state.params.listId;
                  }).length > 0) {
                  //$state.reload();
                }
              }
            });
            break;

          case "SEEN":
            serverHandlerEntryV2.syncSeenDownstream(msg.additionalData.details).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + JSON.stringify(affectedLists));
              console.log("handleNotification  $state.params = " + JSON.stringify($state.params));
              console.log("handleNotification  $state.current.name = " + JSON.stringify($state.current.name));
              if ($state.current.name == "item") {
                if (affectedLists.filter(function (list) {
                    return list.listLocalId == $state.params.listId;
                  }).length > 0) {
                  //$state.reload();
                }
              }
            });
            break;
          case "UPDATED":
            serverHandlerEntryV2.syncUpdatesDownstream(msg.additionalData.details.entry).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + JSON.stringify(affectedLists));
              console.log("handleNotification  $state.params = " + JSON.stringify($state.params));
              console.log("handleNotification  $state.current.name = " + JSON.stringify($state.current.name));
              if ($state.current.name == "item") {
                if (affectedLists.filter(function (list) {
                    return list.listLocalId == $state.params.listId;
                  }).length > 0) {
                  //$state.reload();
                }
              }
            });
            break;
          case "DELETE LIST":
            serverHandlerListV2.deactivateServerList(msg.additionalData.details.listServerId).then(function () {
              if ($state.current.name == "lists") {
                $state.reload();
              }
            });
            break;
          default:
            serverHandlerListV2.syncListsDownstream().then(function (res) {
                console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
                console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
                console.log("$state.params = " + JSON.stringify($state.params));
                console.log("$state.current = " + JSON.stringify($state.current));
                if ($state.current.name == "lists") {
                  $state.reload();
                }
                serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
                  if ($state.current.name == "item") {
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
      }

      return {
        handleNotification: handleNotification
      }
    }
  )
;
