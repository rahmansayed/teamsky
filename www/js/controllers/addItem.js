angular.module('starter.controllers')
  .controller('addItem', function ($scope, $state, listHandler, itemHandler, $http) {

          $scope.item = [];
        /*$http.get('https://secret-savannah-80432.herokuapp.com/api/items').success(function(data) {
                  $scope.item = data;
                    console.log($scope.item);*/



      $scope.category =  angular.fromJson(window.localStorage['category']||[]);
         /*['Beverages','Canned & Packaged Foods','Bakery, Breakfast, Cereal','Frozen Foods','Miscellaneous Kitchen Items','Fruits & Vegetables','Refrigerated Foods'];*/
      $scope.selectedItems = itemHandler.selectedItem();
      $scope.item =itemHandler.item();
     /*[                 {
                            id:'1',
                            name:'Apple Juice',
                            category:'Beverages'
                        },
                        {
                            id:'2',
                            name:'Beer, bottle, pilsener, import',
                            category:'Beverages'
                        }  ,
                        {
                            id:'3',
                            name:'Beer, can',
                            category:'Beverages'
                        }
                      ,
                        {
                            id:'4',
                            name:'Coffee',
                            category:'Beverages'
                        }
                      ,
                        {
                            id:'5',
                            name:'Milk',
                            category:'Beverages'
                        }
                     ,
                        {
                            id:'6',
                            name:'Milk, organic',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'7',
                            name:'Orange Juice, not from concentrate',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'8',
                            name:'Soda, bottle',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'9',
                            name:'Soda, bottle (Coke product)',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'10',
                            name:'Soda, can',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'11',
                            name:'Soda, can (Coke product)',
                            category:'Beverages'
                        }
                    ,
                        {
                            id:'12',
                            name:'Apple Sauce',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'13',
                            name:'Bread Crumbs',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'14',
                            name:'Chicken Noodle Soup, condensed',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'15',
                            name:'Chicken Noodle Soup, regular',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'16',
                            name:'Chips, potato chips',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'17',
                            name:'Flour, all purpose',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'18',
                            name:'Green Beans, canned',
                            category:'Canned & Packaged Foods'
                        }
                    ,
                        {
                            id:'19',
                            name:'Bread, 12 grain',
                            category:'Bakery, Breakfast, Cereal'
                        }
                    ,
                        {
                            id:'20',
                            name:'Baguette/French Bread',
                            category:'Bakery, Breakfast, Cereal'
                        }
                    ,
                        {
                            id:'21',
                            name:'White Bread/Toast, enriched',
                            category:'Bakery, Breakfast, Cereal'
                        }
                    ,
                        {
                            id:'22',
                            name:'Oat Meal',
                            category:'Bakery, Breakfast, Cereal'
                        }

                    ];
      window.localStorage['item'] = angular.toJson($scope.item) ;
      window.localStorage['category'] = angular.toJson($scope.category) ;*/

      $scope.groups = [];
      $scope.groupedItems = [];

      $scope.getGroupedItem = function (category){
                     $scope.groupedItems = [];
                     for (k=0;k<$scope.item.length;k++){
                          if ($scope.item[k].category===category){
                              $scope.groupedItems.push($scope.item[k]);
                          }
                      };
                    return $scope.groupedItems;
                };

      for (var i=0; i<$scope.category.length; i++) {
          $scope.groups[i]= {
                              name: $scope.category[i],
                              items:$scope.getGroupedItem($scope.category[i]),
                              show: false
                            }
                          ;
      for (var j=0; j<3 ; j++) {
          $scope.groups[i].items.push(i + '-' + j);
        }
      };
        /*});*/

      /*
       * if given group is the selected group, deselect it
       * else, select the given group
       */
      $scope.toggleGroup = function(group) {
        group.show = !group.show;
      };
      $scope.isGroupShown = function(group) {
        return group.show;
      };
      /*itemHandler.deleteAll();*/
      var selected = [itemHandler.selected];
      $scope.selectItems = function (item) {

          $scope.selectedItem =
                    { listId: $state.params.listId,
                      itemId: item.itemlocalId,
                      itemName: item.itemName,
                      ItemCrossed: 0,
                      language: item.language
                    };
          console.log('select item: '+$scope.selectedItem)
          itemHandler.addItemToList($scope.selectedItem);

          /*Multiple Mark of selected*/
          var index = selected.indexOf(item);
          if (index > -1) {
                selected.splice(index, 1);
                item.selected = false;
              }
        else {
                selected.push(item);
                item.selected = true;
            }
      };



  });

