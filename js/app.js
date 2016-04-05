'use strict';

var webqGalleryPlaylistId = 'PLpEUxmlKGIdkkbHbf9aiuhj7_fJ7XIMMt';

var webqMapVidData = function(text){
  var dat = {};
  var lines = text.match(/[^\r\n]+/g);
  dat.phyName = lines[0];
  dat.phySpecialties = lines[1];
  dat.phyURL = lines[2]
  dat.phyPhoto = lines[3];
  dat.question = lines[4];
  return dat;
}

//'PL8B03F998924DA45B';

/********************************
----------------APP--------------
********************************/
var videoGalleryWidget = angular.module('videoGalleryWidget', [
  'ngRoute',
  'dibari.angular-ellipsis'
]);

//WHITELIST THE WEB-Q HOST
videoGalleryWidget.config(['$sceDelegateProvider', function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.
    'http://web-q-hospital.prod.ehc.com/**'
  ]);
}]);

//NAVIGATION
videoGalleryWidget.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/', {
    templateUrl: 'partials/videos.html',
    controller: 'galleryCtrl',
    controllerAs: 'gallery',
    resolve: {
      'youtubeData': function(youtubeService) {
        return youtubeService.getPlaylist();
      }
    }
  }).
  when('/v/:videoId', {
    templateUrl: 'partials/videos.html',
    controller: 'galleryCtrl',
    controllerAs: 'gallery',
    resolve: {
      'youtubeData': function(youtubeService) {
        return youtubeService.getPlaylist();
      }
    }
  }).
  otherwise({
    redirectTo: '/'
  });
}]);

/*************END APP*************/

videoGalleryWidget.constant('YT_event', {
  STOP:            0,
  PLAY:            1,
  PAUSE:           2,
  STATUS_CHANGE:   3
});

/********************************
-------------SERVICES------------
********************************/
videoGalleryWidget.service('youtubeService', function($http, $q) {
  function getPlaylist(pageToken) {
    var apiURL = 'https:\/\/www.googleapis.com\/youtube\/v3\/playlistItems?part=snippet&maxResults=6&playlistId=' +
      webqGalleryPlaylistId +
      '&key=AIzaSyAIaRim_M52Tpr8fiGEItGTQ9Xw5rYUjjI';
    if(pageToken){
      apiURL = apiURL + '&pageToken=' + pageToken;
    }
    var d = $q.defer();
    $http({
      method: 'GET',
      url: apiURL
    }).then(
      function success(response) {
        var data = response.data;
        for (var i=0; i < data.items.length; i++) {
          data.items[i].webq = webqMapVidData(data.items[i].snippet.description);
        }
        d.resolve(data);
      },
      function failure(reason) {
        d.reject(reason);
      });
    return d.promise;
  }
  function getVideo(videoId) {
    var apiURL = 'https:\/\/www.googleapis.com\/youtube\/v3\/videos?part=snippet&maxResults=6&id=' +
      videoId +
      '&key=AIzaSyAIaRim_M52Tpr8fiGEItGTQ9Xw5rYUjjI';
    var d = $q.defer();
    $http({
      method: 'GET',
      url: apiURL
    }).then(
      function success(response) {
        var data = response.data.items[0];
        data.webq = webqMapVidData(data.snippet.description);
        d.resolve(data);
      },
      function failure(reason) {
        d.reject(reason);
      });
    return d.promise;
  }
  return {
    getPlaylist: getPlaylist,
    getVideo: getVideo
  };
});

/**********END SERVICES**********/

/********************************
-----------CONTROLLERS-----------
********************************/
videoGalleryWidget.controller('galleryCtrl', ['$routeParams', '$location', '$anchorScroll', '$scope', '$timeout', 'youtubeData', 'youtubeService', 'YT_event', function($routeParams, $location, $anchorScroll, $scope, $timeout, youtubeData, youtubeService, YT_event) {
// Access 'Controller As' in deeper functions
var ctrl = this;
ctrl.playerStatus = 'NOTPLAYING';
// Get video id from url, default to first video if not in url
if($routeParams.videoId){
  ctrl.videoId = $routeParams.videoId;
  youtubeService.getVideo(ctrl.videoId).then(function(data){
    ctrl.current = data.webq;
  });
} else {
  ctrl.videoId = youtubeData.items[0].snippet.resourceId.videoId;
  ctrl.current = youtubeData.items[0].webq;
}

// Pass data to 'Contoller As'
ctrl.youtubeData = youtubeData;

$scope.$on(YT_event.STATUS_CHANGE, function(event, data) {
    ctrl.playerStatus = data;
});

$scope.YT_event = YT_event
$scope.youtubeControl = function(event){
  $scope.$broadcast(event);
};
$scope.playNewVideo = function(id,data) {
  var me = this;
  ctrl.current = data;
  ctrl.videoId = id;
  var old = $location.hash();
  // set the location.hash to the id of
  // the element you wish to scroll to.
  $location.hash('webq-vg-top');

  // call $anchorScroll()
  $anchorScroll();
  $location.hash(old);
  $location.search('webq-vg-top', null);
  $timeout(function() {
    $scope.$broadcast(YT_event.PLAY);
  }, 0);
};

// Next/Prev API calls
ctrl.next = function(){
 youtubeService.getPlaylist(ctrl.youtubeData.nextPageToken).then(function(data){
    ctrl.youtubeData = data;
  });
};
ctrl.prev = function(){
  youtubeService.getPlaylist(ctrl.youtubeData.prevPageToken).then(function(data){
     ctrl.youtubeData = data;
   });
};

}]); //---------END galleryCtrl---------//
/**********END CONTROLLERS**********/

videoGalleryWidget.directive('youtube', function($window, YT_event) {
  return {
    restrict: "E",
    scope: {
      height: "@",
      width: "@",
      videoid: "@"
    },
    template: '<div></div>',
    link: function(scope, element, attrs, $rootScope) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;

      $window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player(element.children()[0], {
          playerVars: {
            controls: 1,
            color: 'white',
            autoplay: 0,
            disablekb: 1,
            enablejsapi: 1,
            html5: 1,
            iv_load_policy: 3,
            modestbranding: 0,
            showinfo: 0,
            rel: 0
          },

          height: scope.height,
          width: scope.width,
          videoId: scope.videoid,
          events: {
            'onStateChange': function(event) {

              var message = {
                event: YT_event.STATUS_CHANGE,
                data: ""
              };

              switch(event.data) {
                case YT.PlayerState.PLAYING:
                  message.data = "PLAYING";
                  break;
                case YT.PlayerState.ENDED:
                  message.data = "ENDED";
                  player.seekTo(0);
                  player.stopVideo();
                  break;
                case YT.PlayerState.CUED:
                  message.data = "NOTPLAYING";
                  break;
                case YT.PlayerState.PAUSED:
                  message.data = "PAUSED";
                  break;
              }

              scope.$apply(function() {
                scope.$emit(message.event, message.data);
              });
            }
          }
        });
      };

      scope.$watch('height + width', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }
        player.setSize(scope.width, scope.height);
      });

      scope.$watch('videoid', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }
        player.cueVideoById(scope.videoid);
      });

      scope.$on(YT_event.STOP, function () {
        player.seekTo(0);
        player.stopVideo();
      });

      scope.$on(YT_event.PLAY, function () {
        player.playVideo();
      });

      scope.$on(YT_event.PAUSE, function () {
        player.pauseVideo();
      });
    }
  };
});

angular.element(document).ready(function() {
  angular.bootstrap(document, ['videoGalleryWidget']);
});
