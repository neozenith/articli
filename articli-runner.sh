#! /bin/bash

TIMEOUT=10
SAMPLE=10

while [ 1 == 1 ] ;
do
	./articli -u http://www.theherald.com.au/story -r 105000..110000 -s $SAMPLE
	echo "Waiting for $TIMEOUT seconds..."
	sleep $TIMEOUT
	echo `date`
done
