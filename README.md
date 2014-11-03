ProtoStream
===========

Protocol Buffers have no default framing for use in a streaming protocol, such as TCP.

ProtoStream is a [Stream Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform_1) 
whose outputs are discrete Protocol Buffer messages, which can be decoded by the library of your choice.

As a 'top-level' PB message has no length field, or framing, a "Wrapper" message is used.

This has the benefit that a the full content of a stream can also be decoded as a single message of type "Wrapper".

