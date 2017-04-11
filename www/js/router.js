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

    .state('item', {
      cache: false,
      url: '/item',
      templateUrl: 'templates/items.html',
      controller:'listItem'

    })

    // Each tab has its own nav history stack:
   
    .state('language', {
      url: '/language',
      templateUrl: 'templates/language.html',
      controller: 'langCtrl'
    })


    .state('account', {
      url: '/account',
      templateUrl: 'templates/account.html',
      controller: 'accountCtrl'
    })

    .state('verify', {
      url: '/verify',
      templateUrl: 'templates/verify.html',
      controller: 'verifyCtrl'
    })


   .state('subscribe', {
      url: '/subscribe',
          templateUrl: 'templates/subscribe.html'
      }
    )


  ;

// if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/config');
  //$urlRouterProvider.otherwise('/account');
})
;
