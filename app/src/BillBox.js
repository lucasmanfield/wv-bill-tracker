import React from 'react';
import { useHistory } from "react-router-dom";
import { mapTagToColor } from './utilities'

function Bill({ name, title, status, notes, tags }) {
    const history = useHistory()
  
    return (
      <div className="App-bill" onClick={() => history.push(`/bill/${name}`)}>
        <div className="App-bill-name">{name}</div>
        <div className="App-bill-details">
          <div className="App-bill-title">{title}</div>
          {notes ? <div className="App-bill-notes">{notes}</div> : ''}
          {tags && tags.length ? <div className="App-bill-tag">
            {(tags || []).map(tag => (
              <div className="Tag" style={{background: mapTagToColor(tag)}}>{tag}</div>
            ))}
          </div> : ''}
        </div>
        <div className="App-bill-status">{status}</div>
      </div>
    )
  }

  export default Bill