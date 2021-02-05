import React, { useState, useEffect } from 'react';
import { getPersonByLastName } from './utilities'
import { useCookies } from 'react-cookie'
import {
  useParams,
  Link,
} from "react-router-dom";
import { BsStarFill, BsStar } from 'react-icons/bs';
import PersonBox from './PersonBox'
import { mapTagToColor } from './utilities'
import moment from 'moment'

function Bill({ scrapedData }) {
  const { name } = useParams();
  const [bill, setBill] = useState(null)
  const [people, setPeople] = useState(null)
  const [cookies, setCookie, removeCookie] = useCookies(['following', 'address'])

  useEffect(() => {
    setPeople(scrapedData.people)
    scrapedData.bills.forEach(bill => {
      if (bill.name == name) {
        setBill(bill)
      }
    })
    setTimeout(() => window.twttr.widgets.load(), 0)
  });

  if (!bill) {
    return <div />
  }

  console.log(bill)

  const isFollowing = (cookies.following || '').split(',').includes(name)

  return (
    <div className="Bill-container">
      <div className="Bill-breadcrumbs">
        <Link to="/">Search</Link><b>&nbsp;&nbsp;»&nbsp;&nbsp;{name}</b>
      </div>
      <button className={`Bill-follow ${isFollowing ? 'Bill-following' : ''}`} onClick={() => {
        if (isFollowing) {
          setCookie('following', (cookies.following || '').replace(`${name},`, ''))
        } else {
          setCookie('following', `${cookies.following || ''}${name},`)
        }
      }}>
        {isFollowing ? <BsStarFill /> : <BsStar />} {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      <div className="Bill-header">
        <div className="Bill-title">{bill.title}</div>
        <div className="Bill-subjects">
          {bill.subjects.map(subject => (
            <Link key={subject} className="Bill-subject" to={`/subject/${subject}`}>{subject}</Link>
          ))}
          {(bill.tags || []).map(tag => (
            <div key={tag} className="Tag" style={{background: mapTagToColor(tag)}}>{tag}</div>
          ))}
        </div>
      </div>
      <div className="Bill-statusbar">
        <div className="Bill-statusbar-group">
          <div className="Bill-statusbar-group-name">{bill.from_chamber == 'house' ? 'House' : 'Senate'}</div>
        </div>
        <div className="Bill-statusbar-group" style={{left: '42%'}}>
          <div className="Bill-statusbar-group-name">{bill.from_chamber == 'house' ? 'Senate' : 'House'}</div>
        </div>
        <div className="Bill-statusbar-group" style={{left: '80.5%', width: '14%'}}>
          <div className="Bill-statusbar-group-name">Governor</div>
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 0 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{bill.status}</div>
              <div className='Bill-statusbar-status-date'>{bill.last_update}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step > 1 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 2 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 3 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{bill.status}</div>
              <div className='Bill-statusbar-status-date'>{bill.last_update}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step > 3 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 4 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          {bill.step == 4 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{bill.status}</div>
              <div className='Bill-statusbar-status-date'>{bill.last_update}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step > 4 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 5 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          <div className={`Bill-statusbar-dot ${bill.step > 5 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 6 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          <div className={`Bill-statusbar-dot ${bill.step > 7 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 8 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment Bill-statusbar-segment-long">
          <div className={`Bill-statusbar-dot ${bill.step > 8 ? 'active' : ''}`} />
          <div className={`Bill-statusbar-line ${bill.step > 9 ? 'active' : ''}`} />
        </div>
        <div className="Bill-statusbar-segment">
          {bill.step == 12 ?
            <div className='Bill-statusbar-status'>
              <div className='Bill-statusbar-status-name'>{bill.status}</div>
              <div className='Bill-statusbar-status-date'>{bill.last_update}</div>
            </div>
          : ''}
          <div className={`Bill-statusbar-dot ${bill.step > 10 ? 'active' : ''}`} />
        </div>
      </div>
      <div className="Bill-content">
        <div className="Bill-section-header">Sponsors</div>
        <div className="Bill-sponsors Bill-section">
          {bill.sponsors.map(sponsor => {
            const person = getPersonByLastName(people, sponsor.name)
            if (!person) {
              return <span className="Bill-sponsor" key={sponsor.name}>{sponsor.name}</span>
            }
            return (
              <PersonBox {...person} key={person.name}/>
            )
          })}
        </div>
        {(bill.dispatches || []).length ?
        <div>
          <div className="Bill-section-header">Updates</div>
          <div className="Bill-dispatches Bill-section">
            {bill.dispatches.map(dispatch => (
              <div key={dispatch.content} className="Bill-dispatch">
                <div className="Bill-dispatch-header">
                  <span className="Bill-dispatch-header-date">{moment(dispatch.date).fromNow()}</span> — {dispatch.reporter}
                </div>
                <div className="Bill-dispatch-content" dangerouslySetInnerHTML={{__html: dispatch.content}} />
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
