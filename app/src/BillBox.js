import React from 'react';
import { useHistory, Link } from "react-router-dom";
import { styleForTag, capitalize } from './utilities'

function Bill({ name, title, status, notes, tags, step, agendas }) {
    const history = useHistory()

    let statusDescription = status.step
  
    return (
      <div className="BillBox" onClick={() => history.push(`/bill/${name}`)}>
        <div className="BillBox-name">
          <span>{name}</span>
          {agendas.length ?
            <a onClick={e => e.stopPropagation()} className="BillBox-agenda" href={agendas[0].url} target="_blank">{agendas[0].type == 'committee' ? 'On agenda' : 'On calendar'}</a>
          : ''}
        </div>
        <div className="BillBox-details">
          <div className="BillBox-title">{title}</div>
          {notes && notes.trim().length ? <div className="BillBox-notes">{notes}</div> : ''}
          {tags && tags.length ? <div className="BillBox-tags">
            {(tags || []).map(tag => (
              <div className="Tag" style={styleForTag(tag)}>{tag}</div>
            ))}
          </div> : ''}
        </div>
        <div className="BillBox-status">
          {capitalize(statusDescription)}
          <div className={`BillBox-statusbar ${status.step == 'likely dead' ? 'BillBox-dead': ''} ${status.step == 'failed' || status.step == 'vetoed' ? 'BillBox-failed': ''}`}>
            <div className="BillBox-statusbar-segment">
              <div className={`BillBox-statusbar-dot ${step >= 1 ? 'active' : ''}`} />
              <div className={`BillBox-statusbar-line ${step >= 5 && status.step != 'failed'  ? 'active' : ''}`} />
            </div>
            <div className="BillBox-statusbar-segment">
              <div className={`BillBox-statusbar-dot ${step >= 6 ? 'active' : ''}`} />
              <div className={`BillBox-statusbar-line ${step >= 11 && status.step != 'failed' ? 'active' : ''}`} />
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