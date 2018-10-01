angular.module('starter.services')

  .factory('notificationHandler', function (global, $q, serverHandlerEntryV2, localListHandlerV2, serverHandlerEntryEvents, serverHandlerListV2, $location, $state, contactHandler, settings) {

      function handleNotification(msg) {
        console.log('notificationHandler msg = ' + angular.toJson(msg));
        // we need to make sure prior to handling a notification, that the user settings are already loaded
        console.log('handleNotification settings.userSetting = ' + settings.userSetting);
        if (!settings.userSetting || settings.userSetting.length == 0) {
          settings.getUserSetting().then(function () {
            handleTheNotification(msg);
          });
        } else {
          handleTheNotification(msg);
        }
      }

      function handleTheNotification(msg) {
        /*var details = angular.fromJson(msg.additionalData);*/
        var details = msg.additionalData;  
        console.log('aalatief - msg '+ angular.toJson(msg))  ;
        console.log('aalatief - details '+ details)  ;
        console.log('aalatief - details toString'+ angular.toString(details.type))  ;
        
        
        switch (details.details.type) {
          case "PHOTO UPLOADED":
            contactHandler.downloadContactPhoto(details.userId /*details.userServerId by rahman*/);
            break;
          case 'NEW LIST':
            serverHandlerListV2.upsertServerList(details.details.list/*details.list --by rahman*/).then(function (res) {
              console.log('handleNotification list added res = ' + angular.toJson(res));
              if (!details.foreground) {
                console.log('handleNotification going to list');
                global.currentList = res.list;
                $state.go('item');
              }
            });
            break;
          case "NEW ENTRY":
            global.status = details.foreground ? "foreground" : 'background';
            console.log('handleNotification global.status = ' + global.status);

            serverHandlerEntryV2.syncEntriesDownstream(details.details).then(function (affectedLists) {
              serverHandlerListV2.maintainGlobalLists(affectedLists[0], "ADD ENTRY");
              console.log("handleNotification affectedLists = " + angular.toJson(affectedLists));
              console.log("handleNotification  $state.params = " + angular.toJson($state.params));
              console.log("handleNotification  $state.current.name = " + angular.toJson($state.current.name));
              if (!details.foreground) {
                console.log('handleNotification going to list');
                localListHandlerV2.getAllLists(affectedLists[0].listLocalId).then(function (lists) {
                  console.log('handleNotification lists = ' + angular.toJson(lists));
                  global.currentList = lists.lists[0];
                  if (!details.coldstart && !details.foreground)
                    if ($state.current.name != 'item')
                      $state.go('item');
                    else
                      $state.reload();
                });
              }

            });
            break;
          case "CROSSED":
            console.log("aalatief- CROSSED Case entered: "  + angular.fromJson(msg));      
            serverHandlerEntryEvents.syncEventDownstream(details.details, 'CROSS').then(function (affectedLists) {
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
            serverHandlerEntryEvents.syncEventDownstream(details.details, 'DELETE').then(function (affectedLists) {
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
            console.log("handleNotification mainEvent = " + details.details.mainEvent);
            serverHandlerEntryEvents.syncEventDownstream(details.details, details.details.mainEvent + '-' + 'DELIVER').then(function (affectedLists) {
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
            console.log("handleNotification mainEvent = " + details.details.mainEvent);
            serverHandlerEntryEvents.syncEventDownstream(details.details, details.details.mainEvent + '-' + 'SEEN').then(function (affectedLists) {
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
            settings.setSettings(details.details.update).then(function () {
              settings.getUserSetting().then(function () {
                if (($state.current.name == 'account') || ($state.current.name == "lists")) {
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
                serverHandlerEntryV2.syncEntriesDownstream().then(function (res) {
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
                  serverHandlerEntryEvents.syncEventDownstream(null, 'CREATE-DELIVER').then(function (affectedLists) {
                    console.log('syncDeliveryDownstream affectedLists = ' + angular.toJson(affectedLists));
                  });
                  serverHandlerEntryEvents.syncEventDownstream(null, 'CREATE-SEEN').then(function (affectedLists) {
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
