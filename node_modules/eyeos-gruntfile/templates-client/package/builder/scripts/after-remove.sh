#!/bin/bash

set -e
set -u
set -x

if [ "$UID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi

name="{{projectName}}";

if [ -d /usr/share/nginx/html/$name ]; then

 rm -fr /usr/share/nginx/html/$name

fi

cd /usr/share/nginx/html