import glob   
import logging
import json

path = 'wv/*'   

bills = {}
organizations = {}
people = {}
memberships = []

for filename in glob.glob(path): 
    with open(filename, 'r') as f:
        data = json.loads(f.read())
        if 'bill_' in filename:
            name = data['identifier']
            bills[data['_id']] = {
                'name': data['identifier'],
                'title': data['title'],
                'legislative_session': data['legislative_session'],
                'from_chamber': 'house' if 'lower' in data['from_organization'] else 'senate',
                'subjects': data['subject'],
                'sponsors': [{
                    'name': d['name'], 
                    'classification': d['classification']
                } for d in data['sponsorships']],
                'actions': [{
                    'description': d['description'], 
                    'date': d['date'],
                    'chamber': 'house' if 'lower' in d['organization_id'] else 'senate',
                    'classification': d['classification'][0] if len(d['classification']) else None
                } for d in data['actions']],
                'url': data['sources'][0]['url'],
                'versions': [{
                    'note': d['note'], 
                    'url': d['links'][0]['url']
                } for d in data['versions']]
            }

        if 'person_' in filename:
            person = {
                'name': data['name'],
                'url': data['sources'][0]['url']
            }
            for item in data['contact_details']:
                t = item['type']
                if t == 'voice':
                    t = 'phone'
                person[t] = item['value']
            people[data['_id']] = person

        if 'membership_' in filename:
            memberships.append(data)

for membership in memberships:
    person = people[membership['person_id']]
    for party in ['Democrat', 'Republican', 'Libertarian', 'Mountain']:
        if party in membership['organization_id']:
            person['party'] = party
    if 'lower' in membership['organization_id']:
        person['chamber'] = 'house'
        person['office'] = 'WV State Representative'
    if 'upper' in membership['organization_id']:
        person['chamber'] = 'senate'
        person['office'] = 'WV State Senator'
    
    if membership['post_id']:
        postData = json.loads(membership['post_id'][1:].encode('utf-8').decode('unicode_escape'))
        person['district'] = postData['label']

with open("bills.json", "w") as f:
    f.write(json.dumps({
        'bills': list(bills.values()),
        'people': list(people.values())
    }))
    print("Wrote {} bills and {} people".format(len(bills), len(people)))
