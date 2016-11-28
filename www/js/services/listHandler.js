angular.module('starter.services')

  .factory('listHandler', function ($http, global,serverListHandler,dbHandler,$q) {

    var lists =[]; //angular.fromJson(window.localStorage['lists'] || []);

     var x = getAllLists()      //listHandler.list();
    .then(getListSuccessCB,getListErrorCB);

    function getListSuccessCB(response)
		{
			var loadingLists = false;
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{
                lists.push({listLocalId:response.rows.item(i).listLocalId,
                                   listName:response.rows.item(i).listName,
                                   listDescription:response.rows.item(i).listDescription});
				}
			}else
			{
				var message = "No lists created till now.";
			}
		}

		function getListErrorCB(error)
		{
			var loadingLists = false;
			var message = "Some error occurred in fetching Trackers List";
		}


    function saveToLocalStorage() {

      window.localStorage['lists'] = angular.toJson(lists);
    };

    function update (list) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].listLocalId === list.listLocalId) {
            lists[i] = list;
            saveToLocalStorage();
            console.log('Update List Called!!'+JSON.stringify(list));
          }
        }
        serverListHandler.updateList(list);
        updateList(list);

    };
    
    function addNewList(list) {

		var deferred = $q.defer();
		var query = "INSERT INTO list (listLocalId,listName,listDescription,listServerId,listColor,listOrder,lastUpdateDate) VALUES (?,?,?,?,?,?,?)";
		dbHandler.runQuery(query,[list.listLocalId,list.listName,list.listDescription,list.listServerId,'','',new Date().getTime()],function(response){
			//Success Callback
			console.log(response);
			deferred.resolve(response);
		},function(error){
			//Error Callback
			console.log(error);
			deferred.reject(error);
		});

		return deferred.promise;
	};

    function getAllLists(){
        var deferred = $q.defer();
        var query = "SELECT * from list";
        dbHandler.runQuery(query,[],function(response){
            //Success Callback
            console.log(response);
            list = response.rows;
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log(error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    function deleteList(id) {
        var deferred = $q.defer();
        var query = "DELETE FROM list WHERE listLocalId = ?";
        dbHandler.runQuery(query,[id],function(response){
            //Success Callback
            console.log(response);
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log(error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    function updateList(list) {
    var deferred = $q.defer();
    var query = "Update list set listName =? , listDescription= ? ,lastUpdateDate = ? WHERE listLocalId = ?";
    dbHandler.runQuery(query,[list.listName,list.listDescription,new Date().getTime(),list.listLocalId],function(response){
        //Success Callback
        console.log(response);
        deferred.resolve(response);
    },function(error){
        //Error Callback
        console.log(error);
        deferred.reject(error);
    });

    return deferred.promise;
    };

    return {
      list: function () {

        return lists;
      },
        
      

      get: function (listId) {
        for (var i = 0; i < lists.length; i++) {

          if (lists[i].listLocalId == listId) {
            return lists[i];
          }
        }
        return undefined;
      },

      create: function (list) {
        lists.push(list);
        saveToLocalStorage();
        //ToDO : Check if Local Success then save to send to server:
        serverListHandler.createList(list.listLocalId,list.listName,list.listDescription,"RED","1").then(function(listServerId){


          list.serverListId =listServerId||"0";
        console.log('listServerId' + listServerId);
        console.log('update server list id'+ JSON.stringify(list) );
            update(list);
       });
        //End To Do
      },

      move: function (list, fromIndex, toIndex) {
        lists.splice(fromIndex, 1);
        lists.splice(toIndex, 0, list);
        saveToLocalStorage();
      },
      update: update,

      remove: function (listId) {
         console.log( 'list length'+lists.length);
        for (var i = 0; i < lists.length; i++) {
          console.log('list local Deleted ' + lists[i].listLocalId + 'Passed Id:'+listId);
          if (lists[i].listLocalId == listId) {
            console.log( 'Local list delete entered!!');
            lists.splice(i, 1);
            saveToLocalStorage();
            //return;
          }
        }
        ;
           deleteList(listId);
           console.log('list Deleted ' + listId);
          //return;
      },

      addUser: function (listServerId, invitedUserServerId) {
        data = {
          invitedUserServerId: invitedUserServerId,
          listServerId:listServerId
        };
        console.log("data = "+data);
        $http.post('http://' + global.serverIP + "/api/list/invite" , data)

          .then(function (response) {
            console.log('listhandler.addUser ' + response);
          });
      },
    
      addNewList:addNewList,
      getAllLists:getAllLists,
      deleteList:deleteList,
      updateList:updateList

    };
  });


