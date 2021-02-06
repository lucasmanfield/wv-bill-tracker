import React, { useState, useEffect, } from 'react';
import Autosuggest from 'react-autosuggest';
import { useHistory } from "react-router-dom";
import { useCookies } from 'react-cookie'

import BillBox from './BillBox'
import PersonBox from './PersonBox'

let timeout;



function App({ scrapedData }) {
  const [suggestions, setSuggestions] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [representatives, setRepresentatives] = useState([])
  const [representativesError, setRepresentativesError] = useState([])
  const [cookies, setCookie, removeCookie] = useCookies(['following', 'address'])
 

  const getRepresentatives = (address) => {
    fetch('https://www.googleapis.com/civicinfo/v2/representatives?key=AIzaSyA6pBuQbIQYtJYBarykcwYzxxmuWULqw4Q&roles=legislatorLowerBody&roles=legislatorUpperBody&roles=headOfGovernment&levels=administrativeArea1&address=' + encodeURIComponent(address))
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setRepresentativesError(data.error)
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
        setRepresentatives(newRepresentatives)
      })
  }

  useEffect(async () => {
    getRepresentatives(cookies.address)    
  }, []);

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

  return (
    <div className="App-container">
      <div className="App-header">
        <h1>W.Va's 2021 Legislative Session Tracker</h1>
        <div className="byline">By <a href="https://mountainstatespotlight.org/author/lucasmanfield/">Lucas Manfield</a>, Mountain State Spotlight. Updated Feb 1, 3:30 p.m.</div>
      </div>
      <div className="App-localrep">
        <div className="App-section-header">
          <h2>Enter your address to find your local representatives</h2>
        </div>
        <input 
          type="text"
          placeholder="1900 Kanawha Blvd E, Charleston WV"
          value={cookies.address || ''}
          className="react-autosuggest__input"
          onChange={(e) => {
            const address = e.target.value
            setCookie('address', address)
            if (timeout) {
              clearTimeout(timeout)
            }
            timeout = setTimeout(() => {
              getRepresentatives(address)
            }, 500);
          }}
        />
        {representatives.length ? 
        <div className="App-representatives">
          {representatives.map(rep => (
            <PersonBox {...rep} key={rep.name} />
          ))}
        </div>
        : ''}
      </div>
      <div className="App-search">
        <div className="App-section-header">
          <h2>Search for a specific bill or representative</h2>
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
