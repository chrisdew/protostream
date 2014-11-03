var fs = require('fs');
var Schema = require('protobuf').Schema;

// "schema" contains all message types defined in jmdip.proto|desc.
var schema = new Schema(fs.readFileSync('concat.desc'));

// The "Stream" message.
var Stream = schema['cc.test.ConcatStream'];
var Pdu = schema['cc.test.Pdu'];

var obs = [
  { pdus: [{ 
      id: 42,
      name: 'fred',
      email: 'fred@example.com'
    }]
  },
  { pdus: [{ 
      id: 43,
      name: 'barney'
    }]
  }
];


var json = JSON.stringify(obs);
console.log('json:', json);
console.log('json.length:', json.length);

var bufs = [];
for (var i in obs) {
  bufs.push(Stream.serialize(obs[i]));
  console.log('bufs[' + i + '].length:', bufs[i].length);
}
var proto = Buffer.concat(bufs);

console.log('proto', proto);
console.log('proto.length:', proto.length);

// a naive decoding will get a correct, but garbled result:
// {
//     "concatPdu": {
//         "id": 43,
//         "name": "barney",
//         "email": "fred@example.com"
//     }
// }
// as the Protocol buffers spec. says that repeated fields keep their last assigned value
console.log('unserialised:', JSON.stringify(Stream.parse(proto)));
console.log('prettyprinted:\n' + JSON.stringify(Stream.parse(proto), null, 4));

// using some custom deserialisation code
var offset = 0;







