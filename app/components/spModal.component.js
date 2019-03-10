let spModalComponent = {
  templateUrl: './components/spModal.template.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: function (socket) {
    let $ctrl = this;

    $ctrl.$onInit = () => {
      $ctrl.message = $ctrl.resolve.message;
    };

    $ctrl.restart = () => {
      $ctrl.close();
    };

    $ctrl.cancel = () => {
      $ctrl.dismiss({$value: 'cancel'});
    };
  }
}

angular
  .module('noughtsAndCrosses')
  .component('spModalComponent', spModalComponent);