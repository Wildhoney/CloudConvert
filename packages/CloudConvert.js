(function($module, $process) {

    "use strict";

    /**
     * Since Restler doesn't allow rejectUnauthorized.
     * @reference https://github.com/danwrong/restler/pull/132
     */
    $process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    // Dependencies, baby!
    var fs          = require('fs'),
        yaml        = require('js-yaml'),
        util        = require('util'),
        request     = require('request'),
        q           = require('q'),
        mime        = require('mime'),
        restler     = require('restler'),
        ansi        = require('ansi'),
        cursor      = ansi(process.stdout);

    /**
     * @module CloudConvert
     * @constructor
     */
    var CloudConvert = function CloudConvert(configFile) {
        this._options.config = configFile;
    };

    /**
     * @property prototype
     * @type {Object}
     */
    CloudConvert.prototype = {

        /**
         * @property _urlProcess
         * @type {String}
         * @private
         */
        _urlProcess: 'https://api.cloudconvert.org/process?inputformat=%s&outputformat=%s&apikey=%s',

        /**
         * @property _urlActions
         * @type {Object}
         * @private
         */
        _urlActions: { delete: 'delete', cancel: 'cancel' },

        /**
         * @property _options
         * @type {Object}
         * Containers data that has been specified by the user.
         * @private
         */
        _options: { file: null, from: null, into: null, config: null },

        /**
         * @property _task
         * @type {Object}
         * Contains data that has been retrieved from the CloudConvert servers.
         * @private
         */
        _task: { id: null, url: null },

        /**
         * @property _apiKey
         * @type {String}
         * @private
         */
        _apiKey: '',

        /**
         * @property _defaultInterval
         * @type {Number}
         * @private
         */
        _defaultInterval: 2500,

        /**
         * @property _errorCodes
         * @type {Object}
         * @private
         */
        _errorCodes: {

            /**
             * @property invalidConfig
             * Thrown when the YAML configuration file cannot be loaded.
             * @type {Number}
             * @default 1
             */
            invalidConfig: 1,

            /**
             * @property configKey
             * Thrown when the "apiKey" key cannot be found in the YAML config.
             * @type {Number}
             * @default 2
             */
            configKey: 2,

            /**
             * @property invalidJobId
             * Thrown when CloudConvert does not send us back the response with the job ID.
             * @type {Number}
             * @default 3
             */
            invalidJobId: 3,

            /**
             * @property invalidFile
             * Thrown when we're unable to locate the file wishing to be converted.
             * @type {Number}
             * @default 4
             */
            invalidFile: 4
            
        },

        /**
         * @property _callbacks
         * @type {Object}
         * @private
         */
        _callbacks: {

            /**
             * @on error
             * Invoked once when an error occurs.
             */
            error: {
                method: function(data) {
                    cursor.hex('#553c45').bg.hex('#e7a3bd')
                        .write(' CloudConvert: ').reset().write(' ' + data.message + "\n");
                }
            },

            /**
             * @on uploading
             * Invoked once when the file upload process has begun.
             */
            uploading: {
                method: function() {
                    cursor.hex('#324645').bg.hex('#9fd3d0')
                        .write(' CloudConvert: ').reset().write(" Uploading File... \n");
                }
            },

            /**
             * @on uploaded
             * Invoked once when the file has been successfully uploaded.
             */
            uploaded: {
                method: function() {
                    cursor.hex('#1f251b').bg.hex('#b4ce9e')
                        .write(' CloudConvert: ').reset().write(" File Uploaded... \n");
                }
            },

            /**
             * @on converting
             * Invoked many times when the file is being converted by CloudConvert.
             */
            converting: {
                interval: 2500,
                method  : function() {
                    cursor.hex('#324645').bg.hex('#9fd3d0')
                        .write(' CloudConvert: ').reset().write(" Converting File... \n");
                }
            },

            /**
             * @on finished
             * Invoked once when the conversion has been successfully completed.
             */
            finished: {
                method: function() {
                    cursor.hex('#1f251b').bg.hex('#b4ce9e')
                        .write(' CloudConvert: ').reset().write(" All Done! \n");
                }
            }

        },

        /**
         * @method when
         * @param observerName {String}
         * @param method {Function}
         * @param interval {Number}
         * @return {void}
         */
        when: function when(observerName, method, interval) {

            this._callbacks[observerName] = {
                method      : method,
                interval    : interval || this._defaultInterval
            };

        },

        /**
         * @method convert
         * @param file {String}
         * @return {CloudConvert}
         */
        convert: function convert(file) {
            this._options.file = file;
            return this;
        },

        /**
         * @method from
         * @param format {String}
         * @return {CloudConvert}
         */
        from: function from(format) {
            this._options.from = format;
            return this;
        },

        /**
         * @method into
         * @param format {String}
         * @return {CloudConvert}
         */
        into: function into(format) {
            this._options.into = format;
            return this;
        },

        /**
         * @method process
         * Responsible for initiating the whole conversion process.
         * @return {void}
         */
        process: function process() {

            // First we need to read the "config.yaml" file to access the API information.
            fs.readFile(this._options.config, 'utf-8', function parseYamlConfig(error, data) {

                try {

                    // Attempt to load and parse the YAML config file.
                    var config = yaml.load(data);

                    // Determine if the "apiKey" key is in the configuration.
                    if (!('apiKey' in config)) {

                        this._callbacks.error.method({
                            code    : this._errorCodes.configKey,
                            message : 'Cannot find "apiKey" in configuration!'
                        });

                        return false;

                    }

                    // Otherwise we can load the API key, and continue processing.
                    this._apiKey = config.apiKey;
                    this._convert.apply(this);

                } catch (e) {

                    this._callbacks.error.method({
                        code    : this._errorCodes.invalidConfig,
                        message : 'Unable to parse YAML configuration!'
                    });

                    return false;

                }

            }.bind(this));

        },

        /**
         * @method _convert
         * Responsible for converting the uploaded file into the desired file format.
         * @return {void}
         * @private
         */
        _convert: function _convert() {

            // Prepare the URL to notify CloudConvert of the impending conversion.
            var url = util.format(this._urlProcess, this._options.from, this._options.into, this._apiKey);

            // Begin the process using Q's promises!
            this._getContent(url)

                // Initiate the call to the CloudConvert servers to notify them of the impending conversion.
                .then(this._prepareConversion.bind(this))

                // Send the file to the CloudConvert servers so they can begin the process.
                .then(this._sendFile.bind(this))

                // Apply the callbacks to notify Node of the status.
                .then(this._applyCallbacks.bind(this))

                // Fallback if any errors occur in the process.
                .fail(function(error) {

                    this._callbacks.error.method(error);

                }.bind(this));

        },

        /**
         * @method _prepareConversion
         * @param content {Object}
         * Responsible for making the initial call to the CloudConvert servers to retrieve the job ID.
         * @return {Q.promise}
         * @private
         */
        _prepareConversion: function _prepareConversion(content) {

            var deferred = q.defer();

            if ('id' in content) {

                // We've found the "id" in the JSON content, so we can resolve our promise
                // and jump to the next stage!
                this._task.id  = content.id;
                this._task.url = util.format('https:%s', content.url);

                deferred.resolve();

            }

            // Boohoo! We weren't able to find the "id" property in the returned content.
            deferred.reject({
                code    : this._errorCodes.invalidJobId,
                message : 'Cannot determine CloudConvert job ID!'
            });

            return deferred.promise;

        },

        /**
         * @method _sendFile
         * Responsible for sending the file to the CloudConvert server for the them to convert the
         * files into the desired format.
         * @return {Q.promise}
         * @private
         */
        _sendFile: function _sendFile() {

            var file            = this._options.file,
                deferred        = q.defer();

            fs.stat(file, function(error, stats) {

                if (error) {

                    // Determine if an error was thrown.
                    this._callbacks.error.method({
                        code    : this._errorCodes.invalidFile,
                        message : 'Unable to locate the file to convert!'
                    });

                    return;

                }

                // Gather the necessary information about the file.
                var mimeType    = mime.lookup(file),
                    size        = stats.size;

                // Invoke the callback method for uploading.
                this._callbacks.uploading.method();

                // Construct the options for the conversion.
                var options = {
                    rejectUnauthorized  : false,
                    multipart           : true,
                    data: {
                        input           : 'upload',
                        file            : restler.file(file, null, size, null, mimeType),
                        outputformat    : this._options.into
                    }
                };

                // Use Restler to submit the image along with the details to the CloudConvert server.
                restler.post(this._task.url, options).on('complete', function(data) {
                    deferred.resolve(data);
                }.bind(this));

            }.bind(this));

            return deferred.promise;

        },

        /**
         * @method _applyCallbacks
         * Responsible for applying the user configured callbacks so that the end-user knows what's going
         * on with their conversion.
         * @param data {Object}
         * @return {void}
         * @private
         */
        _applyCallbacks: function _applyCallbacks(data) {

            // Invoke the callback method for uploaded.
            this._callbacks.uploaded.method(data);

            // Periodically invoke the callback with the status.
            var interval = setInterval(function() {

                this._getContent(this._task.url).then(function(data) {

                    // Check if we're all done.
                    if (data.step === 'finished') {

                        // If we are then we'll invoke the finished callback, and clear
                        // the interval so no more callbacks are invoked.
                        clearInterval(interval);
                        this._callbacks.finished.method(data);
                        return;

                    }

                    // Otherwise we'll invoke the converting callback.
                    this._callbacks.converting.method(data);

                }.bind(this));

            }.bind(this), this._callbacks.converting.interval);

        },

        /**
         * @method _getContent
         * @param url {String}
         * @return {Q.promise}
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

})(module, process);