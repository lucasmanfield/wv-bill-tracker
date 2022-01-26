import React, { useState, useEffect, } from 'react';
import Autosuggest from 'react-autosuggest';
import { useHistory } from "react-router-dom";
import { useCookies } from 'react-cookie'
import { deadlines, capitalize, getPersonByLastName } from './utilities'
import BillBox from './BillBox'
import PersonBox from './PersonBox'
import moment from 'moment'
import { CgSpinner } from 'react-icons/cg'
import PlacesAutocomplete from 'react-places-autocomplete';

let addressTimeout;
let searchTimeout;
function App({ scrapedData }) {
  const [suggestions, setSuggestions] = useState(null)
  const [address, setAddress] = useState(null)
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
    fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(address) + '.json?country=US&limit=1&access_token=pk.eyJ1IjoibG1hbjgxNyIsImEiOiJjajEzemlybW4wMDJ5MndwaWVlM3QwbG1kIn0.XdGKlKDd6e7bCPxwy-Pteg')
      .then(response => response.json())
      .then(data => {
        const coordinates = data['features'][0]['center']
        fetch('https://v3.openstates.org/people.geo?lat=' + coordinates[1] + '&lng=' + coordinates[0] + '&apikey=b41b45ec-6183-436a-8b37-cfe02bc5911f')
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              setRepresentativesError(data.error.message)
              setRepresentatives([])
              return
            }
            const legislators =  data.results
            if (!legislators || !legislators.length) {
              setRepresentativesError('No information found at this address')
              setRepresentatives([])
              return
            }
            setRepresentativesError(null)
            const newRepresentatives = []
            legislators.forEach(legislator => {
              const chamber = legislator.current_role.org_classification == 'upper' ? 'Senate' : 'House'
              const person = scrapedData.people.find(p => p.chamber == chamber && p.name == legislator.name)
              if (person) {
                newRepresentatives.push(person)
              } else {
                console.log("Could not find", legislator.name)
              }
            })
            if (!newRepresentatives.length) {
              setRepresentativesError('No information found at this address')
              setRepresentatives([])
              return
            }
            setRepresentatives(newRepresentatives)
          })

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
        <h1>West Virginia's 2022 Capitol Tracker</h1>
        <div className="byline">By <a href="https://mountainstatespotlight.org/author/lucasmanfield/">Lucas Manfield</a>, Mountain State Spotlight. {lastModified ? `Data updated ${lastModified.format('MMMM D, YYYY').replace('pm', 'p.m.').replace('am', 'a.m.')}.`: ''}</div>
        <div className="App-intro">
          <p>Keeping track of West Virginia's chaotic two months of lawmaking can be daunting. For the second year in a row, our nonprofit newsroom at <a href="https://mountainstatespotlight.org">Mountain State Spotlight</a> will help you decipher what's going on.</p>
          <p>Here, you can: get live updates from our reporters as they cover legislators' latest moves; contact your elected representatives; keep tabs on all of the bills you’re following in one place; and look up a bill to find out why it is stuck — or sailing through. The current status of each bill is updated nightly from the legislature's <a href="http://www.wvlegislature.gov/">official website</a>.</p>
          <p>If you have questions, check out <a href="https://mountainstatespotlight.org/2021/02/14/introducing-mountain-state-spotlights-west-virginia-capitol-tracker/">our guide to the tracker here</a>, or <a href="mailto:contact@mountainstatespotlight.org">reach out</a>. We'd love to know what's working and what's not. And if you want to better understand how the West Virginia Legislature works, sign up for <a href="https://mountainstatespotlight.org/power-and-possums/">Power and Possums</a>, our short email newsletter course.</p>
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
              }).sort((a,b) => {
                if (a.name == value) {
                  return -1;
                }
                if (a.name.split(' ')[1] == value) {
                  return -1
                }
                return 1
              })
              bills.forEach(bill => bill.type = 'bill')
              let people = scrapedData.people.filter(p => {
                return p.name.toLowerCase().includes(value.toLowerCase())
              })
              people.forEach(p => p.type = 'person')
              setSuggestions(bills.slice(0, 8).concat(people.slice(0,6)))
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
            value={address || ''}
            onChange={address => {
              setAddress(address)
              if (!address || !address.length) {
                setRepresentatives(null)
              }
            }}
            highlightFirstSuggestion={false}
            onSelect={address => {
              setAddress(address)
              setRepresentatives(null)
              getRepresentatives(address)
            }}
          >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
              <div className="react-autosuggest__container">
                <div className={`App-localrep-searchbutton ${!address || !address.length ? 'disabled' : ''}`} onClick={() => {
                  setAddress(address)
                  setRepresentatives(null)
                  getRepresentatives(address)
                }}>Search</div>
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
                          key={suggestion.description}
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
