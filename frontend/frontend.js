const staticURL = '/serve/module-league-static'
let champions = []

const champImg = (id) => {
  if (!id) {
    return document.createElement('div')
  }

  const champ = champions.find((c) => {
    return c.key === id.toString()
  })

  if (champ === undefined) {
    return document.createElement('div')
  }

  const img = document.createElement('img')
  img.src = `${staticURL}/img/champion/tiles/${champ.id}_0.jpg`
  img.width = 25
  img.height = 25
  return img
}
const summonerIcon = (id) => {
  if (!id) {
    return document.createElement('div')
  }

  const img = document.createElement('img')
  img.src = id ? `${staticURL}/img/profileicon/${id}.png` : ''
  img.width = 25
  img.height = 25
  return img
}

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
  setStatus('in-game', state.live)

  if (state?.web?.live?.participants) {
    ParticipantTable(state.web.live.participants)
  } else if (state?.lcu?.lobby?.members) {
    ParticipantTable(state.lcu.lobby.members)
  }
  if (state?.web?.live?.bannedChampions) {
    BanTable(state.web.live.bannedChampions)
  } else if (state?.lcu?.champselect?.bans) {
    BanTable(state.lcu.champselect.bans)
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

function addNicknameField(nick, name) {
  const input = document.createElement('input')
  input.type = 'text'
  input.dataset.name = name
  input.value = nick
  input.placeholder = 'Nickname'

  input.addEventListener('change', (e) => {
    window.LPTE.emit({
      meta: {
        namespace: 'module-league-state',
        type: 'change-player-nick'
      },
      summonerName: e.target.dataset.name,
      nickname: e.target.value
    })
  })

  return input
}

const ParticipantTable = (participants) => {
  const blueTeam = participants.filter((p) => p.teamId === 100)
  const redTeam = participants.filter((p) => p.teamId === 200)

  document.querySelector('#participant-table').innerHTML = ''
  for (const team of [blueTeam, redTeam]) {
    const tbl = document.createElement('table')
    tbl.classList.add('table')

    const tblH = document.createElement('thead')
    const tblHRow = tblH.insertRow()

    ;['', '', 'Name', 'Nickname'].forEach((element) => {
      const th = tblHRow.insertCell()
      th.innerText = element
    })

    tbl.appendChild(tblH)

    const tblB = document.createElement('tbody')

    team.forEach((participant) => {
      const tr = tblB.insertRow()
      tr.insertCell().appendChild(summonerIcon(participant.summonerIconId))
      tr.insertCell().appendChild(champImg(participant.championId))
      tr.insertCell().innerText = participant.summonerName
      tr.insertCell().appendChild(
        addNicknameField(
          participant.nickname || participant.summonerName,
          participant.summonerName
        )
      )
    })

    tbl.appendChild(tblB)

    document.querySelector('#participant-table').appendChild(tbl)
    /* slist(tbl) */
  }
}

function slist(target) {
  target.classList.add('slist')
  const items = target.getElementsByTagName('li')
  let current = null

  for (const i of items) {
    i.draggable = true

    i.ondragstart = () => {
      current = i
      for (const it of items) {
        if (it !== current) {
          it.classList.add('hint')
        }
      }
    }

    i.ondragenter = () => {
      if (i !== current) {
        i.classList.add('active')
      }
    }

    i.ondragleave = () => {
      i.classList.remove('active')
    }

    i.ondragend = () => {
      for (const it of items) {
        it.classList.remove('hint')
        it.classList.remove('active')
      }
    }

    i.ondragover = (evt) => {
      evt.preventDefault()
    }

    i.ondrop = (evt) => {
      evt.preventDefault()

      if (i !== current) {
        let currentpos = 0
        let droppedpos = 0

        for (let it = 0; it < items.length; it++) {
          if (current === items[it]) {
            currentpos = it
          }
          if (i === items[it]) {
            droppedpos = it
          }
        }

        window.LPTE.emit({
          meta: {
            namespace: 'module-league-state',
            type: 'swap-player'
          },
          currentpos,
          droppedpos,
          team: parseInt(i.dataset.team)
        })

        if (currentpos < droppedpos) {
          i.parentNode.insertBefore(current, i.nextSibling)
        } else {
          i.parentNode.insertBefore(current, i)
        }
      }
    }
  }
}

const getTeam = (teamId) => (teamId === 100 ? 'blue' : 'red')
const BanTable = (bans) => {
  const tbl = document.createElement('table')
  tbl.classList.add('table')

  const tblH = document.createElement('thead')
  const tblHRow = tblH.insertRow()

  ;['Turn', 'Team', 'Champion'].forEach((element) => {
    const th = tblHRow.insertCell()
    th.innerText = element
  })

  tbl.appendChild(tblH)

  const tblB = document.createElement('tbody')

  if (Array.isArray(bans)) {
    bans.forEach((ban) => {
      const tr = tblB.insertRow()
      tr.insertCell().innerText = ban.pickTurn
      tr.insertCell().innerText = getTeam(ban.teamId)
      tr.insertCell().appendChild(champImg(ban))
    })
  } else {
    bans.myTeamBans.forEach((ban, i) => {
      const tr = tblB.insertRow()
      tr.insertCell().innerText = i
      tr.insertCell().innerText = getTeam(100)
      tr.insertCell().appendChild(champImg(ban))
    })
    bans.theirTeamBans.forEach((ban, i) => {
      const tr = tblB.insertRow()
      tr.insertCell().innerText = i
      tr.insertCell().innerText = getTeam(200)
      tr.insertCell().appendChild(champImg(ban))
    })
  }

  tbl.appendChild(tblB)

  document.querySelector('#ban-table').innerHTML = ''
  document.querySelector('#ban-table').appendChild(tbl)
}

const start = async () => {
  updateState()

  const constantsRes = await LPTE.request({
    meta: {
      namespace: 'module-league-static',
      type: 'request-constants',
      version: 1
    }
  })
  const constants = constantsRes.constants
  champions = constants.champions
}

window.LPTE.onready(start)
