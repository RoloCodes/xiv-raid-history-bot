const axios = require('axios')
require('dotenv').config()
const { FFLOGS_CLIENT_ID, FFLOGS_SECRET_ID } = process.env
const { worldsByRegion, jobMap } = require('./tables.js')

function getRegion(world) {
  if (worldsByRegion.na.includes(world.toLowerCase())) {
    return 'na'
  } else if (worldsByRegion.oce.includes(world.toLowerCase())) {
    return 'oce'
  } else if (worldsByRegion.eu.includes(world.toLowerCase())) {
    return 'eu'
  } else if (worldsByRegion.jp.includes(world.toLowerCase())) {
    return 'jp'
  } else {
    return 'other'
  }
}

async function fetchRecruitTier(charName, world, zone, authToken) {
  const zoneIds = {
    anabaseios: 54,
    abyssos: 49,
    asphodelos: 44,
  }

  const releaseEpochs = {
    anabaseios: 1685433600000, // Jan  4, 2022
    abyssos: 1661846400000, // Aug 30, 2022
    asphodelos: 1641283200000, // May 30, 2023
  }

  const finalBosses = {
    anabaseios: 92,
    abyssos: 87,
    asphodelos: 82,
  }

  const zoneId = zoneIds[zone] || -1
  if (zoneId == -1) {
    console.log('invalid zone')
  }

  const region = getRegion(world)
  if (region == 'other') {
    console.log('Invalid world name or world not yet supported')
    return 'Invalid world name or world not yet supported'
  }

  const graphqlQuery = `
    query CharacterData {
        characterData {
            character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                zoneRankings(zoneID: ${zoneId})
            }
        }
    }
  `

  try {
    const response = await axios.post(
      `https://www.fflogs.com/api/v2/client`,
      JSON.stringify({
        query: graphqlQuery,
      }),
      {
        headers: {
          Authorization: `Bearer ${authToken.data.access_token}`,
          'Content-type': 'application/json',
        },
      }
    )
    const rankings =
      response.data.data.characterData.character.zoneRankings.rankings
    const difficulty =
      response.data.data.characterData.character.zoneRankings.difficulty

    const messages = [
      ':x: Tier Skipped',
      ':x: Floor 1',
      ':x: Floor 2',
      ':x: Floor 3',
      ':x: Door Boss',
      ':thumbsup: Tier Cleared',
    ]

    let bossesKilled = 0
    if (difficulty == 101) {
      for (const boss of rankings) {
        if (boss.totalKills > 0) {
          bossesKilled += 1
        }
      }
    }

    let weeks = -1
    if (bossesKilled >= 5) {
      const bossId = finalBosses[zone]
      const bossQuery = `
        query CharacterData {
            characterData {
                character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                    encounterRankings(encounterID: ${bossId})
                }
            }
        }
      `
      const bossData = await axios.post(
        `https://www.fflogs.com/api/v2/client`,
        JSON.stringify({
          query: bossQuery,
        }),
        {
          headers: {
            Authorization: `Bearer ${authToken.data.access_token}`,
            'Content-type': 'application/json',
          },
        }
      )

      const ranks =
        bossData.data.data.characterData.character.encounterRankings.ranks

      const earliestClear = getEarliestClear(ranks)
      const tierRelease = releaseEpochs[zone]
      weeks = timeDiffInWeeks(tierRelease, earliestClear)
    }

    if (bossesKilled < 1) {
      return `**${zone[0].toUpperCase() + zone.slice(1)}:** - ${
        messages[bossesKilled]
      }`
    }

    const color = colorCheck(
      response.data.data.characterData.character.zoneRankings
        .bestPerformanceAverage
    )
    const allStars =
      response.data.data.characterData.character.zoneRankings.allStars
    let jobList = []
    for (const { spec } of allStars) {
      if (!jobList.includes(spec)) {
        jobList.push(spec)
      }
    }
    const jobEmojis = `${jobList[0] ? `${emojiFromJob(jobList[0])}` : ''} ${
      jobList[1] ? `${emojiFromJob(jobList[1])}` : ''
    } ${jobList[2] ? `${emojiFromJob(jobList[2])}` : ''}`
    return `**${zone[0].toUpperCase() + zone.slice(1)}:** ${color} - ${
      messages[bossesKilled]
    } ${weeks != -1 ? `⏱️ **Week ${weeks}**` : ''} ${jobEmojis}`
  } catch (error) {
    console.error(error)
  }
}

async function fetchRecruitUlti(charName, world, encounter, authToken) {
  const encounterIds = {
    TOP: 1068,
    DSR: 1065,
    TEA: 1062,
    UWU: 1061,
    UCOB: 1060,
    TEASHB: 1050,
    UWUSHB: 1048,
    UCOBSHB: 1047,
  }

  const encounterId = encounterIds[encounter] || -1
  if (encounterId == -1) {
    console.log('invalid zone')
    return
  }

  const region = getRegion(world)
  if (region == 'other') {
    console.log('Invalid world name or world not yet supported')
    return 'Invalid world name or world not yet supported'
  }

  const graphqlQuery = `
    query CharacterData {
        characterData {
            character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                encounterRankings(encounterID: ${encounterId})
            }
        }
    }
  `

  try {
    const response = await axios.post(
      `https://www.fflogs.com/api/v2/client`,
      JSON.stringify({
        query: graphqlQuery,
      }),
      {
        headers: {
          Authorization: `Bearer ${authToken.data.access_token}`,
          'Content-type': 'application/json',
        },
      }
    )

    const cleanEncounterName = encounter
      .replace('SHB', '')
      .replace('EW', '')
      .replace('StB', '')

    const kills =
      response.data.data.characterData.character.encounterRankings.totalKills
    if (kills < 1) {
      return `**${cleanEncounterName}:** :x:`
    }

    const ranks =
      response.data.data.characterData.character.encounterRankings.ranks
    let bestPerformance = 0
    let bestSpec = ''
    for (const rank of ranks) {
      const parse = rank.rankPercent
      if (parse > bestPerformance) {
        bestPerformance = parse
        bestSpec = rank.spec
      }
    }

    const color = colorCheck(bestPerformance)
    return `**${cleanEncounterName}:** :thumbsup: ${color} - ${kills} clears ${emojiFromJob(
      bestSpec
    )}`
  } catch (error) {
    console.error(error)
  }
}

async function fetchRecruit(charName, world) {
  const authToken = await axios.post(
    `https://www.fflogs.com/oauth/token`,
    { grant_type: 'client_credentials' },
    {
      auth: {
        username: FFLOGS_CLIENT_ID,
        password: FFLOGS_SECRET_ID,
      },
    }
  )

  const region = getRegion(world)
  if (region == 'other') {
    console.log('Player cannot play in NA or world name is incorrect')
    return `Player cannot play in NA or world name is incorrect`
  }

  const graphqlQuery = `
    query CharacterData {
        characterData {
            character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                id
                lodestoneID
            }
        }
    }
  `

  try {
    const response = await axios.post(
      `https://www.fflogs.com/api/v2/client`,
      JSON.stringify({
        query: graphqlQuery,
      }),
      {
        headers: {
          Authorization: `Bearer ${authToken.data.access_token}`,
          'Content-type': 'application/json',
        },
      }
    )

    if (response.data.data.characterData.character == null) {
      console.log('character not found')
      return `Character not found or logs for this character are hidden`
    }

    const lodestoneId = response.data.data.characterData.character.lodestoneID

    const req1 = fetchRecruitTier(charName, world, 'anabaseios', authToken)
    const req2 = fetchRecruitTier(charName, world, 'abyssos', authToken)
    const req3 = fetchRecruitTier(charName, world, 'asphodelos', authToken)
    const req4 = fetchRecruitUlti(charName, world, 'TOP', authToken)
    const req5 = fetchRecruitUlti(charName, world, 'DSR', authToken)
    const req6 = fetchRecruitUlti(charName, world, 'TEA', authToken)
    const req7 = fetchRecruitUlti(charName, world, 'UWU', authToken)
    const req8 = fetchRecruitUlti(charName, world, 'UCOB', authToken)
    const req9 = fetchRecruitUlti(charName, world, 'TEASHB', authToken)
    const req10 = fetchRecruitUlti(charName, world, 'UWUSHB', authToken)
    const req11 = fetchRecruitUlti(charName, world, 'UCOBSHB', authToken)

    const [
      anabaseios,
      abyssos,
      asphodelos,
      TOP,
      DSR,
      TEAEW,
      UWUEW,
      UCOBEW,
      TEASHB,
      UWUSHB,
      UCOBSHB,
    ] = await Promise.all([
      req1,
      req2,
      req3,
      req4,
      req5,
      req6,
      req7,
      req8,
      req9,
      req10,
      req11,
    ]) //
    const TEA = !TEAEW.includes(':x:') ? TEAEW : TEASHB
    const UWU = !UWUEW.includes(':x:') ? UWUEW : UWUSHB
    const UCOB = !UCOBEW.includes(':x:') ? UCOBEW : UCOBSHB

    const capCharName = charName
      .split(' ')
      .map((word) => cap(word))
      .join(' ')

    const discordMessage = `
      # ${capCharName} - ${cap(world)}

      Logs: <https://www.fflogs.com/character/${region}/${world}/${charName
      .replace(' ', '%20')
      .replace("'", '%27')}>
      Tomestone: https://tomestone.gg/character/${lodestoneId}/${charName.replace(
      ' ',
      '-'
    )}

      ## __Savage__
      ${anabaseios}
      ${abyssos}
      ${asphodelos}

      ## __Ultimates__
      ${TOP}
      ${DSR}
      ${TEA}
      ${UWU}
      ${UCOB}
    `.replace(/^ +/gm, '')

    console.log(discordMessage)
    return discordMessage
  } catch (error) {
    console.log(error)
  }
}

function colorCheck(n) {
  if (n == 100) {
    return '🟨 Gold'
  } else if (n >= 99) {
    return '🌸 Pink'
  } else if (n >= 95) {
    return '🟧 Orange'
  } else if (n >= 75) {
    return '🟪 Purple'
  } else if (n >= 50) {
    return '🟦 Blue'
  } else if (n >= 25) {
    return '🟩 Green'
  } else {
    return '⬜ Grey'
  }
}

function cap(s) {
  return s[0].toUpperCase() + s.slice(1)
}

function getEarliestClear(ranks) {
  let earliest = ranks[0].startTime + ranks[0].duration
  for (const rank of ranks) {
    const endTime = rank.startTime + rank.duration
    if (endTime < earliest) earliest = endTime
  }
  return earliest
}

function timeDiffInWeeks(first, second) {
  const msInWeek = 604800000
  return Math.ceil((second - first) / msInWeek)
}
function emojiFromJob(jobName) {
  return `<:${jobMap[jobName].abbrv}:${jobMap[jobName].emojiID}>`
}

module.exports = fetchRecruit
