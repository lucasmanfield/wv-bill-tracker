
import React from 'react';
import { MdPhone, MdEmail } from 'react-icons/md';

function PersonBox({ name, email, phone, party, district, office }) {
  return (
    <div className="PersonBox-representative" key={name}>
      <div className="PersonBox-representative-name"><a href={`/person/${encodeURIComponent(name)}`}>{party ? `${party[0]} - ` : ''}{name}</a></div>
      <div className="PersonBox-representative-office">{office == 'WV State Senator' ? 'Senator' : 'Delegate'}{district ? `, District ${district}` : ''}</div>
      <div className="PersonBox-contact-icons">
        {email ? <a href={`mailto:${email}`}><MdEmail /></a> : ''}
        {phone ? <a href={`tel:${phone}`}><MdPhone/></a> : ''}
      </div>
    </div>
  )
}

export default PersonBox