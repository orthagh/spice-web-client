#!/bin/sh

set -e
set -u
set -x

npm install
bower install -f
grunt build-client:release
cd builder
./build.sh $1
