function xo () {
  return {
      restrict: 'A',
      link: ($scope, $element) => {

        function move(e) {
          e.preventDefault();
          let elId = parseInt($element[0].id);
          let indexOf = $scope.$ctrl.remainingBoard.indexOf(elId)
          let multi = $scope.$ctrl.multiplayer;
          let myTurn = $scope.$ctrl.myTurn;
          let rcvdMove = $scope.$ctrl.rcvdMove;
          let mySymbol = $scope.$ctrl.mySymbol;

          if (indexOf > -1) {
            
            if (!multi) {

              $element[0].innerText = (myTurn) ? mySymbol[0] : mySymbol[1];
              $scope.$ctrl.remainingBoard.splice(indexOf, 1);
              $scope.$ctrl.spMoveEmit(elId);

            } else if (myTurn) {

              $element[0].innerText = mySymbol[0];
              $scope.$ctrl.remainingBoard.splice(indexOf, 1);
              $scope.$ctrl.mpMoveEmit(elId);
              
            } else if (rcvdMove) {

              $element[0].innerText = mySymbol[1];
              $scope.$ctrl.remainingBoard.splice(indexOf, 1);
              $scope.$ctrl.rcvdMove = false;

            }
          }
          
          $scope.$apply();
          return;

        }
        $element.bind('click', move);
      }
  }
}

angular
  .module('noughtsAndCrosses')
  .directive('xo', xo);