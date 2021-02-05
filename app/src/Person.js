import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import { matchNameByLastName } from './utilities'
import BillBox from './BillBox'
import { RiExternalLinkLine } from 'react-icons/ri';
import { MdPhone, MdEmail } from 'react-icons/md';

function Person({ scrapedData }) {
  const { name } = useParams();
  const [person, setPerson] = useState(null)
  const [bills, setBills] = useState([])

  useEffect(() => {
    scrapedData.people.forEach(p => {
      if (p.name === name) {
        setPerson(p)
      }
    })
    
    const bills = []
    scrapedData.bills.forEach(b => {
      b.sponsors.forEach(s => {
        if (matchNameByLastName(name, s.name)) {
          bills.push(b)
          console.log("adding bill", b)
        }
      })
    })

    setBills(bills)
  }, [scrapedData, name]);

  if (!person) {
    return <div />
  }

  return (
    <div className="Person-container">
      <div className="Person-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{person.name}
      </div>
      <div className="Person-header">
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
      <div className="Person-content">
      <div className="Person-bills-header"><h2>Sponsored</h2></div>
        <div className="Person-bills">
          {bills.map(bill => (
            <BillBox {...bill} key={bill.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Person;
