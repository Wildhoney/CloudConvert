CloudConvert
============

<img src="https://travis-ci.org/Wildhoney/CloudConvert.png?branch=master" />
&nbsp;
<img src="https://badge.fury.io/js/cloud-convert.png" />

Getting Started
------------

Our implementation uses Node.js' asynchronous behaviour to create a non-blocking API for <a href="https://cloudconvert.org" target="_blank">CloudConvert</a> &ndash; allowing you to convert files into hundreds of different formats.

**Further Reading:** For the following, please see the example in `example` which uses Angular.js and Socket.IO.

You first need your file which you're going to convert. We instantiate a new `CloudConvert` object per conversion task &ndash; passing in the path to your <a href="#yaml-configuration">YAML configuration</a>. By using the `convert` method we tell the API where our file resides.

```javascript
var $task = new CloudConvert(config).convert(filePath);
```

Afterwards we need to tell the API what the current format of our file is, and which format we'd like to convert it into.

```javascript
$task.from('jpg').into('png');
```

We can then begin the conversion process with the `process` method.

```javascript
$task.process();
```

However, because Node.js is entirely asynchronous, none of the aforementioned methods return anything about the status &ndash; that's where the callbacks come into play!

We define a handful of callbacks, all of which can be setup with `when(observerName, method, interval)` &ndash; where `interval` only applies to one callback.

 * `when('uploading', ...)` &ndash; once when uploading has begun;
 * `when('uploaded', ...)` &ndash; once when the file has been uploaded;
 * `when('converting', ..., 2500)` &ndash; every 2,500 milliseconds with conversion status;
 * `when('finished', ...)` &ndash; once after the conversion has finished;
 * `when('error', ...)` &ndash; once when an error occurs;

All of these are **optional** and pass through useful data in their `arguments`.

```javascript
$task.when('uploading', function(data) {
    console.log("We're uploading our file...");
});
```

**Errors:** For a list of possible errors, please refer to the `_errorCodes` object in `CloudConvert.prototype`.

When the processing has finished and the `finished` observer has been invoked, you have all you need to continue. For example, you could download the file from the CloudConvert servers by inspecting the `data` object in the callback.

```javascript
$task.when('finished', function(data) {
    console.log("Let's download " + data.output.url);
});
```

For further information about the CloudConvert API, please take a look at their <a href="https://cloudconvert.org/page/api" target="_blank">API documentation</a>.

Putting it all together we can chain our methods:

```javascript
var config  = __dirname + '/config.yml',
    file    = __dirname + '/uploaded-files/Rio.jpg';

var $task   = new CloudConvert(config).convert(file).from('jpg').into('png').process();
```

YAML Configuration
------------

We keep the API key separate from the codebase &ndash; your YAML config **must** contain your API key obtained from CloudConvert.

```
apiKey: 123456789
```

Please refer to the `config.yml.example` file in `example`. When you instantiate a new `CloudConvert` task, pass in the path to your YAML config.

```javascript
// Current path plus "config.yml".
var $config = __dirname + '/config.yml',
    $task   = new CloudConvert($config);
```

Contributions
------------

All contributions are welcome subject to the necessary Jasmine tests, and will be rewarded with a Cheshire Cat smile!