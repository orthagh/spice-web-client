#!/bin/sh

set -e
set -u
set -x

if [ ! -f /.dockerinit ]; then
	npm install
	bower install
fi

grunt build-client

mkdir pkgs
tar -czvf pkgs/{{projectName}}Artifact.tar.gz ./build/ bower.json
