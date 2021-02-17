import React from 'react';
import BillBox from './BillBox'
import { capitalize } from './utilities'
import moment from 'moment'
import { RiExternalLinkLine } from 'react-icons/ri';

const agendaItem = (scrapedData, {name, url, date, bills}) => (
  <div className="Agenda">
    <a href={url} target="_blank">
      <div className="Agenda-title">
        {name}
      </div>
      <div className="Agenda-date">
        {moment(date).format('MMMM D, YYYY')}
      </div>
      <div className="Agenda-url">
      Source:&nbsp;&nbsp;West Virginia Legislature <RiExternalLinkLine />
      </div>
    </a>
    {bills.length ?
      <div className="Agenda-bills">
        {bills.map(name => {
          let bill = null
          scrapedData.bills.forEach(b => {
            if (b.name == name) {
              bill = b
            }
          })
          if (!bill) {
            return
          }

          return (
            <BillBox {...bill} key={bill.name} />
          )
        })}
      </div>
    : ''}
  </div>
)

function Agenda({ scrapedData, loaded }) {
  return (
    <div className="Agenda-container">
      {
        scrapedData.agendas
          .filter(a => moment().diff(moment(a.date), 'hours') < 24)
          .map(agenda => agendaItem(scrapedData, agenda))
      }
    </div>
  );
}

export default Agenda;
