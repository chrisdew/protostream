var ps = require('../protostream.js');
var vi = require('../lib/varint.js');
var assert = require('assert');
var fs = require('fs');
var Schema = require('protobuf').Schema;

var schema = new Schema(fs.readFileSync('./test/test.desc'));
var Wrapper = schema['test.Wrapper'];
var Person = schema['test.Person'];

// test data
var people = {
  fred: {
    name: "Fred Flintstone",
    id: 0,
    phone: [
      { number: "01234567890" },
      { number: "07891234567", type: "MOBILE" }
    ]
  },
  wilma: {
    name: "Wilma Flintstone",
    id: 1,
    email: "Wilma Flintstone <wilma.flintstone@example.com",
  },
  barney: {
    name: "Barney Rubble",
    id: 2,
    phone: [
      { number: "02567890123", type: "HOME" },
      { number: "02468026802", type: "WORK" }
    ]
  }
}


describe('protostream', function() {
  // the following assertion is the basis for this using protobuf to frame protobuf messages within a stream
  it('should show that multiple concatenated messages are identical to one with repeated elements', function() {
    var bufA = Wrapper.serialize({wrapped:[people.fred,people.wilma,people.barney]});
    var bufB = Buffer.concat([Wrapper.serialize({wrapped:[people.fred]}),
                              Wrapper.serialize({wrapped:[people.wilma]}),
                              Wrapper.serialize({wrapped:[people.barney]})]);
    assert.deepEqual(bufA, bufB);
  });
  it('should pass a single message', function(done) {
    var protostream = ps.createProtoStream();
    protostream.on('data', function(data) {
      //console.log('message data', data);
      assert.deepEqual(Person.parse(data), people.fred);
      done();
    });
    protostream.write(Wrapper.serialize({wrapped:[people.fred]}));
  });
  it('should pass multiple messages', function() {
    var protostream = ps.createProtoStream();

    // collect each received child message as a separate buffer, in an array (rxd)
    var rxd = [];
    protostream.on('data', function(data) {
      rxd.push(data);
    });

    // make a buffer containing two (wrapped) protobuf messages
    protostream.write(Buffer.concat([Wrapper.serialize({wrapped:[people.fred]}),
                                     Wrapper.serialize({wrapped:[people.wilma]})]));

    // check that they have been split on the right boundary
    assert.deepEqual(Person.parse(rxd[0]), people.fred);
    assert.deepEqual(Person.parse(rxd[1]), people.wilma);

    // check that the ProtoStream stream transform continues to work
    protostream.write(Wrapper.serialize({wrapped:[people.barney]}));
    assert.deepEqual(Person.parse(rxd[2]), people.barney);
  });
  it('should raise an error on a bad protobuf key', function(done) {
    var protostream = ps.createProtoStream();
    protostream.on('error', function(err) {
      //console.log('err', err);
      assert.deepEqual(err.message, 'Bad wire type: 1');
      done();
    });
    protostream.write(new Buffer([1])); // this has wiretype of 0 (a 64 bt number)
  });
  it('should raise an error on a bad message length', function(done) {
    var protostream = ps.createProtoStream();
    protostream.on('error', function(err) {
      //console.log('err', err);
      assert.deepEqual(err.message, 'Message length: 2097151 longer than MAX_LEN: 4096');
      done();
    });
    protostream.write(new Buffer([2,0xff,0xff,0x7f]));
  });
});




