#!/bin/bash

set -e
set -u
set -x

if [ -f /.dockerinit ]; then
	xvfb-run grunt \
		        test-client \
		        bump-version \
		        jenkins-commit-properties
	exit 0
else
	npm install
	bower install

	grunt \
        	test-client \
	        bump-version \
        	jenkins-commit-properties

fi