function noughtsAndCrossesController ($window, $timeout, socket) {
  let ctrl = this;
  //binary record of players moves
  function reset() {
    ctrl.gridState      = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.mySymbol       = ['X','0'];
    ctrl.gridRemaining = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.joinRoomNum    = null;
    ctrl.roomNum        = null;
    ctrl.myTurn         = true;
    ctrl.rcvdMove       = false;
    ctrl.mpGame         = false;
    ctrl.multiplayer    = false;
    ctrl.rcvdMove       = false;
  }

  function convMarkIdBin(id) {
    /* passed move number returns binary conversion (in decimal)*/
      let blankGrid = [[0,0,0],[0,0,0],[0,0,0]];
      blankGrid[id[0]][id[1]] = 1;
      return parseInt(blankGrid.map((key) => key.map((key) => key === 2 ? 0 : key).join('')).join(''),2);
  }
  
  function convBinMarkId(data) {
    /* passed move number converts to gridState id for markBoard*/
    let arr = data.toString(2).split('');
    if (arr.length <=3) {
      let retArr = [2]
      let diff = 3 - arr.length
      retArr.push(arr.indexOf('1')+diff);
      return retArr;
    } else if (arr.length <=6) {
      let retArr = [1]
      let diff = 6 - arr.length
      retArr.push(arr.indexOf('1')+diff);
      return retArr;
    } else if (arr.length <=9) {
      let retArr = [0]
      let diff = 9 - arr.length
      retArr.push(arr.indexOf('1')+diff);
      return retArr;
    }
  }

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

    reset();

  }

  ctrl.markBoard = (id) => {
    /* Accepts gridState id in form of array with initial value indicating the moves row
    |* and second value indicating index in that row */
    if (ctrl.gridRemaining[id[0]][id[1]] === 0) {
      if (ctrl.multiplayer) {
        if (ctrl.myTurn) {
          ctrl.gridState[id[0]][id[1]] = 1;
          ctrl.mpMoveEmit(convMarkIdBin(id));
          ctrl.myTurn = false;
        } else if (ctrl.rcvdMove) {
          ctrl.gridState[id[0]][id[1]] = 2;
          ctrl.myTurn = true;
        }
      } else {
        if (ctrl.myTurn) {
          ctrl.gridState[id[0]][id[1]] = 1;
        } else {
          ctrl.gridState[id[0]][id[1]] = 2;
        }
        console.log(convGridBin(ctrl.gridState));
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
      ctrl.rcvdMove = true;
      ctrl.markBoard(convBinMarkId(update.move));
      ctrl.rcvdMove = false;
    }
  });

  socket.on('draw', function(update) {
    if (update && !ctrl.myTurn) {
      ctrl.rcvdMove = true;
      ctrl.markBoard(convBinMarkId(update.move));
      ctrl.rcvdMove = false;
    }
    $window.alert('Cats Game');
  });

  socket.on('win', function() {
    $window.alert('You won');
    //allow reset without leaving room
  });

  socket.on('lose', function(update) {
    if (update && !ctrl.myTurn) {
      ctrl.rcvdMove = true;
      ctrl.markBoard(convBinMarkId(update.move));
      ctrl.rcvdMove = false;
    }
    $window.alert('You lost');
    //allow reset without leaving room
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