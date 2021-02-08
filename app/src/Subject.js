import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from "react-router-dom";
import BillBox from './BillBox'

function Subject({ scrapedData }) {
  const { name } = useParams();

  return (
    <div className="Subject-container">
      <div className="Subject-breadcrumbs">
        <Link to="/">Search</Link>&nbsp;&nbsp;»&nbsp;&nbsp;{name}
      </div>
      <div className="Subject-content">
        {scrapedData.bills.filter(b => b.subjects.includes(name)).map(bill => (
          <BillBox {...bill} key={bill.name} />
        ))}
      </div>
    </div>
  );
}

export default Subject;
