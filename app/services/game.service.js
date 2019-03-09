let game = (socket) => {
  let moveStatesTemp  = {
                        turn: ['X', '0'],
                        board: 0,
                        'X': 0,
                        '0': 0
                      },
      moveStates      = JSON.parse(JSON.stringify(moveStatesTemp));

  const winCombination = [
    parseInt('111000000',2),
    parseInt('000111000',2),
    parseInt('000000111',2),
    parseInt('100100100',2),
    parseInt('010010010',2),
    parseInt('001001001',2),
    parseInt('100010001',2),
    parseInt('001010100',2)
  ];

  let convMarkIdBin = (id) => {
    /* passed move number returns binary conversion (in decimal)*/
      let blankGrid = [[0,0,0],[0,0,0],[0,0,0]];
      blankGrid[id[0]][id[1]] = 1;
      return parseInt(blankGrid.map((key) => key.map((key) => key === 2 ? 0 : key).join('')).join(''),2);
  }
  
  let validate = (state) => {
    if (moveStates.board === 511) return 'draw'
    for (let idx = 0; idx < winCombination.length; idx++) {
      if ((state & winCombination[idx]) === winCombination[idx]) {
        /* console.log((state & winCombination[idx]).toString(2) + ' or ' + (state & winCombination[idx]));
        console.log(winCombination[idx].toString(2) + ' or ' + winCombination[idx]);
        console.log((state & winCombination[idx])===winCombination[idx]); */
        return 'wins'
      }
    }
    return null;
  }

  return {
    move: (player, _id) => {
      let id = convMarkIdBin(_id);
      if (player === moveStates.turn[0]) {
        moveStates[player] |= id;
        moveStates.board   |= id;
        moveStates.turn.reverse();
        let result = validate(moveStates[player]);
        return { move: _id, result: result};
      }
    },
    clear: () => {
      moveStates = JSON.parse(JSON.stringify(moveStatesTemp));
    }
  };
}

angular
  .module('noughtsAndCrosses')
  .factory('game', game);