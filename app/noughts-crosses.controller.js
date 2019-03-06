function noughtsAndCrossesController ($scope, $window, socket) {
  let ctrl = this;
  //binary record of players moves
  function reset() {
    ctrl.mySymbol       = ['X','0'];
    ctrl.remainingBoard = [1,2,4,8,16,32,64,128,256]
    ctrl.playerBoard    = 0;
    ctrl.joinRoomNum    = null;
    ctrl.createRoomNum  = null;
    ctrl.roomNum        = null;
    ctrl.myTurn         = true;
    ctrl.multiplayer    = false;
    ctrl.mpGame         = false;
    ctrl.rcvdMove       = false;
  }

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

    reset();

  }

  socket.on('game-start', () => {
    // X first turn 0 second turn
    if (ctrl.mySymbol[0] === 'X') ctrl.myTurn = true;
    ctrl.mpGame = true;
    console.log('game started!');
  });

  socket.on('cont', function(update) {
    if (update && !ctrl.myTurn) {
      angular.element(document.getElementById(update.move)).triggerHandler('click');
    }
    ctrl.myTurn = !ctrl.myTurn;
  });

  socket.on('draw', function(update) {

  });

  socket.on('win', function() {
    console.log('winner');

  });

  socket.on('lose', function(update) {
    angular.element(document.getElementById(update.move)).triggerHandler('click');
    console.log('loser');

  });

  socket.on('joined-room', function (d) {
    console.log(d);
    ctrl.roomNum      = d.room;
    ctrl.mySymbol     = d.symbol;
    ctrl.multiplayer  = true;
    ctrl.myTurn = false;
  });

  socket.on('alert', function (d) {
    // alert or modal alert message on opponent disconnect
    console.log(d);
  });

  socket.on('opponent-disconnected', function (d) {
    socket.emit('leave-room');
    //cheap way of resetting played directives/ look at using GameService to communicate changes between controller and directives
    $window.alert(d.alert);
    $window.location.reload();
  });

  ctrl.createRoom = () => {
    socket.emit('create-room');
  };

  ctrl.joinRoom = () => {
    socket.emit('join-room', parseInt(ctrl.joinRoomNum));
  };

  ctrl.mpMoveEmit = (id) => {
    console.log('mp : ' + id);
    let moveObj = {
      room: ctrl.roomNum,
      move: id
    };
    socket.emit('mp-move', moveObj)
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