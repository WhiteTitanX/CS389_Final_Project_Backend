#!/usr/bin/env python3

import os
import signal
import subprocess
import time
import datetime
import requests
import json
import hashlib
from urllib3.exceptions import InsecureRequestWarning

subprocess.call('./cleanup.sh', shell=True)

cmd = 'airodump-ng -i wlan1 -w /tmp/scriptwifi --output-format csv &'
proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, preexec_fn=os.setsid)
print("Launching airodump-ng with PID:", proc.pid)

url = 'https://amazonaws.com/dev/overseer'
headers = {'Content-Type':'application/json', 'x-api-key':''}
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)
timer = 0
while True:
	time.sleep(300)
	output = open("/tmp/scriptwifi-01.csv", "r")
	lines = output.readlines()
	output.close()
	e = False

	date_time_now = datetime.datetime.now()
	print("\nCurrent datetime is " + str(date_time_now))

	for line in lines:
		line = line.strip()
		if(e and line != ""):
			data = line.split(",")
			date_time = datetime.datetime.strptime(data[2].strip(), "%Y-%m-%d %H:%M:%S")
			date_diff = date_time_now - date_time
			minutes = divmod(date_diff.seconds, 60)
			print(str(hashlib.sha256((data[0]).encode('utf8')).hexdigest())[0:12] + " last seen " + str(date_time) + " : " + str(minutes[0]) + " minutes")
			if(minutes[0] < 16):
				data_to_send = {'host':str(hashlib.sha256((data[0]).encode('utf8')).hexdigest()), 'sensor':0, 'place':'miller','timestamp':(str(date_time)+ " GMT-0400")}
				requests.post(url, data = json.dumps(data_to_send), headers = headers, verify = False)
		if(line == "Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs"):
			e = True
	print("Finished Update")
	timer += 1
	if(timer > 9):
		timer = 0
		print("Terminating airodump-ng with PID:", proc.pid)
		os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
		subprocess.call('./cleanup.sh', shell=True)
		print("Launching new airodump-nd with PID:", proc.pid)
		proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, preexec_fn=os.setsid)


