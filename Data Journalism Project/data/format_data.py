import csv
import json

# Converts a cleansed Tax Foundation CSV (one row per year) into a JSON object
# shaped like {bracket: {year: value}}.
# Fix: the original version read plain text lines, which have no .items(), so it crashed;
# csv.DictReader gives each row as a dictionary keyed by the column headers.

f1 = open("Percent of all income taxes paid.csv", "r", newline="")
rows = csv.DictReader(f1)

dictionary = {}
for row in rows:
    for bracket, value in row.items():
        if bracket != 'Year':
            if bracket not in dictionary:
                dictionary[bracket] = {}
            dictionary[bracket][row['Year']] = value
f1.close()

f2 = open("Percent of all income taxes paid.json", "w")
json.dump(dictionary, f2, indent=4)

f2.close()
