import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";

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
  });

  return (
    <div className="Subject-container">
      <div className="Subject-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{name}
      </div>
      <div className="Subject-header">
        <div className="Subject-name">{name}</div>
      </div>
      <div className="Subject-content">
      <div className="Subject-bills-header">Bills</div>
        <div className="Subject-bills">
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

export default Subject;
