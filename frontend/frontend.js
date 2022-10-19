const setStatus = (componentName, component) => {
  // Status
  if (component._available) {
    document.querySelector(`#${componentName}-status`).innerHTML =
      '<span class="green">Live</span>'
    document.querySelector(`#${componentName}-available`).innerHTML = new Date(
      component._created
    ).toLocaleString()

    document.querySelector(`#${componentName}-update`).innerHTML = new Date(
      component._updated
    ).toLocaleString()
  } else {
    document.querySelector(`#${componentName}-status`).innerHTML =
      '<span class="orange">Not Live</span>'
    if (component._deleted) {
      document.querySelector(`#${componentName}-unavailable`).innerHTML =
        new Date(component._deleted).toLocaleString()
    }
  }
}

const updateUi = (state) => {
  // Flow
  setStatus('lcu-lobby', state.lcu.lobby)
  setStatus('lcu-champ-select', state.lcu.champselect)
  setStatus('lcu-end-of-game', state.lcu.eog)
  setStatus('web-live', state.web.live)
  setStatus('web-match', state.web.match)
  setStatus('web-timeline', state.web.timeline)

  if (state?.web?.live?.participants) {
    ParticipantTable(state.web.live.participants)
  }
  if (state?.web?.live?.bannedChampions) {
    BanTable(state.web.live.bannedChampions)
  }
}

const formLoadByName = async () => {
  const name = document.querySelector('#name').value

  await LPTE.request({
    meta: {
      namespace: 'module-league-state',
      type: 'set-game',
      version: 1
    },
    by: 'summonerName',
    summonerName: name
  })

  await updateState()
}

const formLoadByGameId = async () => {
  const gameId = document.querySelector('#gameid').value

  await LPTE.request({
    meta: {
      namespace: 'module-league-state',
      type: 'set-game',
      version: 1
    },
    by: 'gameId',
    gameId
  })

  await updateState()
}

const formLoadMatchByLive = async () => {
  await LPTE.request({
    meta: {
      namespace: 'module-league-state',
      type: 'set-game',
      version: 1
    },
    by: 'gameId'
  })

  await updateState()
}

const formUnsetGame = async () => {
  await LPTE.request({
    meta: {
      namespace: 'module-league-state',
      type: 'unset-game',
      version: 1
    }
  })

  await updateState()
}

const updateState = async () => {
  const response = await LPTE.request({
    meta: {
      namespace: 'module-league-state',
      type: 'request',
      version: 1
    }
  })

  updateUi(response.state)
}

const getTeam = (teamId) => (teamId === 100 ? 'blue' : 'red')

const ParticipantTable = ({ participants }) => {
  const tbl = document.createElement('table')
  tbl.classList.add('table')

  const tblH = document.createElement('thead')
  const tblHRow = tblH
    .insertRow()

    [('Name', 'Team', 'Champion', 'Spell 1', 'Spell 2')].forEach((element) => {
      const th = tblHRow.insertCell()
      th.innerText = element
    })

  tbl.appendChild(tblH)

  const tblB = document.createElement('tbody')

  participants.forEach((participant) => {
    const tr = tblB.insertRow()
    tr.insertCell().innerText = participant.summonerName
    tr.insertCell().innerText = getTeam(participant.teamId)
    tr.insertCell().innerText = participant.champion.name
    tr.insertCell().innerText = participant.spell1Id
    tr.insertCell().innerText = participant.spell2Id
  })

  tbl.appendChild(tblB)

  document.querySelector('#participant-table').innerHTML = ''
  document.querySelector('#participant-table').appendChild(tbl)
}

const BanTable = ({ bans }) => {
  const tbl = document.createElement('table')
  tbl.classList.add('table')

  const tblH = document.createElement('thead')
  const tblHRow = tblH
    .insertRow()

    [('Turn', 'Team', 'Champion')].forEach((element) => {
      const th = tblHRow.insertCell()
      th.innerText = element
    })

  tbl.appendChild(tblH)

  const tblB = document.createElement('tbody')

  bans.forEach((ban) => {
    const tr = tblB.insertRow()
    tr.insertCell().innerText = ban.pickTurn
    tr.insertCell().innerText = getTeam(ban.teamId)
    tr.insertCell().innerText = ban.championId
  })

  tbl.appendChild(tblB)

  document.querySelector('#ban-table').innerHTML = ''
  document.querySelector('#ban-table').appendChild(tbl)
}

const start = async () => {
  setInterval(updateState, 5000)
  updateState()
}

window.LPTE.onready(start)
