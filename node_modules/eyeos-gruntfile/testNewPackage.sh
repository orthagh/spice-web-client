#!/bin/bash
set -e
set -u
set -x

npm pack
version=$(npm version | grep eyeos-gruntfile | cut -d "'" -f4)
echo "installing eyeos-gruntfile-$version.tgz"
cd "test/test-project"
rm -fr node_modules/eyeos_gruntfile
npm install "../../eyeos-gruntfile-$version.tgz"
./cleanGenerated.sh || true
npm install && grunt project && ./commit-stage.sh
#undo all files modified by this test.
git checkout .
cd ../..

