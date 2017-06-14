#!/bin/bash
set -e
set -u

# This script runs smokeTests or all componentTests, with the correct options,
# (see usage) coordinates the preparation of environment:
# calls pre-requirements.sh for installing runtime dependencies (rabbit, mongo...)
# starts/stop runtime dependencies, if specified to do so.
# HOW TO USE:
# set runtime dependencies variables to 1 for the servers you need, add whatever is missing :-)
# for example: NEED_RABBITMQ=1
# implementations for start/stop mysql and mongodb are pending implementation... TODO when needed.
# implement your tests, setting tag @smoke in your smoke tests, no tag needed
# for component functional tests. see an example in: sampleComponent.test.js
# IMPORTANT NOTE: your component tests are expected to start and stop your service.
# execute this script with the options you need for your environment (local development, jenkins, ...)
#
# example: component-test.sh -i -p --smoke will  install your component
# dependencies, run smoke tests only and stop your runtime dependencies.

# Runtime dependencies: should be set to 1 for the servers we need.
NEED_MONGODB=0
NEED_MYSQL=0
NEED_RABBITMQ=0

# Variables
ONLY_SMOKE=0
SMOKE_OPTIONS=""
RUN_DEPS=0
INSTALL=0
STOP_DEPS=0
THISDIR="$(cd "$(dirname "$0")" && pwd)"
# using local mocha
MOCHA="$THISDIR/node_modules/mocha/bin/mocha"
MOCHA_REPORTER="$THISDIR/node_modules/tdaf-node-tartare/gherkin.js"
COMPONENT_TEST_FOLDER="$THISDIR/src/component-test"


if [ ! -d "$COMPONENT_TEST_FOLDER" ]
then
        COMPONENT_TEST_FOLDER="$THISDIR/component-test"
fi

usage() {
	if [ "$*" ]
	then
		ERROR="ERROR: $*"
	else
		ERROR=""
	fi

	cat <<USAGE
Manage the component tests.
Usage: $0 [-h|--help] [-i|--install] [-s|--smoke] [-r|--run-dependencies] [-p|--stop-dependencies]

Component tests script: Runs component tests, also can prepare the environment.
Options:
    [-i|--install]                      Install project dependencies (executes pre-requirements.sh).
    [-s|--smoke]                        Run only smoke tests.
    [-r|--run-dependencies]             Run runtime dependencies (RABBIT, MONGO, MYSQL...) before the tests.
    [-p|--stop-dependencies]            Stop runtime dependencies (RABBIT, MONGO, MYSQL...) after the tests.
    [-h|--help]                         Prints this help message.

$ERROR
USAGE
exit 0
}

OUTOPT=$(getopt --options hisrp --longoptions help,install,smoke,run-dependencies,stop-dependencies -n "$0" -- "$@")
eval set -- "$OUTOPT"
while true
do
        case "$1" in
                -h|--help)
                        usage
                        ;;
                -i|--install)
                        INSTALL=1
                        shift 1
                        ;;

                -s|--smoke)
                        SMOKE_OPTIONS="--grep=@smoke"
                        shift 1
                        ;;

                -r|--run-dependencies)
                        RUN_DEPS=1
                        shift 1
                        ;;
                -p|--stop-dependencies)
                        STOP_DEPS=1
                        shift 1
                        ;;

                --)
                        # end of processed getopt options, break the loop
                        shift
                        break
                        ;;
                *)
                        echo "Unexpected error while processing commandline options" >&2
                        exit 1
                        ;;
        esac
done

get_distro_name() {
	cat /etc/issue \
		| cut -d' ' -f1 \
		| grep -Ei '(fedora|centos)' \
		| tr '[A-Z]' '[a-z]'
}

rabbitmq_start_service() {
	case "$(get_distro_name)" in
		centos)
			service rabbitmq-server start
			;;

		fedora)
			systemctl start rabbitmq-server
			;;
		*)
			echo "Unknown distro '$distro', trying to start anyway using service" >&2
			service rabbitmq-server start
			;;
	esac
}

rabbitmq_stop_service() {
	case "$(get_distro_name)" in
		centos)
			service rabbitmq-server stop
			;;

		fedora)
			systemctl stop rabbitmq-server
			;;
		*)
			echo "Unknown distro '$distro', trying to stop anyway using service" >&2
			service rabbitmq-server stop
			;;
	esac
}

run_runtime_dependencies() {
	# TODO: pending complete implementation. also, other runtime dependencies should be added as needed.
	if [ "$NEED_MONGODB" = 1 ]
	then
		echo "Starting mongodb..."
		echo "######### PENDING IMPLEMENTATION OF START_MONGODB"
	fi
	if [ "$NEED_MYSQL" = 1 ]
	then
		echo "Starting mysql..."
		echo "######### PENDING IMPLEMENTATION OF START_MYSQL"
	fi
	if [ "$NEED_RABBITMQ" = 1 ]
	then
		echo "Starting rabbitmq..."
		rabbitmq_start_service
	fi
}

stop_runtime_dependencies() {
	# TODO: pending complete implementation. also, other runtime dependencies should be added as needed.
	if [ "$NEED_MONGODB" = 1 ]
	then
		echo "Stopping mongodb..."
		echo "######### PENDING IMPLEMENTATION OF STOP_MONGODB"
	fi
	if [ "$NEED_MYSQL" = 1 ]
	then
		echo "Starting mysql..."
		echo "######### PENDING IMPLEMENTATION OF STOP_MYSQL"
	fi
	if [ "$NEED_RABBITMQ" = 1 ]
	then
		echo "Stopping rabbitmq..."
		rabbitmq_stop_service
	fi
}

# STARTING TO EXECUTE.
if [ "$INSTALL" = 1 ]
then
	echo "+++++++ Installing requirements. Executing pre-requirements.sh"
	./pre-requirements.sh
fi

if [ "$RUN_DEPS" = 1 ] || [ "$INSTALL" = 1 ]
then
	echo "+++++++ Running runtime dependencies."
	run_runtime_dependencies
fi

echo "+++++++ Running tests."
TEST_RESULT=0
$MOCHA --reporter $MOCHA_REPORTER --recursive $COMPONENT_TEST_FOLDER $SMOKE_OPTIONS \
	|| TEST_RESULT=$?

echo "+++++++ Run tests with result: " $TEST_RESULT

if [ "$STOP_DEPS" = 1 ]
then
	echo "+++++++ Stopping runtime dependencies."
	stop_runtime_dependencies
fi

echo "Done with exit code $TEST_RESULT"
exit $TEST_RESULT
