ProtoStream
===========

Protocol Buffers have no default framing for use in a streaming protocol, such as TCP.

ProtoStream is a [Stream Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform) 
whose outputs are discrete Protocol Buffer messages, which can be decoded by the library of your choice.


Theory
------

In Protocol Buffers, the serialisation of a wrapper message with N repeated `child` messages is identical to the serialisation
of a the concatenated serialisation of N wrapper message with one child message each.

From the test suite:

    var bufA = Buffer.concat([Wrapper.serialize({wrapped:[people.fred]}),
                              Wrapper.serialize({wrapped:[people.wilma]}),
                              Wrapper.serialize({wrapped:[people.barney]})]);
    var bufB = Wrapper.serialize({wrapped:[people.fred,people.wilma,people.barney]});
    assert.deepEqual(bufA, bufB);
 
This allows us to represent a stream as a wrapper message with repeating elements, yet send indiviual message into the stream 
by wrapping and sending them one at a time. 

This has the benefit that a the full content of a stream can be decoded as a single message of type "Wrapper".

The .proto file used, includes the Wrapper message, and a Person message from Google's examples.

test.proto:

    package test;

    message Wrapper {
      repeated Person wrapped = 42; // large number (>31)to test multibyte field key
    }

    message Person {
      required string name = 1;
      required int32 id = 2;
      optional string email = 3;

      enum PhoneType {
        MOBILE = 0;
        HOME = 1;
        WORK = 2;
      }

      message PhoneNumber {
        required string number = 1;
        optional PhoneType type = 2 [default = HOME];
      }

      repeated PhoneNumber phone = 4;
    }


Implementation
--------------

ProtoStream is a tool which uses a state machine to pull out the individual child messages, one by one, as bytes are received.

These child messages can then be decoded separately, the the Protobuf library of your choice.

From the test suite:

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


To Do
-----

* The state machine operates on single bytes, as needed by the WAIT_KEY and WAIT_LEN states.  The WAIT_BYTES state would be capable of processing whole chunks, without the function-call-per-byte overhead, if the state machine were modified.
 
