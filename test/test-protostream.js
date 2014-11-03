var ps = require('../protostream.js');
var assert = require('assert');
var fs = require('fs');
var Schema = require('protobuf').Schema;

var schema = new Schema(fs.readFileSync('./example/example.desc'));
var Wrapper = schema['example.Wrapper'];
var Person = schema['example.Person'];

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
  it('should show that multiple concatenated messages are identical to one with repeated elements', function() {
    var bufA = Buffer.concat([Wrapper.serialize({wrapped:[people.fred]}),
                              Wrapper.serialize({wrapped:[people.wilma]}),
                              Wrapper.serialize({wrapped:[people.barney]})]);
    var bufB = Wrapper.serialize({wrapped:[people.fred,people.wilma,people.barney]});
    assert.deepEqual(bufA, bufB);
  });
  /*
  it('should pass a single message', function(done) {
    var protostream = ps.createProtoStream();
    protostream.on('data', function(data) {
      assert.deepEqual(Person.parse(data), people.fred);
      done();
    });
    protostream.push(Wrapper.serialize({wrapped:[people.fred]}));
  });
  */
});




