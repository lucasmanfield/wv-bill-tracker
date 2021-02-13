import React, { useState, useEffect, useLayoutEffect } from 'react';
import { getPersonByLastName, capitalize, styleForTag, currencyFormat } from './utilities'
import { useCookies } from 'react-cookie'
import {
  useParams,
  Link,
} from "react-router-dom";
import { BsStarFill, BsStar, BsFileText } from 'react-icons/bs';
import { RiExternalLinkLine } from 'react-icons/ri';
import PersonBox from './PersonBox'
import moment from 'moment'
import { useHistory } from "react-router-dom";
import showdown from 'showdown'

var markdownConverter = new showdown.Converter()

function Bill({ scrapedData }) {
  const { name } = useParams();
  const [bill, setBill] = useState(null)
  const [cookies, setCookie, removeCookie] = useCookies(['following', 'address'])
  let laidOut = false

  const history = useHistory()

  useEffect(() => {
    scrapedData.bills.forEach(bill => {
      if (bill.name == name) {
        setBill(bill)
      }
    })
  }, []);

  useLayoutEffect(() => {
    if (!laidOut && bill) {
      if (window.twttr.widgets) {
        window.twttr.widgets.load()
      }
      laidOut = true
    }
  })

  if (!bill) {
    return <div />
  }

  const isFollowing = (cookies.following || '').split(',').includes(name)

  console.log(bill)

  return (
    <div className="Bill-container">
      <div className='Bill-nav'>
        <div className="Bill-breadcrumbs">
          <Link to="/">Search</Link><b>&nbsp;&nbsp;»&nbsp;&nbsp;{name}</b>
        </div>
        <div className="Bill-buttons">
          <a target="_blank" href={bill.bill_text}><BsFileText /> Bill Text</a>
          <button className={`Bill-follow ${isFollowing ? 'Bill-following' : ''}`} onClick={() => {
            if (isFollowing) {
              setCookie('following', (cookies.following || '').replace(`${name},`, ''))
            } else {
              setCookie('following', `${cookies.following || ''}${name},`)
            }
          }}>
            {isFollowing ? <BsStarFill /> : <BsStar />} {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
      <div className="Bill-header">
        <div className="Bill-title">{bill.title}</div>
        <div className="Bill-subjects">
          
          {(bill.tags || []).map(tag => (
            <div key={tag} className="Tag" style={styleForTag(tag)}>{tag}</div>
          ))}
        </div>
        <div className="Bill-url">
          Source:&nbsp;&nbsp;<a href={bill.url} target="_blank">West Virginia Legislature <RiExternalLinkLine /></a>
        </div>
      </div>
      <div className="Bill-statusbar">
        <div className="Bill-statusbar-group">
          <div className="Bill-statusbar-group-name">{bill.name.includes('HB') ? 'House' : 'Senate'}</div>
        </div>
        <div className="Bill-statusbar-group" style={{left: '42%'}}>
          <div className="Bill-statusbar-group-name">{bill.name.includes('HB') ? 'Senate' : 'House'}</div>
        </div>
        <div className="Bill-statusbar-group" style={{left: '80.5%', width: '14%'}}>
          <div className="Bill-statusbar-group-name">Governor</div>
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 0 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 1 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 1 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step >= 1 && bill.step < 5 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 2 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 5 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          {bill.step == 5 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 5 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 6 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 6 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 6 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 6 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step >= 6 && bill.step < 10 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 7 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 7 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          {bill.step == 10 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>Since {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 10 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 11 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step >= 11 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{capitalize(bill.status.step)}</div>
              <div className='Bill-statusbar-status-date'>On {bill.last_update_parsed.format('MMM D')}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step == 12 ? 'active' : ''}`} />
        </div>
      </div>
      <div className="Bill-content">
        <div className="Bill-details">
          {bill.status.committee && bill.status.committee.length ?
            <div className="Bill-detail-item">
              <div className="Bill-detail-item-header">Committee</div>
              <div className="Bill-detail-item-content">
                <a href={`/committee/${bill.status.chamber}/${bill.status.committee}`}>{capitalize(bill.status.chamber)} {bill.status.committee}</a>
              </div>
            </div>
          : ''}
          {bill.subjects.length ?
            <div className="Bill-detail-item">
              <div className="Bill-detail-item-header">Subject</div>
              <div className="Bill-detail-item-content">
                {bill.subjects.map((subject, idx) => (<Link key={subject} to={`/subject/${subject}`}>{subject}{idx < bill.subjects.length - 1 ? ', ' : ''}</Link>))}
              </div>
            </div>
          : ''}
          {bill.fiscal_note && 'annual_cost' in bill.fiscal_note ? 
            <div className="Bill-detail-item">
              <div className="Bill-detail-item-header">Projected Fiscal Impact</div>
              <div className="Bill-detail-item-content">
                {currencyFormat(bill.fiscal_note.annual_cost - bill.fiscal_note.annual_revenue)}
                <div className="Bill-fiscal-note">
                  Source: &nbsp;&nbsp;<a href={bill.fiscal_note.url} target="_blank">{bill.fiscal_note.agency} <RiExternalLinkLine /></a>
                </div>
              </div>
            </div>
          : ''}
        </div>
        
        <div className="Bill-section-header">Sponsors</div>
        <div className="Bill-section Bill-sponsors">
          <div className="Bill-sponsors-container" style={{width: bill.sponsors.length * 232 + 'px'}}>
            {bill.sponsors.map(sponsor => {
              const person = getPersonByLastName(scrapedData.people, sponsor.name)
              if (!person) {
                return <span className="Bill-sponsor" key={sponsor.name}>{sponsor.name}</span>
              }
    
              return (
                <PersonBox {...person} tag={sponsor.classification == 'primary' ? 'Lead Sponsor' : null} key={person.name}/>
              )
            })}
          </div>
        </div>
        {(bill.dispatches || []).length ?
        <div>
          <div className="Bill-section-header">Updates</div>
          <div className="Bill-dispatches Bill-section">
            {bill.dispatches.sort((a,b) => moment(b.date).unix() - moment(a.date).unix()).map(dispatch => (
              <div key={dispatch.date} className="Bill-dispatch">
                <div className="Bill-dispatch-header">
                  <span className="Bill-dispatch-header-date">{capitalize(moment(dispatch.date).format('MMM D, HH:mm a'))}</span> — {dispatch.reporter}
                  {dispatch.tag && dispatch.tag.length ?
                    <div className="Bill-dispatch-tags">
                      <div key={dispatch.tag} className="Tag" style={styleForTag(dispatch.tag)}>{dispatch.tag}</div>
                    </div>
                  : ''}
                </div>
                <div className="Bill-dispatch-content" dangerouslySetInnerHTML={{__html: markdownConverter.makeHtml(dispatch.content)}} />
              </div>
            ))}
          </div>
        </div>
        : ''}
      </div>
    </div>
  );
}

export default Bill;
