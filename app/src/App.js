import React, { useState, useEffect, } from 'react';
import Autosuggest from 'react-autosuggest';
import { useHistory } from "react-router-dom";
import { useCookies } from 'react-cookie'
import { deadlines, capitalize } from './utilities'
import BillBox from './BillBox'
import PersonBox from './PersonBox'
import moment from 'moment'
import { CgSpinner } from 'react-icons/cg'
import PlacesAutocomplete from 'react-places-autocomplete';

let addressTimeout;
let searchTimeout;
function App({ scrapedData }) {
  const [suggestions, setSuggestions] = useState(null)
  const [address, setAddress] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [lastModified, setLastModified] = useState(null)
  const [representatives, setRepresentatives] = useState(null)
  const [representativesError, setRepresentativesError] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [cookies, setCookie, removeCookie] = useCookies(['following', 'address', 'welcome'])


  useEffect(() => {
    fetch('https://capitoltracker.mountainstatespotlight.org/', {
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
          setRepresentativesError(data.error.message)
          setRepresentatives([])
          return
        }
        if (!data.divisions) {
          setRepresentativesError('No information found at this address')
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
          setRepresentativesError('No information found at this address')
          setRepresentatives([])
          return
        }
        setRepresentatives(newRepresentatives)
      })
  }

  const history = useHistory()
  
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
        <div className="byline">By <a href="https://mountainstatespotlight.org/author/lucasmanfield/">Lucas Manfield</a>, Mountain State Spotlight. {lastModified ? `Data updated ${lastModified.format('MMMM D, YYYY').replace('pm', 'p.m.').replace('am', 'a.m.')}.`: ''}</div>
        <div className="App-intro">
          <p>Keeping track of West Virginia's chaotic two months of lawmaking can be daunting. To help you decipher it, <a href="https://mountainstatespotlight.org">Mountain State Spotlight</a> is trying something new.</p>
          <p>Here, you can: get live updates from our reporters as they cover legislators' latest moves; keep tabs on all of the bills you are following in one place; and look up a bill to find out why it is stuck — or sailing through. If you have questions, there's <a href="https://mountainstatespotlight.org">a guide</a> to the tracker, or <a href="mailto:lucasmanfield@mountainstatespotlight.org">reach out</a>. We'd love to know what's working and what's not.</p>
        </div>
      </div>
      <div className="App-timeline">
        <div className="App-timeline-line"></div>
        <div className="App-timeline-today" style={{
          left: ((moment(moment().format('YYYY-MM-DD') + ' 00:01:00').unix() - deadlines[0].date.unix()) / sessionLength * 100) + '%'
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
            suggestions={suggestions || []}
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
            onSuggestionsClearRequested={() => {
              setSuggestions(null)
            }}
            onSuggestionSelected={(e, { suggestion }) => {
              if (suggestion.type == 'bill') {
                history.push('/bill/' + suggestion.name)
              } else {
                history.push('/person/' + suggestion.name)
              }
            }}
            highlightFirstSuggestion={true}
            getSuggestionValue={suggestion => suggestion}
            renderSuggestion={suggestion => (
                <div className="App-suggestion">
                  {suggestion.type == 'bill' ? (
                      <div className="App-suggestion-bill">
                        <b>{suggestion.name}</b> {suggestion.title || suggestion.party}
                      </div>
                    ) : (
                      <div className="App-suggestion-person">
                        {suggestion.name}
                      </div>
                    )
                  }
                  <div className="App-suggestion-view">View</div>
                </div>
              )
            }
            inputProps={{
              placeholder: 'e.g. SB 101, Amy Summers',
              value: searchValue || '',
              onBlur: (e) => {
                setSearchError(null)
              },
              onChange: (e) => {
                setSearchValue(e.target.value)

                if (searchTimeout) {
                  clearTimeout(searchTimeout)
                }
                if (!e.target.value || !e.target.value.length) {
                  setSearchError(null)
                } else {
                  setTimeout(() => {
                    if (searchValue.length && suggestions && !suggestions.length) {
                      setSearchError('No results found')
                    }
                  }, 500)
                }
              }
            }}
          />
          {searchError && !suggestions.length ? 
            <div className="App-search-error">
              {searchError}
            </div>
          : ''}
        </div>
        <div className="App-localrep">
          <div className="App-section-header">
            <h2>Look up your local representatives by address</h2>
          </div>
          <PlacesAutocomplete
            value={address}
            onChange={address => {
              setAddress(address)
              if (!address || !address.length) {
                setRepresentatives(null)
              }
            }}
            highlightFirstSuggestion={true}
            onSelect={address => {
              setAddress(address)
              setRepresentatives(null)
              getRepresentatives(address)
            }}
          >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
              <div className="react-autosuggest__container">
                <input
                  {...getInputProps({
                    placeholder: '123 Main St, St Albans',
                    className: 'react-autosuggest__input',
                  })}
                />
                {suggestions && suggestions.length ?
                <div className="react-autosuggest__suggestions-container react-autosuggest__suggestions-container--open ">
                  <ul className="react-autosuggest__suggestions-list">
                    {suggestions.map(suggestion => {
                      const className = suggestion.active
                        ? 'react-autosuggest__suggestion react-autosuggest__suggestion--highlighted'
                        : 'react-autosuggest__suggestion';

                      return (
                        <li
                          {...getSuggestionItemProps(suggestion, { className })}
                        >
                          {suggestion.description}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                : ''}
              </div>
            )}
          </PlacesAutocomplete>

          {representatives ? 
            <div className="App-representatives">
              {representatives.length ?
                representatives.map(rep => (
                  <PersonBox {...rep} key={rep.name} />
                ))
              : 
                <div className="App-representatives-spinner">
                {representativesError ?
                    <span className="App-representatives-error">{representativesError}</span> 
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
