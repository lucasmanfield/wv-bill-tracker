import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import { matchNameByLastName } from './utilities'
import BillBox from './BillBox'
import { RiExternalLinkLine } from 'react-icons/ri';
import { MdPhone, MdEmail } from 'react-icons/md';

function Person({ scrapedData, loaded }) {
  const { name } = useParams();
  const [person, setPerson] = useState(null)
  const [bills, setBills] = useState(null)

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

  return (
    <div className="Person-container">
      <div className="Person-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{person.name}
      </div>
      <div className="Person-header">
        <div className="Person-header-details">
          <div className="Person-name">{person.name}</div>
          <div className="Person-office">
            {person.party == 'Democrat' ? 'Democratic' : person.party} {person.office} from District {person.district}</div>
          <div className="Person-contact">
            {person.email ? <a href={`mailto:${person.email}`}><MdEmail /> {person.email}</a> : ''}
            {person.phone ? <a href={`tel:${person.phone}`}><MdPhone/> {person.phone}</a> : ''}
          </div>
          <div className="Person-url">
            Source:&nbsp;&nbsp;<a href={person.url} target="_blank">West Virginia Legislature <RiExternalLinkLine /></a>
          </div>
        </div>
        <div className="Person-header-map">
          <a target="_blank" href={`http://www.wvlegislature.gov/districts/maps.cfm#${person.office.includes('Senator') ? 'S' : 'H'}D${person.district < 10 ? '0' : ''}${person.district}`}>
            <img src={`http://www.wvlegislature.gov/images/senate/districts/2010/${person.office.includes('Senator') ? 'S' : 'H'}D_${person.district < 10 ? '0' : ''}${person.district}.png`} />
          </a>
        </div>
      </div>
      <div className="Person-content">
        {bills ?
          <div>
            <div className="Person-bills-header"><h2>Sponsored</h2></div>
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
