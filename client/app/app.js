(function() {

  'use strict';

  angular
    .module('myblogApp', [
		  'ngCookies',
		  'ngResource',
		  'ngSanitize',
		  'btford.socket-io',
		  'ui.router',
		  'ui.bootstrap'
		])
    .config(config)
    .factory('authInterceptor', authInterceptor)
    .service('Compress_ready', compress_ready)
    .run(run);

  /* @ngInject */
  function config($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    $httpProvider.interceptors.push('authInterceptor');
  }

  /* @ngInject */
  function run($rootScope, $location, Auth) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      console.log($location);
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $location.path('/');
        }
      });
    });
  }

  function compress_ready($q){
    var dataURItoBlob = function(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
      else
        byteString = unescape(dataURI.split(',')[1]);
   
      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
   
      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
   
      return new Blob([ia], {
        type: mimeString
      });
    };
   
    var resizeFile = function(file) {
      
      var deferred = $q.defer();
      var img = document.createElement("img");
      try {
        var reader = new FileReader();
        reader.onload = function(e) {
          img.src = e.target.result;
          //resize the image using canvas
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          var MAX_WIDTH = 800;
          var MAX_HEIGHT = 480;
          var width = img.width;
          var height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
   
          //change the dataUrl to blob data for uploading to server
          var dataURL = canvas.toDataURL('image/png');
          var blob = dataURItoBlob(dataURL);
   
          deferred.resolve(blob);
        };
        reader.readAsDataURL(file);
      } catch (e) {
        deferred.resolve(e);
      }
      return deferred.promise;
   
    };
    return {
      resizeFile: resizeFile
    };
  };

  /* @ngInject */
  function authInterceptor($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')&&config.url.match(/^\\(auth|api)/)) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  }

})();  