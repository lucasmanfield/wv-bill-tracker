from bs4 import BeautifulSoup
from urllib.parse import urlencode, quote_plus, quote
import json
import re
import subprocess
import requests
import time
import os
import datetime
from urllib.request import urlretrieve, build_opener, install_opener, urlcleanup
import socket
import ssl

socket.setdefaulttimeout(3)
opener = build_opener()
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36')]
install_opener(opener)
ssl._create_default_https_context = ssl._create_unverified_context

urlcleanup()

chambers = {
  'house': {
    'name': 'House',
    'root': 'https://www.wvlegislature.gov/House/',
    'committees': 'https://www.wvlegislature.gov/committees/house/',
    'calendar': 'https://www.wvlegislature.gov/Bulletin_Board/house_calendar_daily.cfm?ses_year=2022&sesstype=RS&headtype=dc&houseorig=h',
    'special_calendar': 'https://www.wvlegislature.gov/Bulletin_Board/house_calendar_special.cfm?ses_year=2022&sesstype=RS&headtype=sc&houseorig=h',
    'agendas': {}
  }, 
  'senate': {
    'name': 'Senate',
    'root': 'https://www.wvlegislature.gov/Senate1/',
    'committees': 'https://www.wvlegislature.gov/committees/senate/',
    'calendar': 'https://www.wvlegislature.gov/Bulletin_Board/senate_calendar.cfm?ses_year=2022&sesstype=RS&headtype=dc&houseorig=s',
    'agendas': {}
  }
}

def do_request(url):
  r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'}, verify=False, timeout=5)
  r.raise_for_status()
  return r

def do_download(url):
  filename, resp = urlretrieve(url)
  return filename

def load_page(url, wait=None, retries=10):
  for i in range(retries):
    try:
      if wait:
        time.sleep(wait)  # necessary to avoid 500 errors
      r = do_request(url)
      return r.text
    except Exception as e:
      print(e)
      continue
  raise Exception("%s failed" % url)

def download_file(url, wait=1, retries=5):
  for i in range(retries):
    try:
      if wait:
        time.sleep(wait)  # necessary to avoid 500 errors
      filename = do_download(url)
      return filename
    except Exception as e:
      print(e)
      continue
  raise Exception("%s failed" % url)

def convert_pdf(filename, type="xml"):
    commands = {
        "text": ["pdftotext", "-layout", filename, "-"],
        "text-nolayout": ["pdftotext", filename, "-"],
        "xml": ["pdftohtml", "-xml", "-stdout", filename],
        "html": ["pdftohtml", "-stdout", filename],
    }
    try:
        pipe = subprocess.Popen(
            commands[type], stdout=subprocess.PIPE, close_fds=True
        ).stdout
    except OSError as e:
        raise EnvironmentError(
            "error running %s, missing executable? [%s]" % " ".join(commands[type]), e
        )
    data = pipe.read()
    pipe.close()
    return data

def scrape_senate_vote_3col(text):
  lines = list(filter(None, text.splitlines()))
  votes = {
    'yes': [],
    'no': [],
    'other': []
  }
  for line in lines:
    vals = re.findall(r"(?<!\w)(Y|N|A)\s+((?:\S+ ?)+)", line)
    for vote_val, name in vals:
        vote_val = vote_val.strip()
        name = name.strip()
        if vote_val == "Y":
            if "Class Y" in line:
                continue
            votes['yes'].append(name)
        elif vote_val == "N":
          votes['no'].append(name)
        else:
          votes['other'].append(name)

  return {
    'chamber': 'senate',
    'votes': votes
  }

def scrape_senate_vote(url):
  try:
    filename = download_file(url)
  except:
    return None
  print("Downloaded %s to %s" % (url, filename))
  text = convert_pdf(filename, "text").decode("utf-8")
  os.remove(filename)

  if re.search(r"Yea:\s+\d+\s+Nay:\s+\d+\s+Absent:\s+\d+", text):
    return scrape_senate_vote_3col(text)

  data = re.split(r"(Yea|Nay|Absent)s?:", text)[::-1]
  data = list(filter(None, data))
  keymap = dict(yea="yes", nay="no")
  votes = {
    'yes': [],
    'no': [],
    'other': [],
    'paired': []
  }

  while True:
      if not data:
          break
      vote_val = data.pop()
      key = keymap.get(vote_val.lower(), "other")
      values = data.pop()
      for name in re.split(r"(?:[\s,]+and\s|[\s,]{2,})", values):
          if name.lower().strip() == "none.":
              continue
          name = name.replace("..", "")
          name = re.sub(r"\.$", "", name)
          name = name.strip("-1234567890 \n")
          if not name:
              continue
          votes[vote_val].append(name)

  return {
      'chamber': 'senate',
      'votes': votes
    }

def scrape_house_vote(url):
  print("Downloading", url)
  try:
    filename = download_file(url)
  except:
    return None
  text = convert_pdf(filename, "text")
  os.remove(filename)

  lines = text.splitlines()
  vote_type = None
  date = None
  passed = False
  votes = {
    'yes': [],
    'no': [],
    'other': [],
    'paired': []
  }

  for idx, line in enumerate(lines):
    line = line.rstrip().upper().decode("utf-8")
    match = re.search(r"(\d+)/(\d+)/(\d{4,4})", line)
    if match:
      date = datetime.datetime.strptime(match.group(0), "%m/%d/%Y")
      continue
    
    if line.endswith("ADOPTED") or line.endswith("PASSED"):
        passed = True

    match = re.match(r"(YEAS|NAYS|YEA|NAY|NOT VOTING|PAIRED|EXCUSED):\s+(\d+)\s*$", line)
    if match:
      vote_type = {
        "YEAS": "yes",
        "NAYS": "no",
        "YEA": "yes",
        "NAY": "no",
        "NOT VOTING": "other",
        "EXCUSED": "other",
        "PAIRED": "paired",
      }[match.group(1)]
      continue

    if vote_type == "paired":
      for part in line.split("   "):
          part = part.strip()
          if not part:
              continue
          name, pair_type = re.match(r"([^\(]+)\((YEA|NAY)\)", line).groups()
          name = name.strip()
          if pair_type == "YEA":
              votes["yes"].append(name)
          elif pair_type == "NAY":
              votes["no"].append(name)
    elif vote_type:
        for name in line.split("   "):
            name = name.strip()
            if not name:
                continue
            votes[vote_type].append(name)
  if not date:
    raise Exception("No date")

  return {
    'chamber': 'house',
    'votes': votes
  }



def parse_agenda(url):
  print("Loading", url)
  html_doc = load_page(url, wait=3)
  agendaSoup = BeautifulSoup(html_doc, 'html.parser')
  
  if agendaSoup.blockquote:
    agenda_text = agendaSoup.find(id='wrapleftcol').getText()
    agenda_bills = re.findall(r'\wB [0-9]+', agenda_text)
    agenda_bills.extend([b.upper().replace('HB', 'HB ').replace('SB', 'SB ') for b in re.findall(r'\wB[0-9]+', agenda_text)])
    agenda_bills.extend([b.upper().replace('H. B.', 'HB').replace('S. B.', 'SB') for b in re.findall(r'\w. B. [0-9]+', agenda_text)])
    agenda_bills.extend([b.upper().replace('H.B.', 'HB').replace('S.B.', 'SB') for b in re.findall(r'\w.B. [0-9]+', agenda_text)])
    agenda_bills.extend([b.upper().replace('HOUSE BILL', 'HB').replace('SENATE BILL', 'SB') for b in re.findall(r'(?:House|house|Senate|senate) (?:Bill|bill) [0-9]+', agenda_text)])
    agenda = {
      'date': agendaSoup.h1.string.strip()
                .replace('a. m.', 'AM').replace('a. m.', 'AM')
                .replace('a.m.', 'AM').replace('p.m.', 'PM')
                .replace('a. m.', 'AM').replace('p. m.', 'PM'),
      'bills': agenda_bills,
      'url': url,
      'type': 'committee'
    }
    agenda['date'] = re.sub('a$', 'AM', agenda['date'], flags=re.IGNORECASE)
    agenda['date'] = re.sub('p$', 'PM', agenda['date'], flags=re.IGNORECASE)
    agenda['date'] = re.sub('\Sam', ' AM', agenda['date'], flags=re.IGNORECASE)
    agenda['date'] = re.sub('\Spm', ' PM', agenda['date'], flags=re.IGNORECASE)
    print("Wrote agenda for %s: %s" % (url, agenda))
    return agenda
  else:
    print("No agenda found for", committee)
  return None

def parse_calendar(url):
  html_doc = requests.get(url, verify=False).text
  soup = BeautifulSoup(html_doc, 'html.parser')
  
  date = None
  container = soup.find(id='wraprightcolxr')
  for span in container.find_all('span'):
    content = span.string.strip().replace('&nbsp;', '')
    if len(content) and 'CALENDAR' not in content:
      date = content.replace('\r\n', ' ')
      break
  
  for span in container.find_all('span'):
    if not span.string:
      continue
    content = span.string.lower().strip().replace('&nbsp;', '')
    if 'am' in content or 'pm' in content or 'a. m.' in content or 'p. m.' in content or 'a.m.' in content or 'p.m.' in content:
      date = date + ' ' + content.replace('a. m.', 'am').replace('p. m.', 'pm').replace('a.m.', 'am').replace('p.m.', 'pm')
      break
  
  calendar_bills = [b.replace('H. B.', 'HB').replace('S. B.', 'SB') for b in re.findall(r'\w. B. [0-9]+', container.getText())]
  print("Got calendar for %s: %s" % (date, calendar_bills))
  return {
    'date': date,
    'bills': calendar_bills,
    'url': url
  }
  
def parse_bill(url):
  print("Loading " + url)
  html_doc = load_page(url, wait=1)
  soup = BeautifulSoup(html_doc, 'html.parser')

  bill_table = soup.find_all('table')[1]

  bill = {
    'url': url,
    'last_action': bill_table.find_all('tr')[1].find_all('td')[1].find('i').strong.string if bill_table.find_all('tr')[1].find_all('td')[1].find('i').strong else bill_table.find_all('tr')[1].find_all('td')[1].find('i').string.strip(),
    'title': bill_table.find_all('tr')[2].find_all('td')[1].string.strip(),
    'sponsors': [{
      'name': bill_table.find_all('tr')[3].find_all('td')[1].find('a').string.strip(),
      'classification': 'primary'
    }] if bill_table.find_all('tr')[3].find_all('td')[1].find('a') else [],
    'subjects': [],
    'amendments': [],
    'versions': [],
    'votes': []
  }
  if len(bill_table.find_all('tr')[5].find_all('td')[1].find_all('a')):
    for a in bill_table.find_all('tr')[5].find_all('td')[1].find_all('a'):
      if a.string.strip() == 'pdf':
        title = a.get('title').strip().replace('PDF - ', '').split(' - ')[0].replace(' - ', '')
        if 'Bill' in title:
          title = 'Signed Enrolled Version'
        bill['versions'].append({
          'name': title,
          'url': 'https://www.wvlegislature.gov' + a.get('href')
        })
  if len(bill_table.find_all('tr')) >= 15 and len(bill_table.find_all('tr')[14].find_all('td')) >= 2:
    bill['similar_to'] = bill_table.find_all('tr')[14].find_all('td')[1].find('a').string.replace('HB', 'HB ').replace('SB', 'SB ')
  if len(bill_table.find_all('tr')) >= 16 and len(bill_table.find_all('tr')[15].find_all('td')) >= 2:
    bill['subjects'] = [a.string for a in bill_table.find_all('tr')[15].find_all('td')[1].find_all('a')]
  else:
    print("Subjects not found for %s" % url)

  for a in bill_table.find_all('tr')[4].find_all('td')[1].find_all('a'):
    bill['sponsors'].append({
      'name': a.string.strip(),
      'classification': 'cosponsor'
    })

  amendment_links = []
  
  for row in [bill_table.find_all('tr')[10], bill_table.find_all('tr')[11]]:
    if len(row.find_all('td')):
      amendment_links.extend(row.find_all('td')[1].find_all('a'))

  amendments = []
  statuses = ['introduced', 'amended', 'rejected', 'withdrawn', 'adopted']
  for a in amendment_links:
    status = 'introduced'
    name = a.string.replace(' _ ', ',').replace(' AND ', ',').strip().lower()

    num = 1
    for i in range(10):
      searchNum = '_%s' % str(i)
      if searchNum in name:
        num = i
        name = name.replace(searchNum, '')
    
    for s in statuses:
      if s in name:
        status = s
        name = name.replace(' ' + s, '').replace(s, '')

    name = name.replace('  ', ' ')

    parts = name.split(' ')
    type = parts[1]
    sponsors = parts[2].split(',')

    dates = re.findall(r'[0-9]+-[0-9]+', name)
    date = dates[0] if len(dates) else ""
    amendment_id = "%s|%s|%s" % (','.join(sponsors), num, date)
    
    url = 'https://www.wvlegislature.gov' + a.get('href')

    amendments.append({
      'type': type,
      'url': url,
      'sponsors': sponsors,
      'number': num,
      'status': status,
      'id': amendment_id
    })
    
  sorted_amendments = sorted(amendments, key=lambda a: statuses.index(a['status']))
  print('\n'.join([a['id'] for a in sorted_amendments]))
  for amendment in sorted_amendments:
    added = False
    for added_amendment in bill['amendments']:
      # if this is an updated version, then update it
      if amendment['id'] == added_amendment['id']:
        print("Overwriting ", [a['id']  for a in [added_amendment, amendment]])
        added_amendment['status'] = amendment['status']
        added_amendment['url'] = amendment['url']
        added = True
        break
    if not added:
      bill['amendments'].append(amendment)
  print('\n'.join([a['id'] for a in bill['amendments']]))

  for tr in soup.find_all('tr'):
    roll_link = tr.find('a', attrs={'data-type': 'rol'})
    if roll_link:
      date = tr.find_all('td')[2].string.strip()
      name = roll_link.string.strip().lower()
      url = 'https://www.wvlegislature.gov' + roll_link.get('href')
      vote = None
      passed = False
      try:
        if 'motion' in name:
          pass
          # do nothing
        elif 'passed house' in name:
          vote = scrape_house_vote(url)
          passed = True
        elif 'house rejected' in name:
          vote = scrape_house_vote(url)
        elif 'passed senate' in name:
          vote = scrape_senate_vote(url)
          passed = True
        elif 'senate rejected' in name:
          vote = scrape_senate_vote(url)
      except Exception as e:
        print("FAILED to scrape vote from ", url)
      if vote:
        vote['passed'] = passed
        vote['date'] = date
        vote['url'] = url
        print("Adding %s vote %s to %s" % (vote['chamber'], str(vote), bill['title']))
        bill['votes'].append(vote)

  return bill

#test_parse = parse_bill('http://www.wvlegislature.gov/Bill_Status/Bills_history.cfm?input=569&year=2022&sessiontype=RS&btype=bill')
#print(test_parse)  

#test_agenda = parse_agenda('http://www.wvlegislature.gov/committees/house/house_com_agendas.cfm?Chart=jud&input=02-18-2021')
#print(test_agenda)  


### scrape bills

bills = {}

html_doc = requests.get('https://www.wvlegislature.gov/Bill_Status/Bills_all_bills.cfm?year=2022&sessiontype=RS&btype=bill', verify=False).text
soup = BeautifulSoup(html_doc, 'html.parser')

bill_count = len(soup.find_all(id='wrapper')[1].find_all('tr')[1:])
bill_num = 0

for tr in soup.find_all(id='wrapper')[1].find_all('tr')[1:]:

  cells = tr.find_all('td')
  bill_name = cells[0].find('a').string.strip()
  url = 'https://www.wvlegislature.gov/Bill_Status/' + cells[0].find('a').get('href')

  if cells[2].string.lower().strip() == 'signed':
    status = {
      'step': 'signed'
    }
  elif cells[2].string.lower().strip() == 'vetoed':
    status = {
      'step': 'vetoed'
    }
  elif cells[2].string.lower().strip() == 'pass':
    status = {
      'step': 'passed',
      'last_action_date': cells[4].string.strip()
    }
  elif cells[2].string.lower().strip() == 'rejected':
    status = {
      'step': 'failed',
      'last_action_date': cells[4].string.strip()
    }
  else:
    if len(cells) == 5:
      status = {
        'step': cells[3].string.strip().lower(),
        'last_action_date': cells[4].string.strip()
      }
    elif len(cells) == 6:
      status = {
        'step': cells[4].string.strip().lower(),
        'last_action_date': cells[5].string.strip()
      }

      committeeCell = cells[3].find('a')
      if committeeCell: 
        committee = committeeCell.string.replace('Senate', '').replace('House', '').strip()
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
        status['committee'] = committee

    else:
      raise Exception("ERROR READING BILL LIST AT %s" % cells)
    
  bill = parse_bill(url)
  bill['status'] = status
  if bill['last_action'].startswith('H '):
    bill['status']['chamber'] = 'house'
  elif bill['last_action'].startswith('S '):
    bill['status']['chamber'] = 'senate'
  bills[bill_name] = bill

  bill_num += 1
  print("Loaded bill %d of %d: %s" % (bill_num, bill_count, bill))

### scrape fiscal notes

html_doc = requests.get('https://www.wvlegislature.gov/Bill_Status/bills_fiscal.cfm?year=2022&sessiontype=RS&btype=bill&note=fiscal', verify=False).text
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
    url = 'https://www.wvlegislature.gov' + bill_agency_anchor.get('href')
    note = {
      'agency': bill_agency_anchor.string,
      'url': url
    }

    print("Loading %s" % url)
    try:
      html_doc = requests.get(url, verify=False).text
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

### scrape agendas

agendas = [
  {
    'name': 'Senate Calendar',
    'chamber': 'senate',
    'type': 'floor',
    **parse_calendar(chambers['senate']['calendar'])
  },
  {
    'name': 'House Special Calendar',
    'chamber': 'house',
    'type': 'special',
    **parse_calendar(chambers['house']['special_calendar'])
  },
  {
    'name': 'House Calendar',
    'chamber': 'house',
    'type': 'floor',
    **parse_calendar(chambers['house']['calendar'])
  },
]

for name, chamber in chambers.items():
  url = chamber['committees'] + 'main.cfm'
  print("Loading", url)
  html_doc = load_page(url)
  soup = BeautifulSoup(html_doc, 'html.parser')
  last_comm_name = None
  for a in soup.find_all('a'):
    link = a.get('href')
    if link and 'com_agendas' in link:
      url = chamber['committees'] + link.replace(' ', '+')
      print("Found agenda", url)
      committee = last_comm_name
      agenda = parse_agenda(url)
      if agenda:
        agenda['committee'] = committee
        agenda['chamber'] = name
        agenda['name'] = "%s %s Committee Agenda" % (agenda['chamber'].capitalize(), agenda['committee'])
        agendas.append(agenda)
      
    else:
      last_comm_name = a.string


### scrape legislators

for name, chamber in chambers.items():
  #extract leadership for each chamber
  leadership = {}
  url = chamber['root'] + 'roster.cfm'
  print("Loading " + url)
  html_doc = requests.get(url, verify=False).text
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
  for tr in soup.table.find_all('tr')[2:]:
    cells = tr.find_all('td')
    link = cells[0].find_all('a')[1]
    if link.text not in members.keys():
      members[link.text] = {
        'url': link.get('href').replace(' ', '%20'),
        'positions': [],
        'chamber': chamber['name'],
        'party': cells[1].string,
        'district': int(cells[2].string),
        'address': cells[3].string,
        'phone': cells[5].string,
        'email': cells[4].string
      }
  chamber['members'] = members

  # extract info from each members' page
  for name, member in members.items():
    member['url'] = chamber['root'] + member['url']
    print("Loading " + member['url'])
    html_doc = requests.get(member['url'], verify=False).text
    soup = BeautifulSoup(html_doc, 'html.parser')

    member['biography'] = soup.find(class_='popup').div.text
    title = soup.h2.text
    district_name = title[(title.find('-') + 2):title.find(',')]
    member['district_name'] = district_name
    member['photo'] = soup.find(id='wrapleftcolr').img.get('src').replace('../..', 'http://www.wvlegislature.gov')
    committees = []
    role = None
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
          'name': str(item.string).strip().replace('&', 'and'),
          'role': role or 'Member'
        })
        role = None
    member['committees'] = committees

    print(member)
  
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

  
with open("bills.json", "w") as f:
  f.write(json.dumps({
    'bills': bills,
    'agendas': agendas
  }))

print("Wrote bills.json")



