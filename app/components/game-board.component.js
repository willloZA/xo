let gameBoard = {
  bindings: {
    grid: '<',
    symbol: '<',
    onMark: '&'
  },
  templateUrl: './components/game-board.template.html',
  controller: function () {

    let ctrl = this;

    ctrl.classGrid = [['','vert',''],
                      ['hori','vert hori','hori'],
                      ['','vert','']];


    ctrl.mark = ($event) => {
      ctrl.onMark({ id: JSON.parse($event.srcElement.id) });
    };
    
  }
}

angular
  .module('noughtsAndCrosses')
  .component('gameBoard', gameBoard);