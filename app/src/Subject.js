import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import BillBox from './BillBox'

function Subject({ scrapedData }) {
  const { name } = useParams();
  const [bills, setBills] = useState([])

  useEffect(() => {
    scrapedData.bills.forEach(b => {
      b.subjects.forEach(s => {
        if (s == name) {
          setBills(oldBills => [...oldBills, b])
        }
      })
    })
  }, []);

  return (
    <div className="Subject-container">
      <div className="Subject-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{name}
      </div>
      <div className="Subject-content">
      <div className="Subject-bills-header"><h2>Related Bills</h2></div>
        {bills.map(bill => (
          <BillBox {...bill} key={bill.name} />
        ))}
      </div>
    </div>
  );
}

export default Subject;
