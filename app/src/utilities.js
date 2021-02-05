import { isValidElement } from "react"

export function matchNameByLastName(name, lastname) {
  const names = name.split(' ')
  if (names[1] == lastname) {
    return true
  }

  if (names.length > 2 && names[2] == lastname) {
    return true
  }
  return false
}

export function getPersonByLastName(people, lastname) {
  let output = null
  people.forEach(person => {
    if (matchNameByLastName(person.name, lastname)) {
      output = person
    }
  })
  return output
}

export function mapTagToColor(tag) {
  if (tag == 'Sponsored by leadership') {
    return 'lightblue';
  }
  if (tag == 'Too many committees') {
    return 'pink'
  }
}

export function updateBillStatus(bill) {
  bill.committees = []
  bill.actions.forEach(action => {
    bill.last_update = action.date
    if (action['classification'] == 'filing') {
      bill.step = 0;
      bill.status = 'Filed'
    }
    bill.current_chamber = action.organization_id ? (action.organization_id.includes('lower') ? 'house' : 'senate') : null
    if (action['classification'] == 'introduced') {
      bill.step = bill.from_chamber == bill.current_chamber ? 1 : 6
      bill.status = 'Introduced'
    }
    if (action['classification'] == 'reading-1') {
      bill.step = bill.from_chamber == bill.current_chamber ? 2 : 7
      bill.status = 'On floor'
    }
    if (action['classification'] == 'reading-2') {
      bill.step = bill.from_chamber == bill.current_chamber ? 3 : 8
      bill.status = 'On floor'
    }
    if (action['classification'] == 'reading-3') {
      bill.step = bill.from_chamber == bill.current_chamber ? 4 : 9
      bill.status = 'On floor'
    }
    if (action['classification'] == 'passage') {
      bill.step = bill.from_chamber == bill.current_chamber ? 5 : 10
      bill.status = 'On floor'
    }
    if (action['classification'] == 'referral-committee') {
      bill.committees.push({
        name: action['description'].replace('To ', ''),
        chamber: action.organization_id ? (action.organization_id.includes('lower') ? 'house' : 'senate') : null
      })
    }
    if (action['classification'] == 'executive-receipt') {
      bill.current_chamber = null
      bill.step = 11
      bill.status = 'Awaiting signature'
    }
    if (action['classification'] == 'executive-signature') {
      bill.current_chamber = null
      bill.step = 12
      bill.status = 'Signed'
    }
  })
}