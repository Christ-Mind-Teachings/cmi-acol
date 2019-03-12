#!/bin/bash

bin="../_bin/bin"

if [ "$1" != "" ]; then
  ${bin}/prep -b dialog $1
else
  rm *.json
  for i in `cat contents`; do
    ${bin}/prep -b dialog $i
  done
fi


