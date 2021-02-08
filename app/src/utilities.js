import moment from 'moment'

export function matchNameByLastName(name, lastname) {
  const names = name.split(' ')
  if (names[1] === lastname) {
    return true
  }

  if (names.length > 2 && names[2] === lastname) {
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
  if (tag === 'Sponsored by leadership') {
    return 'lightblue';
  }
  if (tag === 'Too many committees') {
    return 'pink'
  }
}

export function updateBillStatus(bill) {
  bill.committees = []
  bill.actions.forEach(action => {
    bill.last_update = action.date
    bill.last_update_parsed = moment(action.date)
    bill.current_chamber = action.chamber
    if (action['classification'] === 'filing') {
      bill.step = 0;
      bill.status = 'Filed'
    }
    if (action['classification'] === 'introduction') {
      bill.step = bill.from_chamber === bill.current_chamber ? 1 : 6
      bill.status = 'Introduced'
    }
    if (action['classification'] === 'reading-1') {
      bill.step = bill.from_chamber === bill.current_chamber ? 2 : 7
      bill.status = 'On floor'
      bill.committees.filter(c => c.chamber == bill.current_chamber).forEach(c => {
        c.status = 'Passed'
      })
    }
    if (action['classification'] === 'reading-2') {
      bill.step = bill.from_chamber === bill.current_chamber ? 3 : 8
      bill.status = 'On floor'
    }
    if (action['classification'] === 'reading-3') {
      bill.step = bill.from_chamber === bill.current_chamber ? 4 : 9
      bill.status = 'On floor'
    }
    if (action['classification'] === 'passage') {
      bill.step = bill.from_chamber === bill.current_chamber ? 5 : 10
      bill.status = 'Passed'
    }
    if (action['classification'] == 'referral-committee') {
      bill.status = 'In committee'
      if (!action.description.includes(' then ')) {
        const name = action.description.replace('To ', '').replace('House ', '').replace('Senate ', '')
        if (!(bill.committees || []).find(c => name == c.name.replace('House ', '').replace('Senate ', ''))) {
          bill.committees.push({
            name,
            chamber: action.chamber,
            status: 'Referred',
            date: action.date
          })
        }
      }
    }
    if (action['classification'] === 'executive-receipt') {
      bill.current_chamber = null
      bill.step = 11
      bill.status = 'Awaiting signature'
    }
    if (action['classification'] === 'executive-signature') {
      bill.current_chamber = null
      bill.step = 12
      bill.status = 'Signed'
    }
  })
}

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export const deadlines = [
  {
    date: moment('1/13/21'),
    name: 'Opening Day',
    description: "Legislators perform house-keeping and publish election results."
  },
  {
    date: moment('2/10/21'),
    name: 'First Day',
    prose: 'the first day of the session',
    description: "Bills can be introduced."
  },
  {
    date: moment('3/16/21'),
    name: 'House Deadline',
    prose: 'the last day to introduce bills in the house',
    description: "Last day to introduce bills in the House."
  },
  {
    date: moment('3/22/21'),
    name: 'Senate Deadline',
    prose: 'the last day to introduce bills in the senate',
    padding: 15,
    description: "Last day to introduce bills in the Senate."
  },
  {
    date: moment('3/28/21'),
    name: 'Committee Deadline',
    prose: 'the last day for bills to emerge from committee',
    padding: 30,
    description: "Bills due out of committee."
  },
  {
    date: moment('3/31/21'),
    name: 'Crossover Day',
    prose: 'the last day to consider bills on the floor',
    padding: 45,
    description: "Last day for a bill to pass in its chamber of origin."
  },
  {
    date: moment('4/10/21'),
    name: 'Final Day',
    prose: 'the last day of the session',
    description: "Deadline for passage is midnight on the sixtieth day of the session."
  }
]

export function roleToNumber(role) {
  if (role == 'Chair') {
    return 3;
  }
  if (role == 'Vice Chair') {
    return 2;
  }
  if (role == 'Member') {
    return 1;
  }
  return 0;
}