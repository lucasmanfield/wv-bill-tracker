import moment from 'moment'

export function matchNameByLastName(name, lastname) {
  let lastName = lastname
  const n = lastName.indexOf('(')
  if (n != -1) {
    
    lastName = lastName.substring(0, n - 1)
  }
  
  let firstInitial = null
  let lastNameSplit0 = null
  const lastNames = lastName.split(' ')
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
  if (names.length > 2 && names[names.length - 2] === lastName) {
    return true
  }
  if (names[names.length - 1] === lastName) {
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
  if (tag === 'Major support') {
    return {background: '#9bffb1'}
  }
  return {background: 'white', border: '1px solid black'}
}

export function updateBillStatus(bill) {
  if (bill.status.last_action_date) {
    bill.last_update_parsed = moment(bill.status.last_action_date)
  }
  let canDie = false
  if (bill.status.step == 'signed') {
    bill.step = 12;
  } else if (bill.status.step == 'governor') {
    bill.step = 11;
  } else if (bill.status.step == 'vetoed') {
    bill.step = 12;
  } else if (bill.status.step == 'passed') {
    bill.step = 10;
  } else if (bill.status.step == 'failed') {
    bill.step = 10
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 5
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 5
    }
  } else if (bill.status.step.toLowerCase() == 'committee') {
    canDie = true
    bill.step = 6
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 1
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 1
    }
  } else if (bill.status.step.toLowerCase() == '1st reading') {
    canDie = true
    bill.step = 7
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 2
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 2
    }
  } else if (bill.status.step.toLowerCase() == '2nd reading') {
    canDie = true
    bill.step = 8
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 3
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 3
    }
  } else if (bill.status.step.toLowerCase() == '3rd reading') {
    canDie = true
    bill.step = 9
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.step = 4
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.step = 4
    }
  } else if (bill.status.step.includes('senate introduction')) {
    bill.step = 5
    bill.status.step = 'To Senate'
  } else if (bill.status.step.includes('house introduction')) {
    bill.step = 5
    bill.status.step = 'To House'
  }
  
  //UNCOMMENT THIS AFTER CROSSOVER DATE
  /*
  if (canDie && 
      !(
        bill.title.startsWith('Budget Bill') || 
        bill.title.startsWith('Supplemental appropriation') || 
        bill.title.startsWith('Supplementing') || 
        bill.title.startsWith('Making supplemental appropriation') ||
        bill.title.startsWith('Expiring funds to')
      )) {
    if (bill.name.includes('HB') && bill.status.chamber == 'house') {
      bill.status.step = 'likely dead'
    }
    if (bill.name.includes('SB') && bill.status.chamber == 'senate') {
      bill.status.step = 'likely dead'
    }
  }
  */
}

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export const deadlines = [
  {
    date: moment('1/12/22'),
    name: 'First Day',
    prose: 'the first day of the session',
    description: "Bills can be introduced."
  },
  {
    date: moment('2/15/22'),
    name: 'House Deadline',
    prose: 'the last day to introduce bills in the house',
    description: "Last day to introduce bills in the House."
  },
  {
    date: moment('2/21/22'),
    name: 'Senate Deadline',
    prose: 'the last day to introduce bills in the senate',
    padding: 15,
    description: "Last day to introduce bills in the Senate."
  },
  {
    date: moment('2/27/22'),
    name: 'Committee Deadline',
    prose: 'the last day for bills to emerge from committee',
    padding: 30,
    description: "Bills due out of committee."
  },
  {
    date: moment('3/2/22'),
    name: 'Crossover Day',
    prose: 'the last day to consider bills on the floor',
    padding: 45,
    description: "Last day for a bill to pass in its chamber of origin."
  },
  {
    date: moment('3/12/22'),
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

export function currencyFormat(num) {
  return '$' + num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}