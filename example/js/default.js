(function($w) {

    "use strict";

    /**
     * @property url
     * @type {String}
     */
    var url = 'http://127.0.0.1:8888/';

    /**
     * @on DOMContentLoaded
     */
    document.addEventListener('DOMContentLoaded', function() {

        var button = $w.document.querySelector('input#button');

        /**
         * @on onclick
         */
        button.onclick = function onClick() {

            console.log('Loaded...');
        }

    });

})(window);