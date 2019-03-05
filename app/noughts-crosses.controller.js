function noughtsAndCrossesController ($rootScope, socket) {
  let ctrl = this;
  //binary record of players moves
  ctrl.playerBoard = 0;
  ctrl.mySymbol = ['X','0'];
  ctrl.multiplayer = true;
  ctrl.myTurn = true;
  ctrl.rcvdMove = false;
  ctrl.remainingBoard = [0,1,2,3,4,5,6,7,8]

  ctrl.$onInit = () => {
    socket.on('connect', function () {
      console.log('connected!');
    });

  }

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