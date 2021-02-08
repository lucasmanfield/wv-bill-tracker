import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import BillBox from './BillBox'
import { capitalize } from './utilities'

function Committee({ scrapedData }) {
  const { name, chamber } = useParams();

  const bills = scrapedData.bills.filter(b => b.committees.find(c => c.name == name && c.chamber == chamber)).sort((a,b) => a.step - b.step)

  return (
    <div className="Subject-container">
      <div className="Subject-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{capitalize(chamber)} Committee&nbsp;&nbsp;»&nbsp;&nbsp;{name}
      </div>
    <div className="Subject-content">
        {bills.map(bill => (
        <BillBox {...bill} key={bill.name} />
        ))}
      </div>
    </div>
  );
}

export default Committee;
