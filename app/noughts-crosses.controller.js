function noughtsAndCrossesController ($window, $timeout, $uibModal, socket, game) {
  let ctrl = this;
  
  ctrl.multiCollapsed = true;
  ctrl.availRooms     = [];

  function reset() {
    ctrl.gridState      = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.mySymbol       = ['X','0'];
    ctrl.gridRemaining  = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.players        = 0;
    ctrl.joinRoomNum    = null;
    ctrl.roomNum        = null;
    ctrl.myTurn         = true;
    ctrl.rcvdMove       = false;
    ctrl.mpGame         = false;
    ctrl.multiplayer    = false;
    ctrl.rcvdMove       = false;
    ctrl.inRoom         = false;
  }

  function mpStart() {
    ctrl.gridState = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.gridRemaining = [[0,0,0],[0,0,0],[0,0,0]];
    ctrl.myTurn = false;
    if (ctrl.mySymbol[0] === 'X') ctrl.myTurn = true;
    ctrl.multiplayer = true;
    ctrl.mpGame = true;
    console.log('mpStart!');
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

  ctrl.openComponentModal = (message) => {

    let comp       = 'spModalComponent',
        resolveObj = {
                        message: () => message
                      };
    if (ctrl.multiplayer) {
      comp = 'mpModalComponent';
      if (ctrl.opDisconnect) {
        resolveObj.disconnect = true;
      }
      if (ctrl.mySymbol[0] === 'X') {
        resolveObj.host = true;
      }
    }
    console.log(message,comp,resolveObj);
    let modalInstance = $uibModal.open({
      animation: true,
      component: comp,
      size: 'sm',
      resolve: resolveObj
    });

    modalInstance.result.then((resp) => {
      if (resp) {
        if (resp === 'restart') {
          socket.emit('restart');
          mpStart();
        } else if (resp === 'leave') {
          $window.location.reload();
          /* socket.emit('leave-room');
          //replace with service call to reload any save sp game state
          game.clear();
          reset(); */
        } else if ('close') {
          mpStart();
        }
      } else {
        game.clear();
        reset();
      }
    }, () => {
      console.log('modal-component dismissed at: ' + new Date().toUTCString());
    });
  };

  ctrl.leaveGame = () => {
    //temp
    socket.emit('leave-room');
    // reset();
    $window.location.reload();
  }

  ctrl.markBoard = (id,cb) => {
    /* Accepts gridState id in form of array with initial value indicating the moves row
    |* and second value indicating index in that row */
    if (ctrl.gridRemaining[id[0]][id[1]] === 0) {
      if (ctrl.multiplayer) {
        if (ctrl.myTurn) {
          ctrl.gridState[id[0]][id[1]] = 1;
          ctrl.mpMoveEmit(convMarkIdBin(id));
          ctrl.gridRemaining[id[0]][id[1]] = 1
          ctrl.myTurn = false;
        } else if (ctrl.rcvdMove) {
          ctrl.gridState[id[0]][id[1]] = 2;
          ctrl.gridRemaining[id[0]][id[1]] = 1
          ctrl.myTurn = true;
        }
      } else {
        if (ctrl.myTurn) {
          let data = game.move(ctrl.mySymbol[0], id);
          if (data) {
            ctrl.gridState[data.move[0]][data.move[1]] = 1;
            if (data.result) {
              if (data.result === 'wins') {
                let message = `${ctrl.mySymbol[0]} ${data.result}!`;
                $timeout(() => {ctrl.openComponentModal(message);},150);
              } else {
                let message = 'Cats game!';
                $timeout(() => {ctrl.openComponentModal(message);},150);
              }
            } else {
              ctrl.gridRemaining[id[0]][id[1]] = 1
              ctrl.myTurn = !ctrl.myTurn;
            }
          }
        } else {
          let data = game.move(ctrl.mySymbol[1], id);
          if (data) {
            ctrl.gridState[data.move[0]][data.move[1]] = 2;
            if (data.result) {
              if (data.result === 'wins') {
                let message = `${ctrl.mySymbol[1]} ${data.result}!`;
                $timeout(() => {ctrl.openComponentModal(message);},150);
              } else {
                let message = 'Cats game!';
                $timeout(() => {ctrl.openComponentModal(message);},150);
              }
            } else {
              ctrl.gridRemaining[id[0]][id[1]] = 1;
              ctrl.myTurn = !ctrl.myTurn;
            }
          }
        }
      }
    }
    if (cb) cb();
  };

  socket.on('available-rooms', (arr) => {
    ctrl.availRooms = arr;
  });

  socket.on('player-count', (count) => {
    ctrl.players = count;
  });

  socket.on('game-start', () => {
    // X first turn 0 second turn
    ctrl.waitingRoom = false;
    mpStart();
    console.log('game started!');
  });

  socket.on('cont', function(update) {
    console.log(update);
    if (update && !ctrl.myTurn) {
      ctrl.rcvdMove = true;
      console.log(convBinMarkId(update.move),ctrl.gridRemaining);
      ctrl.markBoard(convBinMarkId(update.move),() => {
        ctrl.rcvdMove = false;
      });
    }
  });

  socket.on('draw', function(update) {
    if (update && !ctrl.myTurn) {
      ctrl.rcvdMove = true;
      ctrl.markBoard(convBinMarkId(update.move),() => {
        ctrl.rcvdMove = false;
        let message = 'Cats Game';
        $timeout(() => {ctrl.openComponentModal(message);},150);
      });
    } else {
      let message = 'Cats Game';
      $timeout(() => {ctrl.openComponentModal(message);},150);
    }
    //allow reset without leaving room
  });

  socket.on('mp-win', function() {
    let message = 'You won';
    $timeout(() => {ctrl.openComponentModal(message);},150);
    //allow reset without leaving room
  });

  socket.on('lose', function(update) {
    if (update && !ctrl.myTurn) {
      ctrl.rcvdMove = true;
      ctrl.markBoard(convBinMarkId(update.move),() => {
        ctrl.rcvdMove = false;
        //window alerts should never be used (halt digest and socket comms, require timeouts to move into next digest cycle)
        let message = 'You lost';
        $timeout(() => {ctrl.openComponentModal(message);},150);
      });
    }
    //allow reset without leaving room
  });

  socket.on('joined-room', function (d) {
    console.log(d);
    ctrl.roomNum      = d.room;
    ctrl.mySymbol     = d.symbol;
    ctrl.multiplayer  = true;
    ctrl.myTurn = false;
    console.log('joinedRoom!');
  });

  socket.on('alert', function (d) {
    // alert or modal alert message on opponent disconnect
    console.log(d);
  });

  socket.on('opponent-disconnected', function (d) {
    socket.emit('leave-room');
    // reset();
    ctrl.opDisconnect = true;
    $timeout(() => {ctrl.openComponentModal(d.alert);},150);
  });

  ctrl.createRoom = () => {
    socket.emit('create-room');
    ctrl.waitingRoom = true;
    ctrl.inRoom = true;
  };

  ctrl.joinRoom = (id) => {
    socket.emit('join-room', parseInt(id));
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
}

angular
  .module('noughtsAndCrosses')
  .controller('noughtsAndCrossesController', noughtsAndCrossesController)