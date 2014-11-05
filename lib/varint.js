var Transform = require('stream').Transform;
var util = require('util');

exports.createVarInt = createVarInt;

function createVarInt(options) {
  return new VarInt(options);
}

/*
 * VarInt is a Strean Transforn which accepts chunks and pushes out integers.
 */
function VarInt(options) {
  options = options ? options : {};
  options.objectMode = true;
  Transform.call(this, options);
  this._acc = 0;
  this._pos = 0; // bit position for adding 7 bit groups
}
util.inherits(VarInt, Transform);

VarInt.prototype.exec = function(b) {
  var highbit = !!(b & 0x80); // strip off the lower 7 and cast to a bool
  var val = b & 0x7f; // strip off the leading bit
  var mul = Math.pow(2,this._pos);
  this._acc = this._acc + val * mul;
  this._pos += 7; // bits per byte
  if (!highbit) {
    //console.log('_acc', this._acc, '_pos', this._pos);
    var oldacc = this._acc;
    this._acc = 0;
    this._pos = 0;
    return oldacc;
  }
  return null;
}

VarInt.prototype._transform = function(chunk, encoding, done) {
  //console.log('VarInt chunk', chunk, '_acc', this._acc, '_pos', this._pos);
  for (var i = 0; i < chunk.length; i++) {
    var ret = this.exec(chunk[i]);
    if (ret !== null) this.push(ret);
  }
  return done();
}

// nothing to do, a partial varint is meaningless, as we don't even know its magnitude
VarInt.prototype._flush = function(done) {
  return done();
}


