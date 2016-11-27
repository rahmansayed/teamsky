angular.module('starter.services')

    .factory('itemHandler',function($q, $timeout,dbHandler){

      var selected = [];
      var items = [];
    var selectedItems =[];
    var listId;
      //items = angular.fromJson(window.localStorage['item']||[]);


      





      //var selectedItems = angular.fromJson(window.localStorage['selectedItems']||[]);

      var checkedItems = angular.fromJson(window.localStorage['checkedItems']||[]);

      function saveToLocalStorage(){

        window.localStorage['selectedItems'] = angular.toJson(selectedItems) ;
      };

      function itemExitInList(selectedItem){
        for  (var j=0;j<selectedItems.length;j++){
            if (selectedItems[j].listId === selectedItem.listId && selectedItems[j].itemName.toLowerCase() === selectedItem.itemName.toLowerCase()){
               return true;
             }
        };
     return false;
      };

    function masterItemExist(Item){
        //localStorage
        for  (var i=0;i<items.length;i++){
            if (items[i].name.toLowerCase() === Item.name.toLowerCase()){
               return true;
             }
        };
     return false;
      };

    function initcap(name) {
            var returnedName = name.substring(0,1).toUpperCase()
            + name.substring(1,name.length).toLowerCase();
            return returnedName;
            };


    function isItemChecked(listItem){
        for  (var j=0;j<checkedItems.length;j++){
            if (checkedItems[j].listId === listItem.listId && checkedItems[j].itemId === listItem.itemId){
               return true;
             }
        };
     return false;
      };


    var searchItems = function(searchFilter) {

        /*console.log('Searching items for ' + searchFilter);*/

        var deferred = $q.defer();

	    var matches = items.filter( function(item) {
            /*console.log(item.name.toLowerCase());*/
	    	if(item.name.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
	    })

        $timeout( function(){

           deferred.resolve( matches );

        }, 100);

        return deferred.promise;

    };
    
    function getAllEntry(listId){
        var deferred = $q.defer();
        var query = "SELECT l.listLocalId, i.itemName, c.categoryName, r.retailerName, v.vendorName, e.quantity, e.uom, e.entryCrossedFlag FROM ((((masterItem AS i INNER JOIN entry AS e ON i.itemLocalId = e.itemLocalId) INNER JOIN list AS l ON e.listLocalId = l.listLocalId) INNER JOIN category AS c ON i.CategoryLocalId = c.categoryLocalId) INNER JOIN retailer AS r ON e.retailerLocalId = r.retailerLocalId) INNER JOIN vendor AS v ON i.vendorLocalId = v.vendorLocalId  WHERE l.listLocalId=?";
        dbHandler.runQuery(query,[listId],function(response){
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
    
    function getAllMasterItem(){
        var deferred = $q.defer();
        var query = "SELECT i.itemLocalId, i.itemName, c.categoryName FROM category as c INNER JOIN masterItem as i ON c.categoryLocalId = i.categoryLocalId";
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
    
    var y = getAllMasterItem()      
    .then(getMasterSuccessCB,getMasterErrorCB);

    function getMasterSuccessCB(response)
		{
			
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{
                items.push({itemLocalId:response.rows.item(i).itemLocalId,
                            itemName:response.rows.item(i).itemName,
                            categoryName:response.rows.item(i).categoryName});
				}
			}else
			{
				var message = "No master items created till now.";
			}
		}

		function getMasterErrorCB(error)
		{
			var message = "Some error occurred in fetching Master items";
		}
    ;
    
    items = items.sort(function(a, b) {

            var itemA = a.name.toLowerCase();
            var itemB = b.name.toLowerCase();

            if(itemA > itemB) return 1;
            if(itemA < itemB) return -1;
	   return 0;
      });
    //Setting selectem Item Array
    
    var x = getAllEntry(listId)      
    .then(getEntrySuccessCB,getEntryErrorCB);

    function getEntrySuccessCB(response)
		{
			
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{
                selectedItems.push({listLocalId:response.rows.item(i).listLocalId,
                                   itemName:response.rows.item(i).itemName,
                                   categoryName:response.rows.item(i).categoryName,
                                   retailerName:response.rows.item(i).retailerName,
                                   vendorName:response.rows.item(i).vendorName,
                                   quantity:response.rows.item(i).quantity,
                                   uom:response.rows.item(i).uom,
                                   entryCrossedFlag:response.rows.item(i).entryCrossedFlag
                                   });
				}
			}else
			{
				var message = "No entry created till now.";
			}
		}

		function getEntryErrorCB(error)
		{
			var loadingLists = false;
			var message = "Some error occurred in fetching entry";
		}
    ;

    

    function addMaserItem(item) {
        //Local Storage
         if (!masterItemExist(item)){
            items.push(item);
            window.localStorage['item'] = angular.toJson(items) ;
             console.log('item created');
         }
        console.log('item exist');
        //Sqlite
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




    return {
              item: function(){

                  return items;
              },

            searchItems : searchItems ,

              selectedItem: function(){

                  return selectedItems;
              },

            initcap: function(name){

                  return initcap(name);
              },


            checkedItem: function(){

                  return checkedItems;
              },
             selectedItemByListId: function(listId){
                var specificList=[];

                for (var i=0;i<selectedItems.length;i++){
                        if (selectedItems[i].listId===listId){
                           specificList.push(selectedItems[i]);
                        }
                    };
                 return specificList;
              },

              isItemChecked:  function (listItem){
                isItemChecked(listItem);
              },

            addItemToList:function(selectedItem){
                 if (!itemExitInList(selectedItem)){
                    selectedItems.push(selectedItem);
                    saveToLocalStorage();
                    console.log('item added in list '||selectedItem.itemCategory);
                 }
                console.log('item exist in list');
            },

          checkItem: function(listItem){
                 if (!isItemChecked(listItem)){
                    checkedItems.push(listItem);
                    window.localStorage['checkedItems'] = angular.toJson(checkedItems) ;

                  for (var i = 0; i < selectedItems.length; i++) {

                      if (selectedItems[i].itemId === listItem.itemId) {
                        selectedItems[i].itemCrossed= true;
                        saveToLocalStorage();
                        return;
                      }
                    }
                    ;

                 }
            },

          unCheckItem: function(checkedItem){
                 if (isItemChecked(checkedItem)){

                    for (var i = 0; i < selectedItems.length; i++) {

                      if (selectedItems[i].itemName === checkedItem.itemName) {
                        selectedItems[i].itemCrossed= false;
                        saveToLocalStorage();

                      }
                    }
                     console.log(checkedItems.length);
                    for (var k=0;k<checkedItems.length;k++){
                        if ((checkedItems[k].itemName===checkedItem.itemName) &&(checkedItems[k].listId === checkedItem.listId)){
                           checkedItems.splice(k,1);
                           window.localStorage['checkedItems'] = angular.toJson(checkedItems) ;
                           return;
                        }
                    };
                 }
            },
            removeListItem: function(listItem){
               for (var k=0;k<selectedItems.length;k++){
                    if ((selectedItems[k].itemName===listItem.itemName) &&(selectedItems[k].listId === listItem.listId)){
                       selectedItems.splice(k,1);
                       saveToLocalStorage();
                       return;
                    }
            };

            },

            AddMasterItem:function(item){
                 if (!masterItemExist(item)){
                    items.push(item);
                    window.localStorage['item'] = angular.toJson(items) ;
                     console.log('item created');
                 }
                console.log('item exist');
            },

            deleteAll: function(){

           for (var i=0;i<selectedItems.length;i++){

                   selectedItems.splice(i,1);
                   saveToLocalStorage();
                }
            }
        ,
        itemCategory: function (itemName){
            /*console.log(itemName);*/
            for (var i=0;i<items.length;i++){

                if (items[i].name===itemName) {
                       return items[i].category;
                    }
                }

        }
                ,

      getItemById: function (itemId) {
        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemId === itemId) {
            return selectedItems[i];
          }
        }
        return undefined;
      },
        allListItemCategoryCrossed: function (category){
            /*console.log(itemName);*/
            for (var i=0;i<selectedItems.length;i++){
               /* console.log(selectedItems.length);*/
                if (selectedItems[i].itemCategory!=category ) {
                    /*console.log('Item: '+selectedItems[i].itemName+'Category: ' + selectedItems[i].itemCategory );*/
                    continue;
                }
                /*console.log(selectedItems[i].itemCategory);
                console.log(selectedItems[i].itemCrossed);*/
                if (selectedItems[i].itemCategory===category && selectedItems[i].itemCrossed === false) {
                       /*console.log('Item: '+selectedItems[i].itemName+'Category: ' + selectedItems[i].itemCategory + 'Crossed: '+selectedItems[i].itemCrossed);
                        console.log(false);*/
                       return false;
                       break;
                    }

                }
             /*console.log(true);*/
            return true;

        },
    updateListItem: function (listItem) {

        for (var i = 0; i < selectedItems.length; i++) {

          if (selectedItems[i].itemId === listItem.itemId) {
            selectedItems[i] = listItem;
            saveToLocalStorage();
            console.log('Update List item Call'+JSON.stringify(selectedItems[i]));
            return;
          }
        }
        ;
      }

        };
});
