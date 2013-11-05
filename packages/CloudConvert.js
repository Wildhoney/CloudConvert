(function($module) {

    "use strict";

    /**
     * Since Restler doesn't allow rejectUnauthorized.
     * @reference https://github.com/danwrong/restler/pull/132
     */
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    // Dependencies, baby!
    var fs          = require('fs'),
        yaml        = require('js-yaml'),
        util        = require('util'),
        request     = require('request'),
        q           = require('q'),
        mime        = require('mime'),
        restler     = require('restler');

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
         * @property defaultInterval
         * @type {Number}
         */
        defaultInterval: 2500,

        /**
         * @property callbacks
         * @type {Object}
         */
        callbacks: { uploading: null, uploaded: null, converting: null, finished: null },

        /**
         * @method when
         * @param observerName {String}
         * @param method {Function}
         * @param interval {Number}
         * @return {void}
         */
        when: function when(observerName, method, interval) {

            this.callbacks[observerName] = {
                method      : method,
                interval    : interval || this.defaultInterval
            };

        },

        /**
         * @method convert
         * @param file {String}
         * @return {CloudConvert}
         */
        convert: function convert(file) {
            this.details.file = file;
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

                fs.stat($scope.details.file, function(error, stats) {

                    // Gather the necessary information about the file.
                    var mimeType    = mime.lookup($scope.details.file),
                        size        = stats.size;

                    // Invoke the callback method for uploading.
                    $scope.callbacks.uploading.method();

                    // Construct the options for the conversion.
                    var options = {
                        rejectUnauthorized  : false,
                        multipart           : true,
                        data: {
                            input           : 'upload',
                            file            : restler.file($scope.details.file, null, size, null, mimeType),
                            outputformat    : $scope.details.into
                        }
                    };

                    // Use Restler to submit the image along with the details to the CloudConvert server.
                    restler.post($scope.task.url, options).on('complete', function(data) {

                        // Invoke the callback method for uploaded.
                        $scope.callbacks.uploaded.method(data);

                        // Periodically invoke the callback with the status.
                        var interval = setInterval(function() {

                            $scope._getContent($scope.task.url).then(function(data) {

                                // Check if we're all done.
                                if (data.step === 'finished') {

                                    // If we are then we'll invoke the finished callback, and clear
                                    // the interval so no more callbacks are invoked.
                                    $scope.callbacks.finished.method(data);
                                    clearInterval(interval);
                                    return;

                                }

                                // Otherwise we'll invoke the converting callback.
                                $scope.callbacks.converting.method(data);

                            });

                        }, $scope.callbacks.converting.interval);

                    });
                });

            });

        },

        /**
         * @method _getContent
         * @param url {String}
         * @return {Function}
         * @private
         */
        _getContent: function _getContent(url) {

            var deferred    = q.defer(),
                options     = {
                    url         : url,
                    strictSSL   : false
                };

            request(options, function request(error, response, body) {

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