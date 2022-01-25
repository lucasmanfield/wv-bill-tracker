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
from dateutil.parser import parse
import pytz

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
      'date': agendaSoup.h1.string.strip(),
      'bills': agenda_bills,
      'url': url,
      'type': 'committee'
    }
    agenda['date'] = agenda['date'].split('-')[0]
    try:
      agenda['date'] = pytz.timezone('US/Eastern').localize(parse(agenda['date'])).isoformat()
    except:
      agenda['date'] = agenda['date'].split('2021')[0]
      agenda['date'] = agenda['date'].split('2022')[0]
      agenda['date'] = pytz.timezone('US/Eastern').localize(parse(agenda['date'])).isoformat()
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
  if not container:
    return {}

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


### scrape bills

bills = {}

# Extract just members
members = {}
agendas = []

with open("legislators.json", "w") as f:
    f.write(json.dumps(members))

  
with open("bills.json", "w") as f:
  f.write(json.dumps({
    'bills': bills,
    'agendas': agendas
  }))

print("Wrote bills.json")



