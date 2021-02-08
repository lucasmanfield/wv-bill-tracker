import React, { useState, useEffect } from 'react';
import { BsPower } from 'react-icons/bs';
import {
  useParams,
  Link,
} from "react-router-dom";
import BillBox from './BillBox'
import Person from './Person';
import PersonBox from './PersonBox';
import { capitalize } from './utilities'

function Committee({ scrapedData, loaded }) {
  const { name, chamber } = useParams();
  const bills = scrapedData.bills.filter(b => b.committees.find(c => c.name == name && c.chamber == chamber)).sort((a,b) => a.step - b.step)

  return (
    <div className="Subject-container">
      <div className="Subject-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{capitalize(chamber)} Committee&nbsp;&nbsp;»&nbsp;&nbsp;{name}
      </div>
      <div className="Subject-content">
        {loaded ?
        <div>
          <div className="Subject-section-header">Leadership</div>
          <div className="Committee-leadership">
            {scrapedData.people.map(person => {
              let role = null
              person.committees.forEach(committee => {
                if (committee.name == name && person.chamber.toLowerCase() == chamber.toLowerCase()) {
                  role = committee.role
                }
              })
              if (role == 'Chair' || role == 'Vice Chair') {
                return <PersonBox {...person} tag={role} key={role}/>
              }

              return ''
            }).sort((a,b) => a.key == 'Chair' ? -1 : 1)}
          </div>
        </div>
        : ''}
        <div className="Subject-section-header">Bills</div>
        <div>
          {bills.map(bill => (
          <BillBox {...bill} key={bill.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Committee;
