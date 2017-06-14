#!/bin/sh

set -e
set -u
set -x

./node_modules/.bin/istanbul cover --report cobertura --dir build/reports/ -- grunt test
