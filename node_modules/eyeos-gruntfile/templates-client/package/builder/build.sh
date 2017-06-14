#!/bin/bash
set -e
set -u
set -x

THISDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$THISDIR"

name="{{projectName}}";
prefix="eyeos-";
packageType="rpm";
dependencies="nodejs >= 0.8, eyeos-finish-installation, nginx";

##
# usage: SOMETHING="$(extractJsonValue package.json description)"
extractJsonValue() {
	local file="$1"
	local value="$2"

	local failValue="failFAILfailFAILfailFAILfail"
	# taken from http://stackoverflow.com/q/1955505#comment36088507_1846930
	local retval="$(node -pe "JSON.parse(require('fs').readFileSync('$file').toString()).$value || '$failValue'")"
	if [ "$retval" = "$failValue" ]
	then
		return 1
	fi
	echo "$retval"
}

#############################################
# Copy the package contents to its location #
#############################################

if [ -d "contents" ];then
	rm -rf contents
fi

# installing -> the code
mkdir -p contents/usr/share/nginx/html/$name
cp -R ../build/* "contents/usr/share/nginx/html/$name/"

if [ -e post-finish ]
then
    mkdir -p contents/opt/$prefix$name/
    cp post-finish contents/opt/$prefix$name/
fi

if [ -e pre-finish ]
then
    mkdir -p contents/opt/$prefix$name/
    cp pre-finish contents/opt/$prefix$name/
fi

# nginx config
mkdir -p contents/etc/eyeos-services
cp -R "$prefix$name.conf" contents/etc/eyeos-services/

# systemd service config file
#mkdir -p contents/usr/lib/systemd/system/
#cp -R "$prefix$name.service" contents/usr/lib/systemd/system/

###############
# Get version #
###############

versionJson="$(extractJsonValue ../package.json version)"
if [ -f ../version.properties ];then
	versionGit="$(cat ../version.properties)"
else
	versionGit="$(git describe --all --long | cut -d "-" -f 3)"
fi
version="${versionJson}_${versionGit}"

##################
# Create package #
##################

if [ ! -d "log" ];then
	mkdir log
fi

fpm \
	-s dir \
	-t $packageType \
	-a all \
	--after-install scripts/after-install.sh \
	--before-install scripts/before-install.sh \
	--before-remove scripts/before-remove.sh \
	--after-remove scripts/after-remove.sh \
	--name "$prefix$name" \
	--version "$version" \
	--url "$(extractJsonValue ../package.json homepage)" \
	--maintainer "$(extractJsonValue ../package.json author)" \
	--depends "$dependencies" \
	--description "$(extractJsonValue ../package.json description)" \
	 -C contents/ . 2>&1 | tee -a log/packetizer.log

rm -rf ../pkgs
mkdir ../pkgs

mv *.$packageType ../pkgs/