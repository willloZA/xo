function noughtsAndCrossesController (socket) {
  let ctrl = this;
  //binary record of players moves
  ctrl.playerBoard = 0;
  ctrl.remainingBoard = [0,1,2,3,4,5,6,7,8]

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

    let room = 'testRoom'
    socket.emit('room', room, () => {
      console.log(`connected to ${room}!`);
    });

    socket.on('message', function (data) {
      console.log(data);
    });
  }

  ctrl.updateBoard = (id) => {
    
  };

}

angular
  .module('noughtsAndCrosses')
  .controller('noughtsAndCrossesController', noughtsAndCrossesController)