#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=`cygpath -w "$basedir"`;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../@react-native-community/cli/build/bin.js" "$@"
else 
  exec node  "$basedir/../@react-native-community/cli/build/bin.js" "$@"
fi
