(function($module) {

    "use strict";

    /**
     * @module CloudConvert
     * @constructor
     */
    var CloudConvert = function CloudConvert() {};

    /**
     * @property prototype
     * @type {Object}
     */
    CloudConvert.prototype = {

        /**
         * @property job
         * @type {Object}
         */
        job: { file: null, from: null, into: null },

        /**
         * @property when
         * @type {Object}
         */
        when: {

            /**
             * @property defaultInterval
             * @type {Number}
             */
            defaultInterval: 500,

            /**
             * @method updated
             * @param method {Function}
             * @return {void}
             */
            updated: function updated(method, millisecondsIntervals) {



            },

            /**
             * @method finished
             * @param method {Function}
             * @return {void}
             */
            finished: function finished(method) {

            }

        },

        /**
         * @method convert
         * @param data {Object}
         * @return {CloudConvert}
         */
        convert: function convert(data) {
            this.job.file = data;
            return this;
        },

        /**
         * @method from
         * @param format {String}
         * @return {CloudConvert}
         */
        from: function from(format) {
            this.job.from = format;
            return this;
        },

        /**
         * @method into
         * @param format {String}
         * @return {CloudConvert}
         */
        into: function into(format) {
            this.job.into = format;
            return this;
        },

        /**
         * @method process
         * @return {void}
         */
        process: function process() {

        }

    };

    $module.export = CloudConvert;

})(module);