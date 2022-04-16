const e = React.createElement;
const namespace = 'module-league-state'

const setStatus = (componentName, component) => {
  // Status
  if (component._available) {
    $(`#${componentName}-status`).html('<span class="green">Live</span>')
    $(`#${componentName}-available`).text(new Date(component._created).toLocaleString())
    $(`#${componentName}-update`).text(new Date(component._updated).toLocaleString())
  } else {
    $(`#${componentName}-status`).html('<span class="orange">Not Live</span>')
    if (component._deleted) {
      $(`#${componentName}-unavailable`).text(new Date(component._deleted).toLocaleString())
    }
  }
}

const updateUi = (state) => {
  console.log(state)

  // Flow
  setStatus('lcu-lobby', state.lcu.lobby)
  setStatus('lcu-champ-select', state.lcu.champselect)
  setStatus('lcu-end-of-game', state.lcu.eog)
  setStatus('web-live', state.web.live)
  setStatus('web-match', state.web.match)
  setStatus('web-timeline', state.web.timeline)
  /* setStatus('in-game-live', state.game.live) */

  /* $('#status').text(state.state);

  if (state.state === 'SET') {
    $('#gameinfo-container').css('display', 'block');
    $('#setgame-container').css('display', 'none');
  } else {
    $('#gameinfo-container').css('display', 'none');
    $('#setgame-container').css('display', 'block')
  }

  // oneWayBinding('gameinfo-container', state.webLive);
  ReactDOM.render(e(ParticipantTable, { participants: state.webLive.participants || [] }), document.getElementById('participant-table'));
  ReactDOM.render(e(BanTable, { bans: state.webLive.bannedChampions || [] }), document.getElementById('ban-table'));

  /* $('.data--game_id').text(state.webLive.gameId);
  $('.data--game_start').text(new Date(state.webLive.gameStartTime).toLocaleString());
  $('.data--game_platform').text(state.webLive.platformId); */
}

const formLoadByName = async () => {
  const name = $('#name').val();

  await LPTE.request({
    meta: {
      namespace,
      type: 'set-game',
      version: 1
    },
    by: 'summonerName',
    summonerName: name
  });

  await updateState();
}

const formLoadByGameId = async () => {
  const gameId = $('#gameid').val();

  await LPTE.request({
    meta: {
      namespace,
      type: 'set-game',
      version: 1
    },
    by: 'gameId',
    gameId
  });

  await updateState();
}

const formLoadMatchByLive = async () => {
  await LPTE.request({
    meta: {
      namespace,
      type: 'set-game',
      version: 1
    },
    by: 'gameId'
  });

  await updateState();
}

const formUnsetGame = async () => {
  await LPTE.request({
    meta: {
      namespace,
      type: 'unset-game',
      version: 1
    }
  });

  await updateState();
}

const updateState = async () => {
  const response = await LPTE.request({
    meta: {
      namespace,
      type: 'request',
      version: 1
    }
  });

  updateUi(response.state);
}

const getTeam = teamId => teamId === 100 ? 'blue' : 'red';

const getParticipantRow = participant => [
  participant.summonerName,
  getTeam(participant.teamId),
  participant.champion.name,
  participant.spell1Id,
  participant.spell2Id
];

const ParticipantTable = ({ participants }) => 
  e('table', { className: 'table' }, [
    e(
      'thead', {}, React.createElement(
        'tr', {}, ['Name', 'Team', 'Champion', 'Spell 1', 'Spell 2'].map(content => e('th', {}, content))
        )
    ),
    e('tbody', {},
      participants.map((participant, index) => [
        e('tr', {'data-toggle': 'collapse', 'data-target': `.participant${index}`},
          getParticipantRow(participant).map(td =>
            e('td', {}, td)
          )
        ),
        e('td', { colspan: 5, className: `collapse participant${index}` }, JSON.stringify(participant))
      ])
    )
  ]);

const getBanRow = ban => [
  ban.pickTurn,
  getTeam(ban.teamId),
  ban.championId
]

const BanTable = ({ bans }) => 
  e('table', { className: 'table' }, [
    e(
      'thead', {}, React.createElement(
        'tr', {}, ['Turn', 'Team', 'Champion'].map(content => e('th', {}, content))
        )
    ),
    e('tbody', {},
      bans.map((ban, index) =>
        e('tr', {'data-toggle': 'collapse', 'data-target': `.ban${index}`},
          getBanRow(ban).map(td =>
            e('td', {}, td)
          )
        )
      )
    )
  ]);

const start = async () => {
  setInterval(updateState, 5000)
  updateState()
}

window.LPTE.onready(start)
