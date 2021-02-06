import React from 'react';
import { useHistory } from "react-router-dom";
import { mapTagToColor } from './utilities'

function Bill({ name, title, status, notes, tags, step }) {
    const history = useHistory()
  
    return (
      <div className="BillBox" onClick={() => history.push(`/bill/${name}`)}>
        <div className="BillBox-name">{name}</div>
        <div className="BillBox-details">
          <div className="BillBox-title">{title}</div>
          {notes ? <div className="BillBox-notes">{notes}</div> : ''}
          {tags && tags.length ? <div className="BillBox-tag">
            {(tags || []).map(tag => (
              <div className="Tag" style={{background: mapTagToColor(tag)}}>{tag}</div>
            ))}
          </div> : ''}
        </div>
        <div className="BillBox-status">
          {status}
          <div className="BillBox-statusbar">
            <div className="BillBox-statusbar-segment">
              <div className={`BillBox-statusbar-dot ${step >= 1 ? 'active' : ''}`} />
              <div className={`BillBox-statusbar-line ${step >= 6 ? 'active' : ''}`} />
            </div>
            <div className="BillBox-statusbar-segment">
              <div className={`BillBox-statusbar-dot ${step >= 6 ? 'active' : ''}`} />
              <div className={`BillBox-statusbar-line ${step >= 11 ? 'active' : ''}`} />
            </div>
            <div className="BillBox-statusbar-segment" style={{flex: 0}}>
              <div className={`BillBox-statusbar-dot ${step == 12 ? 'active' : ''}`} />
            </div>
          </div>  
        </div>
      </div>
    )
  }

  export default Bill