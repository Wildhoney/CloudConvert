(function($module) {

    var fs          = require('fs'),
        yaml        = require('js-yaml'),
        util        = require('util'),
        request     = require('request'),
        https       = require('https'),
        q           = require('q'),
        mime        = require('mime'),
        restler     = require('restler');

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
             * @method uploading
             * @param method {Function}
             * @return {void}
             */
            uploading: function converting(method, millisecondsIntervals) {

            },

            /**
             * @method converting
             * @param method {Function}
             * @return {void}
             */
            converting: function converting(method, millisecondsIntervals) {

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

//                process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

                fs.stat($scope.details.file, function(err, stats) {

                    restler.post($scope.task.url, {
                        rejectUnauthorized: false,
                        multipart: true,
                        data: {
                            input       : 'upload',
                            file        : restler.file($scope.details.file, null, stats.size, null, 'image/jpg'),
                            outputformat: $scope.details.into
                        }

                    }).on('complete', function(data) {
                        console.log(data);
                    });
                });

                // Create the necessary options for CloudConvert to begin converting.
//                var options = {
//                    strictSSL   : false,
//                    headers: {
//                        'content-type' : 'multipart/form-data'
//                    },
//                    method: 'POST',
//                    multipart: [{
//                        'Content-Disposition' : 'form-data; name="file"; filename="Example.jpg"',
//                        'Content-Type' : mime.lookup('Example.jpg'),
//                        body: $scope.details.file
//                    },{
//                        'Content-Disposition' : 'form-data; name="outputformat"',
//                        body: $scope.details.into
//                    }]
//                };
//
//
//                request.post($scope.task.url, options,
//                    function(err, res, body) {
//                        res.resume();
//                        console.log(body);
//                    });

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