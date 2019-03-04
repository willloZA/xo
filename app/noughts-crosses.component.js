let noughtsCrossesComponent = {
  templateUrl: './noughts-crosses.template.html',
  controller: noughtsAndCrossesController
};

angular
  .module('noughtsAndCrosses')
  .component('noughtsCrossesComponent', noughtsCrossesComponent);