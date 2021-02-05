import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import { matchNameByLastName } from './utilities'

function Person({ scrapedData }) {
  const { name } = useParams();
  const [person, setPerson] = useState(null)
  const [bills, setBills] = useState([])

  useEffect(() => {
    scrapedData.people.forEach(p => {
      if (p.name == name) {
        setPerson(p)
      }
    })
    /*
    output.bills.forEach(b => {
      b.sponsors.forEach(s => {
        if (matchNameByLastName(name, s)) {
          setBills(oldBills => [...oldBills, b])
        }
      })
    })
    */
  });

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
      </div>
      <div className="Person-content">
      <div className="Person-bills-header">Sponsored</div>
        <div className="Person-bills">
          {bills.map(bill => (
            <Link key={bill.name} className="Person-bill" to={`/bill/${bill.name}`}>
              {bill.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Person;
