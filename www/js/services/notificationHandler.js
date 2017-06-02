angular.module('starter.services')

  .factory('notificationHandler', function (global, $q, serverHandlerEntryV2, localListHandlerV2, serverHandlerEntryEvents, serverHandlerListV2, $location, $state, contactHandler, settings) {

      function handleNotification(msg) {
        console.log('notificationHandler msg = ' + angular.toJson(msg));
        switch (msg.additionalData.details.type) {
          case "PHOTO UPLOADED":
            contactHandler.downloadContactPhoto(msg.additionalData.details.userServerId);
            break;
          case 'NEW LIST':
            serverHandlerListV2.upsertServerList(msg.additionalData.details.list).then(function (res) {
              console.log('handleNotification list added res = ' + angular.toJson(res));
              if (!msg.additionalData.foreground) {
                console.log('handleNotification going to list');
                global.currentList = res.list;
                $state.go('item');
              }
            });
            break;
          case "NEW ENTRY":
            serverHandlerEntryV2.syncEntrieDownstream(msg.additionalData.details).then(function (affectedLists) {
              serverHandlerListV2.maintainGlobalLists(affectedLists[0], "ADD ENTRY");
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
              if (!msg.additionalData.foreground) {
                console.log('handleNotification going to list');
                localListHandlerV2.getAllLists(affectedLists[0].listLocalId).then(function (lists) {
                  console.log('handleNotification lists = ' + angular.toJson(lists));
                  global.currentList = lists.lists[0];
                  $state.go('item');
                });
              }
            });
            break;
          case "CROSSED":
            serverHandlerEntryEvents.syncEventDownstream(msg.additionalData.details, 'CROSS').then(function (affectedLists) {
              serverHandlerListV2.maintainGlobalLists(affectedLists[0], "CROSS ENTRY");
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
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

          case "DELETED":
            serverHandlerEntryEvents.syncEventDownstream(msg.additionalData.details, 'DELETE').then(function (affectedLists) {
              serverHandlerListV2.maintainGlobalLists(affectedLists[0], "DELETE ENTRY");
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
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
            serverHandlerEntryEvents.syncEventDownstream(msg.additionalData.details, 'DELIVER').then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
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
            serverHandlerEntryEvents.syncEventDownstream(msg.additionalData.details, 'SEEN').then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
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
            serverHandlerEntryV2.syncUpdatesDownstream(msg.additionalData.details).then(function (affectedLists) {
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
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
          case "PROFILE UPDATE":
            settings.setSettings(msg.additionalData.details.update).then(function () {
              settings.getUserSetting().then(function () {
                if ($state.current.name == 'account') {
                  $state.reload();
                }
              });
            });
            break;
          default:
            serverHandlerListV2.syncListsDownstream().then(function (res) {
                console.log("SERVER HANDLER RESOLVED NOTIFICATION " + res);
                console.log("SERVER HANDLER RESOLVED NOTIFICATION  $location.url() " + $location.url());
                console.log("$state.params = " + angular.toJson($state.params));
                console.log("$state.current = " + angular.toJson($state.current));
                if ($state.current.name == "lists") {
                  $state.reload();
                }
                serverHandlerEntryV2.syncEntrieDownstream().then(function (res) {
                  if ($state.current.name == "item") {
                    console.log('NOTIFICATION ENTRY RES ' + angular.toJson(res));
                    for (var i = 0; i < res.length; i++) {
                      console.log("$state.listId = " + $state.params.listId);
                      if (res[i].listLocalId == $state.params.listId) {
                        console.log('NOTIFICATION ENTRY LIST MATCH reloading');
                        $state.reload();
                      }
                    }
                  }

                  serverHandlerEntryEvents.syncEventDownstream(null, 'CROSS').then(function (affectedLists) {
                    console.log('syncCrossingsDownstream affectedLists = ' + angular.toJson(affectedLists));
                  });
                  serverHandlerEntryEvents.syncEventDownstream(null, 'DELIVER').then(function (affectedLists) {
                    console.log('syncDeliveryDownstream affectedLists = ' + angular.toJson(affectedLists));
                  });
                  serverHandlerEntryEvents.syncEventDownstream(null, 'SEEN').then(function (affectedLists) {
                    console.log('syncSeenDownstream affectedLists = ' + angular.toJson(affectedLists));
                  });
                  serverHandlerEntryV2.syncUpdatesDownstream().then(function (affectedLists) {
                    console.log('syncUpdatesDownstream affectedLists = ' + angular.toJson(affectedLists));
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
