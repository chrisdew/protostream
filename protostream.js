var Transform = require('stream').Transform;
var util = require('util');

exports.createProtoStream = createProtoStream;

function createProtoStream(options) {
  return new ProtoStream(options);
}

function ProtoStream(options) {
  options = options ? options : {};
  Transform.call(this, options);
  this._buf = new Buffer(0);
}
util.inherits(ProtoStream, Transform);

ProtoStream.prototype._transform = function(chunk, encoding, done) {
  console.log('chunk', chunk, '_buf', this._buf);
/*
  this._buf += chunk;
  for (var i = 0; i < this._buf.length; i++) {
    if (this._buf.charAt(i) === '\n') {
      this.push(this._buf.slice(0, i));
      this._buf = this._buf.slice(i + 1);
    }
  }
*/
  this.push(chunk);
  done();
}

// this doesn't get called when the input stream ends
ProtoStream.prototype._flush = function(done) {
  //console.log('_flush');
  if (this._buf.length > 0) {
    this.push(this._buf);
  }
  done();
}

