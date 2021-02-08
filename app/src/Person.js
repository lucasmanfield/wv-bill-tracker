import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import { matchNameByLastName, roleToNumber } from './utilities'
import BillBox from './BillBox'
import { RiExternalLinkLine } from 'react-icons/ri';
import { MdPhone, MdEmail } from 'react-icons/md';
import { useHistory } from "react-router-dom";

function Person({ scrapedData, loaded }) {
  const { name } = useParams();
  const [person, setPerson] = useState(null)
  const [bills, setBills] = useState(null)

  const history = useHistory()

  useEffect(() => {
    scrapedData.people.forEach(p => {
      if (p.name === name) {
        setPerson(p)
      }
    })
    
    if (loaded) {
      const tempBills = []
      scrapedData.bills.forEach(b => {
        b.sponsors.forEach(s => {
          if (matchNameByLastName(name, s.name)) {
            tempBills.push(b)
          }
        })
      })
      const sortedBills = tempBills.sort((a,b) => b.last_update_parsed - a.last_update_parsed)
      setBills(sortedBills)
    }
  }, [scrapedData, name, loaded]);

  if (!person) {
    return <div />
  }

  console.log(person)

  return (
    <div className="Person-container">
      <div className="Person-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{person.name}
      </div>
      <div className="Person-header">
        <img src={person.photo}/>
        <div className="Person-header-details">
          <div className="Person-name">{person.name} ({person.party[0]} - {person.district_name})</div>
          <div className="Person-office">{person.office.replace("WV ", '')}, District {person.district}</div>
          {person.positions.length ? 
            <div className="Person-positions">
              {person.positions.map(position => (
                <div className="Person-position">{position}</div>
              ))}
            </div>
          : ''}
          <div className="Person-contact">
            {person.email ? <a href={`mailto:${person.email}`}><MdEmail /> {person.email}</a> : ''}
            {person.phone ? <a href={`tel:${person.phone}`}><MdPhone/> {person.phone}</a> : ''}
          </div>
          <div className="Person-url">
            Source:&nbsp;&nbsp;<a href={person.url} target="_blank">West Virginia Legislature <RiExternalLinkLine /></a>
          </div>
        </div>
      </div>
      <div className="Person-content">
        {(person.committees || []).length ?
          <div>
            <div className="Person-section-header">Committees</div>
            <div className="Person-committees-container">
              <div className="Person-committees">
                {person.committees.sort((a,b) => roleToNumber(b.role) - roleToNumber(a.role)).map(committee => (
                  <div className="Person-committee" key={committee.name} onClick={() => history.push(`/committee/${person.chamber}/${committee.name}`)}>
                    <div className="Person-committee-name">{committee.name}</div>
                    <div className="Person-committee-role">{committee.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        : ''}
        {bills ?
          <div>
            <div className="Person-section-header">Sponsored Bills</div>
            <div className="Person-bills">
              {bills.map(bill => (
                <BillBox {...bill} key={bill.name} />
              ))}
            </div>
          </div>
        : ''}
      </div>
    </div>
  );
}

export default Person;
