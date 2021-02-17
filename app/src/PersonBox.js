
import React from 'react';
import { MdPhone, MdEmail } from 'react-icons/md';
import { useHistory } from "react-router-dom";

function PersonBox({ name, email, phone, party, district, chamber, tag }) {
  const history = useHistory()
  return (
    <div 
      className="PersonBox-representative" 
      key={name} 
      onClick={e => {
        history.push(`/person/${encodeURIComponent(name)}`)
      }} 
    >
      <div className="PersonBox-representative-name">{party ? `${party[0]} - ` : ''}{name}</div>
      <div className="PersonBox-representative-office">
        {chamber == 'Senate' ? 'Senator' : 'Delegate'}{district ? `, District ${district}` : ''}
      </div>
      {tag ? <div className="PersonBox-tag">{tag}</div> : ''} 
      <div className="PersonBox-contact-icons">
        {email ? <a href={`mailto:${email}`} onClick={e => e.stopPropagation()}><MdEmail /></a> : ''}
        {phone ? <a href={`tel:${phone}`} onClick={e => e.stopPropagation()}><MdPhone/></a> : ''}
      </div>
    </div>
  )
}

export default PersonBox