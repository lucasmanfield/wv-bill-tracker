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

  const bills = scrapedData.bills.filter(b => b.status.committee == name && b.status.chamber == chamber)

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
              if (person.committees) {
                person.committees.forEach(committee => {
                  if (committee.name.replace('&', 'and').toLowerCase() == name.toLowerCase() && person.chamber.toLowerCase() == chamber.toLowerCase()) {
                    role = committee.role
                  }
                })
              }
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
          {bills.sort((a,b) => b.agendas.length - a.agendas.length).map(bill => (
            <BillBox {...bill} key={bill.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Committee;
