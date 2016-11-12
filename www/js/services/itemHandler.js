angular.module('starter.services.itemHandler', [])

  .factory('itemHandler', function () {

    var selected = [];

    //var items = angular.fromJson(window.localStorage['item']||[]);
    var items = window.localStorage['item'] || [];

    var selectedItems = angular.fromJson(window.localStorage['selectedItems'] || []);

    var checkedItems = angular.fromJson(window.localStorage['checkedItems'] || []);

    function saveToLocalStorage() {

      window.localStorage['selectedItems'] = angular.toJson(selectedItems);
    };

    function itemExitInList(selectedItem) {
      for (var j = 0; j < selectedItems.length; j++) {
        if (selectedItems[j].listId === selectedItem.listId && selectedItems[j].itemId === selectedItem.itemId) {
          return true;
        }
      }
      ;
      return false;
    };

    function isItemChecked(listItem) {
      for (var j = 0; j < checkedItems.length; j++) {
        if (checkedItems[j].listId === listItem.listId && checkedItems[j].itemId === listItem.itemId) {
          return true;
        }
      }
      ;
      return false;
    };


    return {
      item: function () {

        return items;
      },

      selectedItem: function () {

        return selectedItems;
      },

      checkedItem: function () {

        return checkedItems;
      },
      selectedItemByListId: function (listId) {
        var specificList = [];

        for (var i = 0; i < selectedItems.length; i++) {
          if (selectedItems[i].listId === listId) {
            specificList.push(selectedItems[i]);
          }
        }
        ;
        return specificList;
      },

      addItemToList: function (selectedItem) {
        if (!itemExitInList(selectedItem)) {
          selectedItems.push(selectedItem);
          saveToLocalStorage();
        }
      },

      checkItem: function (listItem) {
        if (!isItemChecked(listItem)) {
          checkedItems.push(listItem);
          window.localStorage['checkedItems'] = angular.toJson(checkedItems);
        }
      },
      removeListItem: function (listItem) {
        for (var k = 0; k < selectedItems.length; k++) {
          if ((selectedItems[k].id === listItem.id) && (selectedItems[k].listId === listItem.listId)) {
            selectedItems.splice(k, 1);
            saveToLocalStorage();
            return;
          }
        }
        ;

      },

      AddMasterItem: function () {
        if (!itemExitInList(selectedItem)) {
          selectedItems.push(selectedItem);
          saveToLocalStorage();
        }
      },

      deleteAll: function () {

        for (var i = 0; i < selectedItems.length; i++) {

          selectedItems.splice(i, 1);
          saveToLocalStorage();
        }
      }

    };
  });
