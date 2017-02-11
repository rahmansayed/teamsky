angular.module('starter.controllers')
  .controller('listItem', function ($scope, $state, listHandler, itemHandler, $ionicPopup,$timeout) {

    $scope.items = [];
    $scope.selectedItems =  [];
    $scope.checkedItems = [];

    
    
    $scope.data = { "items" : [], "search" : '' };

    $scope.search = function() {
        console.log('Search pressed : ' + $scope.data.search);
    	itemHandler.searchItems($scope.data.search).then(
    		function(matches) {
                
    			$scope.data.items = matches;
                console.log('Search Result after promise: '+$scope.data.items);
    		}
    	)
    };


    $scope.editListItem=function(listItem){
    $scope.selectedForEdit = listItem;
    console.log($scope.selectedForEdit.itemId);
    console.log($scope.selectedForEdit.listId);
    $state.go('edit-list-item',{'listItemId':listItem.itemId,'listId':listItem.listId});

    };



  /*Add searched item to current list*/
    var selected = [itemHandler.selected];
      $scope.selectItems = function (item) {

          $scope.selectedItem =
                    { listLocalId: $state.params.listId,
                      itemLocalId: item.itemLocalId,
                      itemName: item.itemName,
                      categoryName: itemHandler.categoryName(item.itemName),
                      itemQuatity:0,
                      itemUom:"",
                      itemRetailer:"",
                      entryCrossedFlag:item.entryCrossedFlag
                    };
          console.log('Master Item Searched: '+ JSON.stringify($scope.selectedItem));
          itemHandler.addItemToList($scope.selectedItem);
          
           $state.reload();

      };




    $scope.checkedItems = itemHandler.checkedItem();
    console.log('itemHandler.checkedItem()'+itemHandler.checkedItem());
    
    /*
    itemHandler.getAllEntry($state.params.listId).then( 
    
    function(response)
		{
			
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{
                $scope.selectedItems.push({listLocalId:response.rows.item(i).listLocalId,
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
		};
    );*/
     itemHandler.getAllEntry($state.params.listId)      
    .then(function(result){
       $scope.listItems=itemHandler.selectedItem();
       console.log('aalatief: list items: '+JSON.stringify(result));
      }
    , function(error) {
    // error handling here
    
    console.log('aalatief: List Item Load Fail:'+JSON.stringify(error));;

  });
    
   /*  $scope.listItems=itemHandler.selectedItem($state.params.listId);
     console.log('!!!!list items: '+JSON.stringify($scope.listItems));*/
    //$scope.itemCategory = itemHandler.itemCategory($scope.listItems.itemName);

    /*Group items by category-- Not Neede now, I used different way*/
   /*
   $scope.shownListItems = [];
   var itemCategory;

    for(var i = 0; i < $scope.listItems.length; i++) {
	   itemCategory = $scope.listItems[i].itemCategory ;

    console.log('Seq: ' + i);
    console.log('Current item Name: '+$scope.listItems[i].itemName);
    console.log('Current item Category: '+itemCategory);
    console.log('Shown Category Befor Update: ' + $scope.shownListItems[itemCategory]);
	if(!$scope.shownListItems[itemCategory]) $scope.shownListItems[itemCategory] = [];
    console.log('Shown Category After Update: ' + $scope.shownListItems[itemCategory]);
	$scope.shownListItems[itemCategory].push ( $scope.listItems[i].itemName + ' ' + $scope.listItems[i].itemCategory );
    console.log('Value Pushed is: ' + $scope.listItems[i].itemName + ' ' + $scope.listItems[i].itemCategory);
}  ;
    */




    $scope.AddListItem= function (){

        $state.go('addItem',{'listId':$state.params.listId});

    };

    $scope.removeFromList = function(listItem){

       var confirmPopup = $ionicPopup.confirm({
         title: 'Delete Item from List',
         template: 'Are you sure you want to delete this item?'
       });

       confirmPopup.then(function(res) {
         if(res){
                    itemHandler.removeListItem(listItem);
                    $state.reload();
                }
       });

    };
    
    var getSpecificSuccess = function (response)
		{
			//var loadingLists = false;
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{   
                   $scope.list={listLocalId:response.rows.item(i).listLocalId,
                                   listName:response.rows.item(i).listName,
                                   listDescription:response.rows.item(i).listDescription} ;
                    $scope.dynamicListTitle = response.rows.item(i).listName;
                    
				}
			    
            }else
			{
				var message = "No lists selected till now.";
			}

        };
    
    		var getSpecificError = function (error)
		{
			//var loadingLists = false;
			var message = "Some error occurred in fetching List";
		};
   
   // var z = listHandler.getSpecificList($state.params.listId) .then(getSpecificSuccess,getSpecificError);
console.log('$scope.list=: '+ JSON.stringify($scope.list));
    //$scope.list= listHandler.getSpecificList($state.params.listId); // listHandler.list();   angular.copy( 
    
    //$scope.dynamicListTitle = $scope.list.listName;
     console.log('specificList' + JSON.stringify( $scope.list));

    $scope.itemChecked = function(listItem){

        $scope.checkeditem =
                    { listLocalId: $state.params.listId,
                      itemLocalId: listItem.itemLocalId,
                      itemName:listItem.itemName
                    };
        console.log('checked item: '+JSON.stringify($scope.checkeditem)+listItem.itemLocalId);
        itemHandler.checkItem($scope.checkeditem);
    };



    $scope.unCheckItem = function(checkedItem){

     itemHandler.unCheckItem(checkedItem);
     $state.reload();
};


    /*Search Item Part*/
    $scope.data = { "items" : [], "search" : '' };

    $scope.search = function() {

    	itemHandler.searchItems($scope.data.search).then(
    		function(matches) {
    			$scope.data.items = matches;
    		}
    	)
    };

    $scope.refresh = function() {
    
    console.log('Refreshing!');
    $timeout( function() {
        $state.reload();
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    
    }, 1000);
      
  };
    
    $scope.AddMasterItem = function(itemName){

         console.log('Add Master Item Case: ' + itemName);
         $scope.enteredItem =
                    { itemLocalId: new Date().getTime().toString(),
                      itemName: itemHandler.initcap(itemName),
                      categoryName: 'Uncategorized'
                    };
          itemHandler.AddMasterItem($scope.enteredItem)
              
        .then(function(response){
              console.log('07/02/2017 - listItemCtrl - aalatief:Master Item added'+JSON.stringify(response));
              
              itemHandler.getLocalItemId($scope.enteredItem.itemName)
              .then(function(response){
                  console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id'+JSON.stringify(response.rows.item(0).itemLocalId)+'Entered Item Name: '+$scope.enteredItem.itemName);
                  itemLocalId = response.rows.item(0).itemLocalId;
                  
                  $scope.selectedItem =
                    { listLocalId: $state.params.listId,
                      itemLocalId: itemLocalId,
                      itemName: $scope.enteredItem.itemName,
                      categoryName: itemHandler.categoryName(item.itemName),
                      itemCrossed: false,
                      itemQuatity:0,
                      itemUom:"",
                      itemRetailer:""/*,
                      entryCrossedFlag:"0"*/
                    };
          itemHandler.addItemToList($scope.selectedItem);
         $state.reload();
              },
              function(error){
                  console.log('07/02/2017 - listItemCtrl - aalatief:Master Item Local Id error'+JSON.stringify(error));
                  
              }
              );
              
          },
             function(error){
              
              console.log('07/02/2017 - listItemCtrl - aalatief:Master Item errored'+JSON.stringify(error));
          });
        
        

        };

    $scope.isItemChecked = function (listItem){
        x=itemHandler.isItemChecked(listItem);
        console.log( listItem.itemCrossed);
    };

    $scope.allListItemCategoryCrossed = function(category){

      return itemHandler.allListItemCategoryCrossed(category);

    };

/*
  $scope.showPopup = function(listItem) {

  $ionicPopup.show({
    template: '<input type="item name" ng-model="listItem.itemName" placeholder="Enter list name.">',
    templateUrl: 'templates/edit-list-item.html
    title: listItem.itemName,
    subTitle:listItem.itemCategory,
    scope: $scope,
    buttons: [
      { text: 'Cancel' },
      {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          // add your action
        }
      }
    ]
	});
    };*/


  });

