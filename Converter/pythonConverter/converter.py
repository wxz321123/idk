import csv
import json

csvfile = open('../source/scheduling_preliminary_b_machine_resources_20180726.csv', 'r')
jsonfile = open('scheduling_preliminary_b_machine_resources_20180726.json', 'w')

fieldnames = ("id_server","cpu","ram","memory","p","m","pm")
reader = csv.DictReader( csvfile, fieldnames)
jsonfile.write('{"data":[')
i = 0
for row in reader:
    if( i != 0 ):
        jsonfile.write(',\n')
    json.dump(row, jsonfile)
    i=i+1
jsonfile.write(']}')