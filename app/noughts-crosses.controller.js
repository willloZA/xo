function noughtsAndCrossesController ($rootScope, socket) {
  let ctrl = this;
  //binary record of players moves
  function reset() {
    ctrl.mySymbol       = ['X','0'];
    ctrl.remainingBoard = [0,1,2,3,4,5,6,7,8]
    ctrl.playerBoard    = 0;
    ctrl.joinRoomNum    = null;
    ctrl.createRoomNum  = null;
    ctrl.roomNum        = null;
    ctrl.multiplayer    = false;
    ctrl.myTurn         = true;
    ctrl.rcvdMove       = false;
  }

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

    reset();

  }

  socket.on('joined-room', function (d) {
    console.log(d);
    ctrl.roomNum      = d.room;
    ctrl.mySymbol     = d.symbol;
    ctrl.multiplayer  = true;
    // X first turn 0 second turn
    if (d.symbol[0] === '0') ctrl.myTurn = false
  });

  socket.on('alert', function (d) {
    // alert or modal alert message on opponent disconnect
    console.log(d);
  });

  socket.on('opponent-disconnected', function (d) {
    // alert or modal alert message on opponent disconnect
    console.log(d)
    socket.emit('leave-room');
    reset();
  });

  ctrl.createRoom = () => {
    socket.emit('create-room');
  };

  ctrl.joinRoom = () => {
    socket.emit('join-room', parseInt(ctrl.joinRoomNum));
  };

  ctrl.mpMoveEmit = (id) => {
    console.log('mp : ' + id);
    ctrl.myTurn = !ctrl.myTurn;
  };

  ctrl.spMoveEmit = (id) => {
    console.log('sp : ' + id);
    ctrl.myTurn = !ctrl.myTurn;
  };

}

angular
  .module('noughtsAndCrosses')
  .controller('noughtsAndCrossesController', noughtsAndCrossesController)