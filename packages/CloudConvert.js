(function($module) {

    var fs          = require('fs'),
        yaml        = require('js-yaml'),
        util        = require('util'),
        request     = require('request'),
        q           = require('q');

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
         * @property urlProcess
         * @type {String}
         */
        urlProcess: 'https://api.cloudconvert.org/process?inputformat=%s&outputformat=%s&apikey=%s',

        /**
         * @property urlActions
         * @type {Object}
         */
        urlActions: { delete: 'delete', cancel: 'cancel' },

        /**
         * @property details
         * @type {Object}
         */
        details: { file: null, from: null, into: null },

        /**
         * @property task
         * @type {Object}
         */
        task: { id: null, url: null },

        /**
         * @property apiKey
         * @type {String}
         */
        apiKey: '',

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
            this.details.file = data;
            return this;
        },

        /**
         * @method from
         * @param format {String}
         * @return {CloudConvert}
         */
        from: function from(format) {
            this.details.from = format;
            return this;
        },

        /**
         * @method into
         * @param format {String}
         * @return {CloudConvert}
         */
        into: function into(format) {
            this.details.into = format;
            return this;
        },

        /**
         * @method process
         * @return {void}
         */
        process: function process() {

            var $scope = this;

            // First we need to read the "config.yaml" file to access the API information.
            fs.readFile(__dirname + '/config.yaml', 'utf-8', function parseYamlConfig(error, data) {
                $scope.apiKey = yaml.load(data).apiKey;
                $scope._convert.apply($scope);
            });

        },

        /**
         * @method _convert
         * Responsible for converting the uploaded file into the desired file format.
         * @return {void}
         * @private
         */
        _convert: function _convert() {

            // Prepare the URL to notify CloudConvert of the impending conversion.
            var url     = util.format(this.urlProcess, this.details.from, this.details.into, this.apiKey),
                $scope  = this;

            this._getContent(url).then(function then(content) {

                var deferred = q.defer();

                if ('id' in content) {

                    // We've found the "id" in the JSON content, so we can resolve our promise
                    // and jump to the next stage!
                    $scope.task.id  = content.id;
                    $scope.task.url = util.format('https:%s', content.url);

                    deferred.resolve();

                }

                // Boohoo! We weren't able to find the "id" property in the returned content.
                deferred.reject();

                return deferred.promise;

            }).then(function andThen() {

                

            });

        },

        /**
         * @method _getContent
         * @param url {String}
         * @return {Function}
         * @private
         */
        _getContent: function _getContent(url) {

            var deferred = q.defer();

            request(url, function request(error, response, body) {

                if (error && response.statusCode !== 200) {

                    // Determine if we have an error, in which case we'll reject the promise.
                    return deferred.reject(error);

                }

                // Otherwise we can resolve our promise.
                return deferred.resolve(JSON.parse(body));

            });

            return deferred.promise;

        }

    };

    // CommonJS, my dear!
    $module.exports = CloudConvert;

})(module);