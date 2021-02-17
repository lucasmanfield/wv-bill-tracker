import React, { useState, useEffect, useLayoutEffect } from 'react';
import { getPersonByLastName, capitalize, styleForTag, currencyFormat } from './utilities'
import { useCookies } from 'react-cookie'
import {
  useParams,
  Link,
} from "react-router-dom";
import { BsStarFill, BsStar, BsFileText } from 'react-icons/bs';
import { FaRegClipboard } from 'react-icons/fa'
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

  const statusBox = (
    <div className='Bill-statusbar-status'>
      <div className='Bill-statusbar-status-name'>{bill.status.step == 'committee' ? `In committee` : capitalize(bill.status.step)}</div>
      <div className='Bill-statusbar-status-date'>{bill.status.step == 'committee' ? 'Since' : ''} {bill.last_update_parsed.format('MMM D')}</div>
    </div>
  )

  return (
    <div className="Bill-container">
      <div className='Bill-nav'>
        <div className="Bill-breadcrumbs">
          <Link to="/">Search</Link><b>&nbsp;&nbsp;»&nbsp;&nbsp;{name}</b>
        </div>
        <div className="Bill-buttons">
          {bill.agendas.length ?
            <a onClick={e => e.stopPropagation()} href={bill.agendas[0].url} target="_blank"><FaRegClipboard /> View Agenda</a>
          : ''}
          <a target="_blank" href={bill.bill_text}><BsFileText /> Read Text</a>
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
          {bill.step < 2 ? statusBox : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 1 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 2 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step >= 2 && bill.step < 5 ? statusBox : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 2 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 5 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          {bill.step == 5 ? statusBox: ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 5 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 5 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 6 ? statusBox: ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 6 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 7 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step > 6 && bill.step < 10 ? statusBox : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 7 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 10 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          {bill.step == 10 ? statusBox : ''}
          <div className={`Bill-statusbar-dot ${bill.step >= 10 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step >= 11 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step >= 11 ? statusBox : ''}
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
                {bill.subjects.map((subject, idx) => (
                  <span>
                    <Link key={subject} to={`/subject/${subject}`}>{subject}</Link>
                    {idx < bill.subjects.length - 1 ? ', ' : ''}  
                  </span>
                ))}
              </div>
            </div>
          : ''}
          {bill.fiscal_note && 'annual_cost' in bill.fiscal_note ? 
            <div className="Bill-detail-item">
              <div className="Bill-detail-item-header">Projected Fiscal Impact</div>
              <div className="Bill-detail-item-content">
                {currencyFormat(bill.fiscal_note.annual_revenue - bill.fiscal_note.annual_cost)} per year
                <div className="Bill-fiscal-note">
                  Source: &nbsp;&nbsp;<a href={bill.fiscal_note.url} target="_blank">{bill.fiscal_note.agency} <RiExternalLinkLine /></a>
                </div>
              </div>
            </div>
          : ''}
        </div>
        {bill.amendments.length ?
          <div>
            <div className="Bill-section-header">Amendments</div>
            <div className="Bill-section Bill-amendments">
              {bill.amendments.map(amendment => {
                return (
                  <a className="Bill-amendment" href={amendment.url} target="_blank">
                    <div className="Bill-amendment-sponsors">
                      {amendment.sponsors.map(s => capitalize(s)).join(', ')}
                    </div>
                    <div className="Bill-amendment-status">
                    {capitalize(amendment.type.substring(0,1)) == 'H' ? 'House' : 'Senate'}, {capitalize(amendment.status)}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        : ''}
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
                  {dispatch.tag && dispatch.tag.length ?
                    <div className="Bill-dispatch-tags">
                      <div key={dispatch.tag} className="Tag" style={styleForTag(dispatch.tag)}>{dispatch.tag}</div>
                    </div>
                  : ''}
                  <span className="Bill-dispatch-header-date">{capitalize(moment(dispatch.date).format('MMM D, h:mm a'))}</span> — {dispatch.reporter}
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
