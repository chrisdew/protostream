var vi = require('../lib/varint.js');
var assert = require('assert');


describe('varint', function() {
  it('should translate a one-byte varint', function(done) {
    var varInt = vi.createVarInt();
    varInt.on('data', function(data) {
      assert.deepEqual(data, 42);
      done();
    });
    varInt.write(new Buffer([42]));
  });
  it('should translate a three-byte varint', function(done) {
    var varInt = vi.createVarInt();
    varInt.on('data', function(data) {
      assert.deepEqual(data, 207509045505);
      done();
    });
    varInt.write(new Buffer([1|0x80,2|0x80,3|0x80,4|0x80,5|0x80,6]));
  });
  it('should translate a couple of varints', function() {
    var varInt = vi.createVarInt();
    var rxd = [];
    varInt.on('data', function(data) {
      rxd.push(data);
    });
    varInt.write(new Buffer([42]));
    assert.deepEqual(rxd, [42]);
    varInt.write(new Buffer([1|0x80]));
    assert.deepEqual(rxd, [42]); // nothing should have changed yet
    varInt.write(new Buffer([2|0x80,3|0x80,4|0x80,5|0x80,6]));
    assert.deepEqual(rxd, [42, 207509045505]);
  });
});




