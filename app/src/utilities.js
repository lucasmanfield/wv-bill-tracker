import moment from 'moment'

export function matchNameByLastName(name, lastname) {


  let firstInitial = null
  let lastNameSplit0 = null
  const lastNames = lastname.split(' ')
  if (lastNames.length >= 2) {
    lastNameSplit0 = lastNames[0].replace(',','')
    firstInitial = lastNames[1][0]
  }
  const names = name.split(' ')

  if (firstInitial) {

    if (names[names.length - 1] === lastNameSplit0 && names[0][0] == firstInitial) {
      return true
    }
    return false
  }
  if (names.length > 2 && names[names.length - 2] === lastname) {
    return true
  }
  if (names[names.length - 1] === lastname) {
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

export function styleForTag(tag) {
  if (tag === 'Sponsored by leadership') {
    return {background: '#fff2ef'}
  }
  if (tag === 'Too many committees') {
    return {background: '#fff2ef'}
  }
  return {background: 'white', border: '1px solid black'}
}

export function updateBillStatus(bill) {
  bill.last_update_parsed = moment(bill.last_action_date)
  if (bill.status.step == 'signed') {
    bill.step = 12;
  } else if (bill.status.step.toLowerCase() == 'committee') {
    bill.step = 6
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 1
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 1
    }
  } else if (bill.status.step.toLowerCase() == '1st reading') {
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 2
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 7
    }
  } else if (bill.status.step.toLowerCase() == '2nd reading') {
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 3
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 8
    }
  } else if (bill.status.step.toLowerCase() == '3rd reading') {
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 4
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 9
    }
  }
}

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export const deadlines = [
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