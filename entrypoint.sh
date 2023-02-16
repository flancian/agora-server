#!/bin/bash
# set -e
echo " test env $SOURCES_YML_URL"
if [[ -v SOURCES_YML_URL ]]; then
	echo "Grabbing $SOURCES_YML_URL"
	export YAML_CONFIG=/agora-server/sources.yaml
	wget $SOURCES_YML_URL -O $YAML_CONFIG
fi

echo "$@"
./run-dev.sh "$@"