from bs4 import BeautifulSoup
from urllib.request import urlopen
from urllib.parse import urlencode, quote_plus, quote
import json

"""
chambers = {
  'house': {
    'name': 'House',
    'root': 'http://www.wvlegislature.gov/House/'
  }, 
  'senate': {
    'name': 'Senate',
    'root': 'http://www.wvlegislature.gov/Senate1/'
  }
}

for name, chamber in chambers.items():
  #extract leadership for each chamber
  leadership = {}
  url = chamber['root'] + 'roster.cfm'
  print("Loading " + url)
  html_doc = urlopen(url)
  soup = BeautifulSoup(html_doc, 'html.parser')

  title = None
  members = []
  for child in soup.find(id='wrapleftcol').contents:
    if child.name == 'strong':
      if title:
        leadership[title] = members
      title = child.text.rstrip(':').replace('Whips', 'Whip')
      members = []
    if child.name == 'a':
      members.append(child.text)
  leadership[title] = members
  chamber['leadership'] = leadership

  #extract list of members from table with link
  members = {}
  for link in soup.table.find_all('a'):
    href = link.get('href')
    if 'lawmaker' in href and len(link.text) > 0:
      if link.text not in members.keys():
        members[link.text] = {
          'url': href.replace(' ', '%20'),
          'positions': [],
          'chamber': chamber['name']
        }
  chamber['members'] = members

  # extract info from each members' page
  for name, member in members.items():
    member['url'] = chamber['root'] + member['url']
    print("Loading " + member['url'])
    html_doc = urlopen(member['url'])
    soup = BeautifulSoup(html_doc, 'html.parser')

    member['biography'] = soup.find(class_='popup').div.text

    title = soup.h2.text
    if 'R -' in title:
      member['party'] = 'Republican'
    if 'D -' in title:
      member['party'] = 'Democrat'
    district_name = title[(title.find('-') + 2):title.find(',')]
    member['district_name'] = district_name
    member['district'] = int(title.split(',')[1].replace(')', '').strip())

    member['photo'] = soup.find(id='wrapleftcolr').img.get('src').replace('../..', 'http://www.wvlegislature.gov')

    committees = []
    for item in soup.find(id='wraprightcolr').contents:
      if not item.string:
        continue
      if 'VICE CHAIR' in str(item.string):
        role = 'Vice Chair'
      elif 'CHAIR' in str(item.string):
        role = 'Chair'
      elif 'NONVOTING' in str(item.string):
        role = 'Nonvoting'
      elif item.name == 'a':
        committees.append({
          'name': str(item.string).strip(),
          'role': role or 'Member'
        })
        role = None
    member['committees'] = committees
  
  # move leadership positions into the member objects
  for position, members in leadership.items():
    for name in members:
      chamber['members'][name]['positions'].append(position)

# Extract just members
members = {}
for name, chamber in chambers.items():
  members.update(chamber['members'])
with open("legislators.json", "w") as f:
    f.write(json.dumps(members))

"""  


# pull bills

bills = {}

html_doc = urlopen('http://www.wvlegislature.gov/Bill_Status/Bills_all_bills.cfm?year=2021&sessiontype=RS&btype=bill')
soup = BeautifulSoup(html_doc, 'html.parser')

bill_count = len(soup.find_all(id='wrapper')[1].find_all('tr')[1:])
bill_num = 0

for tr in soup.find_all(id='wrapper')[1].find_all('tr')[1:]:

  cells = tr.find_all('td')
  bill_name = cells[0].find('a').string.strip()
  url = 'http://www.wvlegislature.gov/Bill_Status/' + cells[0].find('a').get('href')

  if cells[2].string.strip() == 'Signed':
    status = {
      'step': 'signed',
    }
  else:
    committee = cells[3].find('a').string.replace('Senate', '').replace('House', '').strip()
    if committee == 'FD':
      committee = 'Fire Departments and EMS'
    elif committee == 'T&I':
      committee = 'Technology and Infrastructure'
    elif committee == 'WORK':
      committee = 'Workforce'
    elif committee == 'DA':
      committee = "Substance Abuse"
    elif committee == 'WD':
      committee = "Workforce Development"
    elif committee == 'ENG':
      committee = "Energy"
    status = {
      'committee': committee,
      'step': cells[4].string.strip().lower(),
      'last_action_date': cells[5].string.strip()
    }


  print("Loading " + url)
  html_doc = urlopen(url)
  soup = BeautifulSoup(html_doc, 'html.parser')

  bill_table = soup.find_all('table')[1]

  bill = {
    'url': url,
    'status': status,
    'last_action': bill_table.find_all('tr')[1].find_all('td')[1].find('i').string.strip(),
    'title': bill_table.find_all('tr')[2].find_all('td')[1].string.strip(),
    'sponsors': [{
      'name': bill_table.find_all('tr')[3].find_all('td')[1].find('a').string.strip(),
      'classification': 'primary'
    }],
    'bill_text': 'http://www.wvlegislature.gov' + bill_table.find_all('tr')[5].find_all('td')[1].find_all('a')[1].get('href'),
    'subjects': []
  }
  if len(bill_table.find_all('tr')) >= 16 and len(bill_table.find_all('tr')[15].find_all('td')) >= 2:
    bill['subjects'] = [a.string for a in bill_table.find_all('tr')[15].find_all('td')[1].find_all('a')]
  else:
    print("Subjects not found for %s" % url)

  for a in bill_table.find_all('tr')[4].find_all('td')[1].find_all('a'):
    bill['sponsors'].append({
      'name': a.string.strip(),
      'classification': 'cosponsor'
    })
  if bill['last_action'].startswith('H '):
    bill['status']['chamber'] = 'house'
  elif bill['last_action'].startswith('S '):
    bill['status']['chamber'] = 'senate'

    
  
  bills[bill_name] = bill

  bill_num += 1
  print("Loaded bill %d of %d: %s" % (bill_num, bill_count, bill))

# fiscal notes

html_doc = urlopen('http://www.wvlegislature.gov/Bill_Status/bills_fiscal.cfm?year=2021&sessiontype=RS&btype=bill&note=fiscal')
soup = BeautifulSoup(html_doc, 'html.parser')

note_count = len(soup.find_all('table')[2].find_all('tr')[1:])
note_num = 0

for tr in soup.find_all('table')[2].find_all('tr')[1:]:
  note_num += 1

  cells = tr.find_all('td')
  bill_name = cells[1].string.strip() if len(cells[1].string.strip()) else cells[2].string.strip()
  
  if not len(bill_name):
    print("Skipping fiscal note row %s" % cells)
    continue

  bill_name = bill_name.replace("HB", "HB ").replace("SB", "SB ")
  if bill_name not in bills.keys():
    print("Fiscal note: %s not found" % bill_name)
    continue

  bill_agency_anchor = cells[4].find('a')

  if bill_agency_anchor and bill_agency_anchor != -1:
    url = 'http://www.wvlegislature.gov' + bill_agency_anchor.get('href')
    note = {
      'agency': bill_agency_anchor.string,
      'url': url
    }

    print("Loading %s" % url)
    try:
      html_doc = urlopen(url)
      fiscalNoteSoup = BeautifulSoup(html_doc, 'html.parser')
      fiscal_note_table = fiscalNoteSoup.find_all('table')[2]

      note['annual_cost'] = float(fiscal_note_table.find_all('tr')[2].find_all('td')[2].string.replace(',',''))
      note['annual_revenue'] = float(fiscal_note_table.find_all('tr')[8].find_all('td')[2].string.replace(',',''))
    except Exception as e:
      print("Unable to parse %s: %s" % (url, e))
      pass
    
    bills[bill_name]['fiscal_note'] = note
    print("Loaded fiscal note %d of %d: %s" % (note_num, note_count, note))
  else:
    print("Skipping fiscal note for %s" % bill_name)
  
with open("bills.json", "w") as f:
    f.write(json.dumps({'bills': bills}))



