#!/bin/bash -e
JMETER_PATH=${JMETER_HOME:-"$HOME/apache-jmeter-2.9"}
JMETER_PATH="$JMETER_PATH/bin"
echo "using jmeter path: $JMETER_PATH"
reportFolder=${1:-"./build/reports/"}
jmxFile=${2:-"./src/test/smoke-test/smoke-test.jmx"}
jtlReport=$reportFolder/smoke-tests.jtl
xmlReport=$reportFolder/smoke-test.xml
rm -f $jtlReport
rm -f $xmlReport
(
    cd node_modules/eyeos-authentication-fake/
    echo "killing old fake authenticator instances.."
    ps aux| grep fake-auth | grep -v grep | awk '{print $2}' | xargs -r kill -9 || true
    node server.js fake-auth &
    sleep 2
    echo "authenticator instance started on port 7890.."
)
PATH=$PATH:"$JMETER_PATH"
echo "PATH is: $PATH"
"$JMETER_PATH/jmeter.sh" -Jjmeter.save.saveservice.output_format=xml -n -t $jmxFile -l $jtlReport

