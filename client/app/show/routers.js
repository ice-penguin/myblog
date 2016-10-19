(function () {

  'use strict';

  angular
    .module('myblogApp')
    .config(config);

  /* @ngInject */
  function config($stateProvider) { 
    $stateProvider
    .state('index', {
      url: '/',
      templateUrl: 'app/show/index.html',
      controller: 'IndexCtrl'
    });
  }

})();  