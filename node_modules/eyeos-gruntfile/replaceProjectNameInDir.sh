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
Usage: $0 [OPTIONS] PROJECT_NAME INPUT_DIR OUTPUT_DIR

Copies all files/dirs inside INPUT_DIR to OUTPUT_DIR, calling replaceProjectNameInFile.sh
with each file.

OPTIONS are:
     -h, --help            Show this help and exit.
     -f, --force           Overwrite files in OUTPUT_DIR if they exist.

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

THISDIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="$1"
PROJECT_NAME_UPPER="$(echo ${PROJECT_NAME^^} | tr '-' '_')"
INPUT_DIR="$(echo $2 | sed 's@/*$@@g')"
OUTPUT_DIR="$(echo $3 | sed 's@/*$@@g')"

find "$INPUT_DIR" -not -type d -print0 |
	while IFS= read -r -d $'\0' INPUT_FILE
	do
		OUTPUT_FILE="$(echo $INPUT_FILE | sed 's@'"$INPUT_DIR"'@'"$OUTPUT_DIR"'@g')"
		"$THISDIR"/replaceProjectNameInFile.sh -f "$PROJECT_NAME" "$INPUT_FILE" "$OUTPUT_FILE"
	done
