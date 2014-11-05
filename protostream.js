var Transform = require('stream').Transform;
var util = require('util');
var vi = require('./lib/varint.js');

var MAX_LEN = 4096; // just for some sanity

exports.createProtoStream = createProtoStream;

function createProtoStream(options) {
  return new ProtoStream(options);
}

/*
 * ProtoStream is a stream transform which accpts chunks 
 * and pushed out chunks, separated on protobuf message boundaries.
 *
 * It is implemented a state machine, with three states:
 * WAIT_KEY, WAIT_LEN and WAIT_BYTES
 */
function ProtoStream(options) {
  options = options ? options : {};
  Transform.call(this, options);
  this._buf = new Buffer(0);
  this._state = new WAIT_KEY();
  this._dead = false;
}
util.inherits(ProtoStream, Transform);

/* 
 * state objects have the following interface:
 *
 * .exec(byte) -> { nextState: object?, output: buffer? }
 *
 */

// wait for a varInt encoded key
function WAIT_KEY() {
  this.varInt = vi.createVarInt();
}
WAIT_KEY.prototype.exec = function(b) {
  var key = this.varInt.exec(b);
  if (key === null) return {}; // still expecting more bytes of the varInt.
  var wiretype = key & 0x07;
  if (wiretype !== 2) { // length delimited
    throw new Error('Bad wire type: ' + wiretype);
  }
  // var fieldNum = key >> 3; // not used
  return { newState: new WAIT_LEN() };
}

// wait for a varInt encoded length
function WAIT_LEN() {
  this.varInt = new vi.createVarInt();
}
WAIT_LEN.prototype.exec = function(b) {
  var len = this.varInt.exec(b);
  if (len === null) return {}; // still expecting more bytes of the varInt.
  if (len > MAX_LEN) { // stupidly/maliciously large message
    throw new Error('Message length: ' + len + ' longer than MAX_LEN: ' + MAX_LEN);
  }
  return { newState: new WAIT_BYTES(len) };
}

function WAIT_BYTES(num) {
  this.num = num;
  this.len = 0;
  this.buf = new Buffer(MAX_LEN);
}
WAIT_BYTES.prototype.exec = function(b) {
  this.buf[this.len++] = b;
  if (this.len < this.num) return {}; // still expecting more bytes of the message
  return { newState: new WAIT_KEY(), output: this.buf.slice(0, this.len) };
}

ProtoStream.prototype._transform = function(chunk, encoding, done) {
  //console.log('chunk', chunk, '_buf', this._buf);
  if (this.dead) {
    this.emit('error', new Error('ProtoStream transform is already dead.  See the earlier emitted error for details.'));
    return done();
  }
  var handler = null;
  for (var i = 0; i < chunk.length; i++) {
    try {
      var ret = this._state.exec(chunk[i]);
    } catch (e) {
      this.dead = true;
      this.emit('error', e);
      return done();
    }
    if (ret.newState) this._state = ret.newState;
    if (ret.output) this.push(ret.output);
  }
  return done();
}

// noting to do here, as a partial pb message is useless
ProtoStream.prototype._flush = function(done) {
  return done();
}


