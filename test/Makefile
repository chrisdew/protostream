# This makefile makes a test.desc file from a test.proto schema.

all:
	protoc --descriptor_set_out=test.desc --include_imports test.proto

clean:
	rm -f test.desc
