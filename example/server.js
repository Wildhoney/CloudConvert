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

fileSystem.readFile(__dirname + '/uploaded-files/Rio.jpg', function (error, file) {

    var task = new CloudConvert().convert(file).from('jpg').into('png');

    task.when.updated(function(data) {

    }, 5);

    task.when.finished(function(data) {

    });

    task.process();

});


// Responsible for the call to OPTIONS.
app.options('/', function(request, response) {
    response.send(200);
});

// Responsible for handling the file upload.
//app.post('/', function(request, response) {
//
//    /**
//     * @method uploadFile
//     * @param file {Object}
//     * @return {void}
//     */
//    var uploadFile = function uploadFile(file) {
//
//        fileSystem.readFile(file.path, function (error, data) {
//            var filePath = __dirname + '/uploaded-files/' + file.name;
//            fileSystem.writeFile(filePath, data, function() {});
//        });
//
//    };
//
//    for (var index in request.files) if (request.files.hasOwnProperty(index)) {
//        var file = request.files[index];
//        uploadFile(file);
//    }
//
//});