var express         = require('express'),
    app             = express(),
    fileSystem      = require('fs'),
    server          = require('http').createServer(app).listen(8888),
    CloudConvert    = require('./../packages/CloudConvert.js');

// Configuration.
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.all('*', function(request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-File-Type, X-File-Name, X-File-Size');
    response.header('Access-Control-Allow-Methods', 'POST');
    next();
});

var config  = __dirname + '/config.yaml',
    file    = __dirname + '/uploaded-files/Rio.jpg',
    task    = new CloudConvert(config).convert(file).from('jpg').into('png').process();

//// Responsible for the call to OPTIONS.
//app.options('/', function(request, response) {
//    response.send(200);
//});
//
//// Responsible for handling the file upload.
//app.post('/', function(request, response) {
//
//
//
//    /**
//     * @method uploadFile
//     * @param file {Object}
//     * @return {void}
//     */
//    var uploadFile = function uploadFile(file) {
//
//        fileSystem.readFile(file.path, function (error, data) {
//
//            var filePath = __dirname + '/uploaded-files/' + file.name;
//            fileSystem.writeFile(filePath, data, function() {});
//            convertFile(filePath);
//
//        });
//
//    };
//
//    /**
//     * @method convertFile
//     * @param filePath {String}
//     * @return {void}
//     */
//    var convertFile = function convertFile(filePath) {
//
//        var config  = __dirname + '/config.yamsl',
//            task    = new CloudConvert(config).convert(filePath).from('jpg').into('png');
//
////        task.when('uploading', function(data) {
////            console.log('Uploading...');
////        });
////
////        task.when('error', function(data) {
////            console.log(data);
////        });
////
////        task.when('uploaded', function(data) {
////            console.log('Uploaded...');
////            console.log(data);
////        });
////
////        task.when('converting', function(data) {
////            console.log('Converting...');
////        });
////
////        task.when('finished', function(data) {
////            console.log('Finished!');
////            console.log(data);
////        });
//
//        task.process();
//
//    };
//
//    for (var index in request.files) if (request.files.hasOwnProperty(index)) {
//        var file = request.files[index];
//        uploadFile(file);
//    }
//
//});