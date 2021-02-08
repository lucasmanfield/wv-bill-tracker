import React, { useState, useEffect, } from 'react';
import Autosuggest from 'react-autosuggest';
import { useHistory } from "react-router-dom";
import { useCookies } from 'react-cookie'
import { deadlines, capitalize } from './utilities'
import BillBox from './BillBox'
import PersonBox from './PersonBox'
import moment from 'moment'
import { CgSpinner } from 'react-icons/cg'

let timeout;
function App({ scrapedData }) {
  const [suggestions, setSuggestions] = useState([])
  const [address, setAddress] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [lastModified, setLastModified] = useState(null)
  const [representatives, setRepresentatives] = useState(null)
  const [representativesError, setRepresentativesError] = useState([])
  const [cookies, setCookie, removeCookie] = useCookies(['following', 'address', 'welcome'])


  useEffect(() => {
    fetch('https://wvlegislaturetracker.org', {
      method: 'HEAD'
    })
    .then(response => {
      setLastModified(moment(response.headers.get('last-modified')))
    })
  }, []);


  const getRepresentatives = (address) => {
    fetch('https://www.googleapis.com/civicinfo/v2/representatives?key=AIzaSyA6pBuQbIQYtJYBarykcwYzxxmuWULqw4Q&roles=legislatorLowerBody&roles=legislatorUpperBody&roles=headOfGovernment&levels=administrativeArea1&address=' + encodeURIComponent(address))
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setRepresentativesError(data.error)
          setRepresentatives([])
          return
        }
        if (!data.divisions) {
          setRepresentativesError('Address not specific.')
          setRepresentatives([])
          return
        }
        setRepresentativesError(null)
        const newRepresentatives = []
        Object.values(data.divisions).slice(1,3).forEach(district => {
          district.officeIndices.forEach(officeIdx => {
            const office = data.offices[officeIdx]
            office.officialIndices.forEach(idx => {
              const rep = data.officials[idx]
              newRepresentatives.push({
                ...rep, 
                office: office.name,
                district: district.name.replace('West Virginia State', '').replace('Senate district', '').replace('House district', ''),
                party: rep.party.replace(' Party', '').replace('Democratic', 'Democrat'),
                phone: rep.phones.length ? rep.phones[0] : null,
                email: rep.emails.length ? rep.emails[0] : null,
              })
            })
          })
        })
        if (!newRepresentatives.length) {
          setRepresentativesError('Address not specific.')
          setRepresentatives([])
          return
        }
        setRepresentatives(newRepresentatives)
      })
  }

  const history = useHistory()

  // Use your imagination to render suggestions.
  const renderSuggestion = suggestion => suggestion.type == 'bill' ? 
    (
      <div className="App-suggestion-bill">
        {suggestion.name} {suggestion.title || suggestion.party}
      </div>
    ) 
  :
    (
      <div className="App-suggestion-person">
        {suggestion.name}
      </div>
    )
  
  let following = (cookies.following || '').split(',')
  let followingBills = []
  following.forEach(name => {
    let found = false
    scrapedData.bills.forEach(bill => {
      if (found) return
      if (name == bill.name) {
        followingBills.push(bill)
        found = true
      }
    })
  })

  let nextDeadline = null
  deadlines.forEach(d => {
    if (!nextDeadline && d.date > moment()) {
      nextDeadline = d
    }
  })
  const sessionLength = deadlines[deadlines.length - 1].date.unix() - deadlines[0].date.unix()

  return (
    <div className="App-container">
      <div className="App-header">
        <h1>W.Va's 2021 Legislative Session Tracker</h1>
        <div className="byline">By <a href="https://mountainstatespotlight.org/author/lucasmanfield/">Lucas Manfield</a>, Mountain State Spotlight. {lastModified ? `Data updated ${lastModified.format('MMMM D, h:ss a').replace('pm', 'p.m.').replace('am', 'a.m.')}`: ''}</div>
        <div className="App-intro">
          <p>Keeping track of West Virginia's chaotic two months of lawmaking can be daunting. To help you decipher it, <a href="https://mountainstatespotlight.org">Mountain State Spotlight</a> is trying something new.</p>
          <p>Here, you can: get live updates from our reporters as they cover legislators' latest moves; keep tabs on all of the bills you are following in one place; and look up a bill to find out why it is stuck — or sailing through. If you have questions, there's <a href="https://mountainstatespotlight.org">a guide</a> to the tracker, or <a href="mailto:lucasmanfield@mountainstatespotlight.org">reach out</a>. We'd love to know what's working and what's not.</p>
        </div>
      </div>
      <div className="App-timeline">
        <div className="App-timeline-line"></div>
        <div className="App-timeline-today" style={{
          left: ((moment().unix() - deadlines[0].date.unix()) / sessionLength * 100) + '%'
        }}>
          <div className="App-timeline-today-label">Today</div>
          <div className="App-timeline-today-arrow"></div>
        </div>
        {deadlines.map(d => {
          const fromStart = d.date.unix() - deadlines[0].date.unix()
          return (
            <div className="App-timeline-deadline" style={{
              left: (fromStart / sessionLength * 100) + '%'
            }} key={d.name}>
              <div className="App-timeline-hoverspot" />
              <div className="App-timeline-deadline-tooltip">{d.description}</div>
              <div className="App-timeline-deadline-tooltip-arrow"></div>
              <div className="App-timeline-deadline-label" style={{top: (15 + (d.padding || 0)) + 'px'}}><b>{d.date.format('MMM D')}</b> {d.name}</div>
            </div>
          )
        })}
      </div>
      <div className="App-search-container">
        <div className="App-search">
          <div className="App-section-header">
            <h2>Look up a bill or representative by name</h2>
          </div>
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={({ value }) => {
              let bills = scrapedData.bills.filter(bill => {
                return bill.title.toLowerCase().includes(value.toLowerCase()) || bill.name.toLowerCase().includes(value.toLowerCase())
              })
              bills.forEach(bill => bill.type = 'bill')
              let people = scrapedData.people.filter(p => {
                return p.name.toLowerCase().includes(value.toLowerCase())
              })
              people.forEach(p => p.type = 'person')
              setSuggestions(bills.slice(0, 5).concat(people.slice(0,5)))
            }}
            onSuggestionsClearRequested={() => setSuggestions([])}
            getSuggestionValue={suggestion => {
              if (suggestion.type == 'bill') {
                history.push('/bill/' + suggestion.name)
              } else {
                history.push('/person/' + suggestion.name)
              }
            }}
            renderSuggestion={renderSuggestion}
            inputProps={{
              placeholder: 'e.g. SB 101, Amy Summers',
              value: searchValue || '',
              onChange: (e) => {
                setSearchValue(e.target.value)
              }
            }}
          />
        </div>
        <div className="App-localrep">
          <div className="App-section-header">
            <h2>Look up your local representatives by address</h2>
          </div>
          <input 
            type="text"
            placeholder="1900 Kanawha Blvd E, Charleston WV"
            value={address || ''}
            className="react-autosuggest__input"
            onChange={(e) => {
              const address = e.target.value
              setAddress(address)
              if (timeout) {
                clearTimeout(timeout)
              }
              if (address && address.length) {
                setRepresentatives([])
                setRepresentativesError(null)
              } else {
                setRepresentatives(null)
              }
              timeout = setTimeout(() => {
                getRepresentatives(address)
              }, 500);
            }}
            onFocus={e => {
              if (e.target.value && e.target.value.length) {
                setRepresentatives([])
                getRepresentatives(e.target.value)
              }
            }}
            onBlur={e => {
              setTimeout(() => setRepresentatives(null), 100)
            }}
          />
          {representatives ? 
            <div className="App-representatives">
              {representatives.length ?
                representatives.map(rep => (
                  <PersonBox {...rep} key={rep.name} />
                ))
              : 
                <div className="App-representatives-spinner">
                {representativesError ?
                  <span>Address not found.</span> 
                  :
                    <CgSpinner />
                }
                </div>
              }
            </div>
          : ''}
        </div>
      </div>
      {followingBills.length ?
        <div className="App-section">
          <div className="App-section-header">
            <h2>
              Bills you are following
            </h2>
          </div>
          <div className="App-section-content">
            {followingBills.map(bill => (
              <BillBox {...bill} key={bill.name}/>
            ))}
          </div>
        </div>
      : ''}
      <div className="App-section">
        <div className="App-section-header">
          <h2>
            Bills we are following
          </h2>
        </div>
        <div className="App-section-content">
          {scrapedData.bills.filter(b => b.followingIdx != null).sort((a, b) => a.followingIdx - b.followingIdx).map(bill => (
            <BillBox {...bill} key={bill.name}/>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
