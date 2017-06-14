#!/bin/bash

set -e
set -x

git clone git@eyeos.bitbucket.org:eyeos/{{projectName}}-artifacts.git
cd {{projectName}}-artifacts
tar -zxvf ../pkgs/{{projectName}}Artifact.tar.gz

git add .
git commit -m "Updated build"

bower version patch

git push origin master
cd -
