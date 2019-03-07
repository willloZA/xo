function noughtsAndCrossesController ($window, socket) {
  let ctrl = this;
  //binary record of players moves
  function reset() {
    ctrl.gridState      = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.mySymbol       = ['X','0'];
    ctrl.gridRemaining = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.joinRoomNum    = null;
    ctrl.roomNum        = null;
    ctrl.myTurn         = true;
    ctrl.mpGame         = false;
    ctrl.multiplayer    = false;
    ctrl.rcvdMove       = false;
  }

  function convGrid(arr) {
    return parseInt(arr.slice().map((key) => key.map((key) => key === 2 ? 0 : key).join('')).join(''),2);
  }

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

    reset();

  }

  ctrl.markBoard = (id) => {
    if (ctrl.gridRemaining[id[0]][id[1]] === 0) {
      if (ctrl.multiplayer) {
        if (ctrl.myTurn) {
          ctrl.gridState[id[0]][id[1]] = 1;
          console.log(convGrid(ctrl.gridState));
          ctrl.myTurn = false;
        }
      } else {
        if (ctrl.myTurn) {
          ctrl.gridState[id[0]][id[1]] = 1;
        } else {
          ctrl.gridState[id[0]][id[1]] = 2;
        }
        console.log(convGrid(ctrl.gridState));
        ctrl.gridRemaining[id[0]][id[1]] = 1
        ctrl.myTurn = !ctrl.myTurn;
      }
    }
  };

  socket.on('game-start', () => {
    // X first turn 0 second turn
    if (ctrl.mySymbol[0] === 'X') ctrl.myTurn = true;
    ctrl.mpGame = true;
    console.log('game started!');
  });

  socket.on('cont', function(update) {
    if (update && !ctrl.myTurn) {
      console.log(update);
    }
    ctrl.myTurn = !ctrl.myTurn;
  });

  socket.on('draw', function(update) {

  });

  socket.on('win', function() {
    console.log('winner');

  });

  socket.on('lose', function(update) {
    
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
    $window.alert(d.alert);
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