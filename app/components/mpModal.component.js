let mpModalComponent = {
  templateUrl: './components/mpModal.template.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: function (socket) {
    let $ctrl = this;
    $ctrl.nonHost = 'Leave room or wait for the Host to restart';

    $ctrl.$onInit = () => {
      $ctrl.message = $ctrl.resolve.message;
      if ($ctrl.resolve.host) {
        $ctrl.host = true;
      }
    };

    socket.on('close-modal',() => {
      $ctrl.close({$value: 'close'});
    });

    socket.on('opponent-disconnected', function (d) {
      // socket.emit('leave-room');
      $ctrl.close();
    });

    $ctrl.restart = () => {
      $ctrl.close({$value: 'restart'});
    };

    $ctrl.leave = () => {
      $ctrl.close({$value: 'leave'});
    };
  }
}

angular
  .module('noughtsAndCrosses')
  .component('mpModalComponent', mpModalComponent);