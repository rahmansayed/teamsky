angular.module('starter.controllers.editListItemCtrl', [])
  .controller('editListItemCtrl', function ($scope, $state, listHandler, itemHandler, $ionicPopup) {

    
    
   
    
    
    $scope.listItem=angular.copy( itemHandler.getItemById($state.params.listItemId));
    $scope.dynamicEditTitle = $scope.listItem.itemName;
    
    
    /*$scope.saveItem=function(listItem){

        itemHandler.updateListItem(listItem);
        $state.go('list');
    };*/
    
//
//    $scope.data = { "items" : [], "search" : '' };
//
//    $scope.search = function() {
//
//    	itemHandler.searchItems($scope.data.search).then(
//    		function(matches) {
//    			$scope.data.items = matches;
//    		}
//    	)
//    };
//    
//        
//    $scope.editListItem=function(listItem){
//      $scope.selectedForEdit = listItem;
//    console.log($scope.selectedForEdit.itemId);
//    console.log($scope.selectedForEdit.listId);
//    $state.go('edit-list-item',{'listItemId':listItem.itemId,'listId':listItem.listId});
//  
//    };
//    
//    
//    
//  /*Add searched item to current list*/
//    var selected = [itemHandler.selected];
//      $scope.selectItems = function (item) {
//          
//          $scope.selecteditem = 
//                    { listId: $state.params.listId,
//                      itemId: item.id,
//                      itemName: item.name,
//                      itemCategory: itemHandler.itemCategory(item.name),
//                      itemCrossed: false
//                    };
//          itemHandler.addItemToList($scope.selecteditem);
//           $state.reload();
//    
//      };
//    
//    
//    
//    
//    $scope.checkedItems = itemHandler.checkedItem();
//    $scope.listItems = itemHandler.selectedItemByListId($state.params.listId);
//    
//    $scope.itemCategory = itemHandler.itemCategory;
//    
//    /*Group items by category-- Not Neede now, I used different way*/
//   /*
//   $scope.shownListItems = [];
//   var itemCategory;
//
//    for(var i = 0; i < $scope.listItems.length; i++) {
//	   itemCategory = $scope.listItems[i].itemCategory ;
//    
//    console.log('Seq: ' + i);
//    console.log('Current item Name: '+$scope.listItems[i].itemName);
//    console.log('Current item Category: '+itemCategory);    
//    console.log('Shown Category Befor Update: ' + $scope.shownListItems[itemCategory]);
//	if(!$scope.shownListItems[itemCategory]) $scope.shownListItems[itemCategory] = [];
//    console.log('Shown Category After Update: ' + $scope.shownListItems[itemCategory]);
//	$scope.shownListItems[itemCategory].push ( $scope.listItems[i].itemName + ' ' + $scope.listItems[i].itemCategory );
//    console.log('Value Pushed is: ' + $scope.listItems[i].itemName + ' ' + $scope.listItems[i].itemCategory);    
//}  ;
//    */
//
//    
//    
//    
//    $scope.AddListItem= function (){
//        
//        $state.go('addItem',{'listId':$state.params.listId});
//        
//    };
//    
//    $scope.removeFromList = function(listItem){
//             
//       var confirmPopup = $ionicPopup.confirm({
//         title: 'Delete Item from List',
//         template: 'Are you sure you want to delete this item?'
//       });
//
//       confirmPopup.then(function(res) {
//         if(res){
//                    itemHandler.removeListItem(listItem);
//                    $state.reload();
//                } 
//       });
//            
//    };
//
//    $scope.list=angular.copy( listHandler.get($state.params.listId));
//    $scope.dynamicListTitle = $scope.list.title;
//    
//    $scope.itemChecked = function(listItem){
//        
//        $scope.checkeditem = 
//                    { listId: $state.params.listId,
//                      itemId: listItem.itemId,
//                      itemName:listItem.itemName
//                    };
//        itemHandler.checkItem($scope.checkeditem);
//    };
//    
//    
//    
//    $scope.unCheckItem = function(checkedItem){
//
//     itemHandler.unCheckItem(checkedItem);
//};
//
//    
//    /*Search Item Part*/
//    $scope.data = { "items" : [], "search" : '' };
//
//    $scope.search = function() {
//
//    	itemHandler.searchItems($scope.data.search).then(
//    		function(matches) {
//    			$scope.data.items = matches;
//    		}
//    	)
//    };
//    
//    $scope.AddMasterItem = function(itemName){
//        
//         console.log('Add Master Item Case: ' + itemName);
//         $scope.enteredItem = 
//                    { id: new Date().getTime().toString(),
//                      name: itemHandler.initcap(itemName),
//                      category: 'Uncategorized'
//                    };
//          itemHandler.AddMasterItem($scope.enteredItem);
//
//        $scope.selecteditem = 
//                        { listId: $state.params.listId,
//                          itemId: $scope.enteredItem.id,
//                          itemName: $scope.enteredItem.name,
//                          itemCategory:itemHandler.itemCategory($scope.enteredItem.name),
//                          itemCrossed: false
//                        };
//              itemHandler.addItemToList($scope.selecteditem);
//           $state.reload();
//            
//        };
//    
//    $scope.isItemChecked = function (listItem){
//        x=itemHandler.isItemChecked(listItem);
//        console.log( listItem.itemCrossed);
//    };
//    
//    $scope.allListItemCategoryCrossed = function(category){
//        
//      return itemHandler.allListItemCategoryCrossed(category);  
//
//    };


  });

