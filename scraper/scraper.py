from bs4 import BeautifulSoup
from urllib.request import urlopen
from urllib.parse import urlencode, quote_plus, quote
import json

# Now pull fiscal notes

fiscal_notes = []

html_doc = urlopen('http://www.wvlegislature.gov/Bill_Status/bills_fiscal.cfm?year=2021&sessiontype=RS&btype=bill&note=fiscal')
soup = BeautifulSoup(html_doc, 'html.parser')

for tr in soup.find_all('table')[2].find_all('tr')[1:]:
  cells = tr.find_all('td')
  bill_name = cells[1].string.strip() if len(cells[1].string.strip()) else cells[2].string.strip()
  if not len(bill_name):
    continue

  bill_agency_anchor = cells[4].find('a')
  if bill_agency_anchor and bill_agency_anchor != -1:
    fiscal_notes.append({
      'bill': bill_name,
      'agency': bill_agency_anchor.string,
      'url': bill_agency_anchor.get('href')
    })

for note in fiscal_notes:
  url = 'http://www.wvlegislature.gov' + note['url']
  print("Loading %s" % url)
  html_doc = urlopen(url)
  soup = BeautifulSoup(html_doc, 'html.parser')
  fiscal_note_table = soup.find_all('table')[2]

  try:
    note['annual_cost'] = float(fiscal_note_table.find_all('tr')[2].find_all('td')[2].string.replace(',',''))
    note['annual_revenue'] = float(fiscal_note_table.find_all('tr')[8].find_all('td')[2].string.replace(',',''))
  except:
    print("Unable to parse %s" % url)
    pass
  

with open("fiscal_notes.json", "w") as f:
    f.write(json.dumps({'fiscal_notes': fiscal_notes}))


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
          'scraper_url': href.replace(' ', '%20'),
          'positions': [],
          'chamber': chamber['name']
        }
  chamber['members'] = members

  # extract info from each members' page
  for name, member in members.items():
    url = chamber['root'] + member['scraper_url']
    print("Loading " + url)
    html_doc = urlopen(url)
    soup = BeautifulSoup(html_doc, 'html.parser')

    member['biography'] = soup.find(class_='popup').div.text

    title = soup.h2.text
    if 'R -' in title:
      member['party'] = 'Republican'
    if 'D -' in title:
      member['party'] = 'Democrat'
    title = title[(title.find('-') + 2):title.find(',')]
    member['district_name'] = title

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

  
