myapp = angular.module('starter');
myapp.config(function ($stateProvider, $urlRouterProvider) {

  $stateProvider
    
    .state('config', {
      cache: false,
      url: '/config',
      templateUrl: 'templates/config.html'
    })
    .state('lists', {
      cache: false,
      url: '/lists',
      templateUrl: 'templates/lists.html',
      controller: 'listCtrl'
    })
    .state('edit', {
      cache: false,
      url: '/edit/:listId',
      templateUrl: 'templates/edit.html',
      controller: 'editCtrl'
    })

    .state('add', {
      cache: false,
      url: '/add',
      templateUrl: 'templates/edit.html',
      controller: 'addListCtrl'
    })

    .state('masterItem', {
      cache: false,
      url: '/masteritem',
      templateUrl: 'templates/masteritem.html'
    })

    .state('item', {
      cache: false,
      url: '/item/:listId',
      templateUrl: 'templates/items.html',
      controller:'listItem'
      
    })

    .state('addItem', {
      cache: false,
      url: '/addItem/:listId',
      templateUrl: 'templates/addItems.html'
    })

    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:

    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'DashCtrl'
        }
      }
    })

    .state('tab.list', {
      url: '/list',
      views: {
        'tab-list': {
          templateUrl: 'templates/tab-list.html',
          controller: 'ListCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

    .state('account', {
      url: '/account',
      templateUrl: 'templates/account.html',
      controller: 'AccountCtrl'
    })

    .state('verify', {
      url: '/verify',
      templateUrl: 'templates/verify.html',
      controller: 'verifyCtrl'
    })

    .state('tab.list.add', {
      url: '/add-item',
      views: {
        'tab-list': {
          templateUrl: 'templates/add-item.html',
          controller: 'AddItemCtrl'
        }
      }
    })
  
    .state('edit-list-item', {
      cache: false,
      url: '/edit-list-item/{:listItemId,:listId}',
      templateUrl: 'templates/edit-list-item.html',
      controller: 'editListItemCtrl'
    })

    .state('listDtls', {
      url: '/listDtls',
          templateUrl: 'templates/list-details.html',
          controller: 'listDtlsCtrl'
      })
           
   .state('subscribe', {
      url: '/subscribe',
          templateUrl: 'templates/subscribe.html'
      }
    )
     .state('contact', {
      url: '/contact',
          templateUrl: 'templates/contact.html'
      }
    )
  

  ;

// if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/config');
  //$urlRouterProvider.otherwise('/account');
})
;
