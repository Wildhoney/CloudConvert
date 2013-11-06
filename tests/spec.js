var should          = require('should'),
    CloudConvert    = require('./../packages/CloudConvert.js');

describe('CloudConvert.js', function() {

    var $instance,
        $file = __dirname + '/../example/uploaded-files/Rio.jpg';

    describe('Basic', function() {

        beforeEach(function() {
            var config = __dirname + '/config.yml';
            $instance = new CloudConvert(config);
        });

        it('Can instantiate itself with basic options', function() {
            $instance.should.be.an.instanceOf(Object);
            $instance.process.should.be.an.instanceOf(Function);
            $instance._options.config.should.be.ok;
        });

        it('Can pass in the file to be converted', function() {
            $instance.convert($file);
            $instance._options.file.should.be.ok;
            $instance._options.file.should.match(/Rio/);
        });

        it('Can pass in the format to convert from and into', function() {
            $instance.convert($file);
            $instance.from('jpg');
            $instance._options.from.should.equal('jpg');
            $instance.into('png');
            $instance._options.into.should.equal('png');
        });

        it('Can configure callbacks for difference scenarios', function() {
            $instance.when('finished', function() {}, 1800);
            $instance._callbacks.finished.should.be.ok;
            $instance._callbacks.finished.method.should.be.an.instanceOf(Function);
            $instance._callbacks.finished.interval.should.be.a.number;
            $instance._callbacks.finished.interval.should.equal(1800);
        });

    });

});