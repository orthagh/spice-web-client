#!/bin/bash
set -e
name="{{projectName}}";
prefix="eyeos-";

desc="$name service";

eyeos-finish-installation --default $prefix$name