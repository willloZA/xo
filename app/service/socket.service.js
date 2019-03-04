let socket = ($rootScope) => {
  let url = '';
  //use url in connection for setting up namespaces when hosting
  let socket = io.connect();
  return {
    on: function (eventName, cb) {
      socket.on(eventName, function () {
        let args = arguments;

        $rootScope.$apply(function () {
          cb.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, cb) {
      socket.emit(eventName, data, function () {
        let args = arguments;

        $rootScope.$apply(function () {
          cb.apply(socket, args);
        });
      });
    }
  };
}

angular
  .module('noughtsAndCrosses')
  .factory('socket', socket);