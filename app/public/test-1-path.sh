#!/bin/bash
#path  0-14

List=(mm fs ipc lib block init net kernel crypto sound drivers arch include security certs)

for path in {0..14}
do
	
	start_time=$(date +%s%N)/1000000
 
	./callgraph-sql.rb -2 / -d ${List[$path]} -o ./graph/test-${List[$path]}.graph null linux_4-15-18 x86_64 null real => ./log/call-${List[$path]}.log

	cost_time1=$[$(date +%s%N)/1000000-$start_time ]
	dot -Tsvg ./graph/test-${List[$path]}.graph -o ./svg/test-${List[$path]}.svg

	cost_time2=$[ $(date +%s%N)/1000000-$start_time ]
	echo "${List[$path]} $(($cost_time1)) $(($cost_time2))" >> test-1-all.log
done
