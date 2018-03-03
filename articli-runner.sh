#! /bin/bash

TIMEOUT=5
SAMPLE=8

while [ 1 == 1 ] ;
do
	./articli -u http://www.theherald.com.au/story -r 144..5244000 -s $SAMPLE
	echo "Waiting for $TIMEOUT seconds..."
	sleep $TIMEOUT
	echo `date`
done
