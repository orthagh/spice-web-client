#!/bin/bash
set -e
set -u

usage () {
	if [ "$*" ]
	then
		ERROR="ERROR: $*"
	else
		ERROR=""
	fi

	cat <<USAGE
Usage: $0 [OPTIONS] PROJECT_NAME INPUT_FILE OUTPUT_FILE

Copies INPUT_FILE to OUTPUT_FILE, replacing {{projectName}} inside the INPUT_FILE
with PROJECT_NAME, and {{projectNameUpper}} with the PROJECT_NAME converted to
uppercase.

OPTIONS are:
     -h, --help            Show this help and exit.
     -f, --force           Overwrite OUTPUT_FILE if it exists.

$ERROR
USAGE
}

fatal () {
	echo "ERROR: $*" >&2
	exit 1
}

# $FORCE: overwrite existing destination file?
FORCE=

# process commandline options
OUTOPT=$(getopt --options fy --longoptions force,help -n "$0" -- "$@")
eval set -- "$OUTOPT"
while true
do
	case "$1" in
		-h|--help)
			usage
			exit 0
			;;
		-f|--force)
			FORCE=1
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

if [ "$#" -ne 3 ]
then
	usage >&2
	exit 1
fi

PROJECT_NAME="$1"
PROJECT_NAME_UPPER="$(echo ${PROJECT_NAME^^} | tr '-' '_')"
INPUT_FILE="$2"
OUTPUT_FILE="$3"
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"

if [ -e "$OUTPUT_FILE" -a ! "$FORCE" ]
then
	fatal "Output file $OUTPUT_FILE exists and you have not specified -f or --force"
fi

if [ ! -e "$OUTPUT_DIR" ]
then
	mkdir -p "$OUTPUT_DIR"
fi

cp -a "$INPUT_FILE" "$OUTPUT_FILE"
sed -i \
	-e 's/{{projectName}}/'"$PROJECT_NAME"'/g' \
	-e 's/{{projectNameUpper}}/'"$PROJECT_NAME_UPPER"'/g' \
	"$OUTPUT_FILE"
