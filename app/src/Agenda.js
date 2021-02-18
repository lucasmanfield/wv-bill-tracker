import React from 'react';
import BillBox from './BillBox'
import { capitalize } from './utilities'
import moment from 'moment'
import { RiExternalLinkLine } from 'react-icons/ri';

const agendaItem = (scrapedData, {name, url, date, bills}) => (
  <div className="Agenda">
    <div className="Agenda-header">
      <div>
        <div className="Agenda-title">
          {name}
        </div>
        <div className="Agenda-date">
          {moment(date).format('MMMM D, YYYY — h:mm a').replace('am', 'a.m.').replace('pm', 'p.m.')}
        </div>
      </div>
      <a className="Agenda-url" href={url} target="_blank"><RiExternalLinkLine /> View</a>
    </div>
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

function Agenda({ scrapedData, loaded, type }) {
  const agendas = scrapedData.agendas
    .filter(a => moment().diff(moment(a.date), 'hours') < 12)
    .filter(a => type.split(',').includes(a.type))
    .sort((a,b) => moment(a.date).unix() - moment(b.date).unix())
  console.log(agendas)
  if (!loaded) {
    return <div />
  }
  return (
    <div className="Agenda-container">
      {
        agendas.map(agenda => agendaItem(scrapedData, agenda))
      }
    </div>
  );
}

export default Agenda;
