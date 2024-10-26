import axios from 'axios'
import { savageZones } from './tables.js'
import {
  getRegion,
  emojiFromJob,
  colorCheck,
  getEarliestClear,
  timeDiffInWeeks,
} from './utils.js'

async function fetchSavage(charName, world, zoneId, authToken) {
  const zone = savageZones.find((item) => item.id === zoneId)
  if (zone == undefined) {
    console.log('invalid savage zone')
    return 'Invalid Savage Zone name error occurred'
  }

  const region = getRegion(world)

  const graphqlQuery = `
    query CharacterData {
        characterData {
            character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                zoneRankings(zoneID: ${zone.id})
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
    const oldExpansion = ['Heavensward', 'Stormblood'].includes(zone.expansion)
    if (difficulty == 101 || oldExpansion) {
      for (const boss of rankings) {
        if (boss.totalKills > 0) {
          bossesKilled += 1
        }
      }
    }

    let weeks = -1
    if (bossesKilled >= zone.bosses) {
      const bossQuery = `
        query CharacterData {
            characterData {
                character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                    encounterRankings(encounterID: ${zone.finalBossId})
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
      weeks = timeDiffInWeeks(zone.release, earliestClear)
    }

    if (bossesKilled < 1) {
      return `**${zone.name.toUpperCase()}:** ${messages[bossesKilled]}`
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
    return `**${zone.name.toUpperCase()}:** ${color} - ${
      messages[bossesKilled == zone.bosses ? 5 : bossesKilled]
    } ${weeks != -1 ? `⏱️ **Week ${weeks}**` : ''} ${jobEmojis}`
  } catch (error) {
    console.error(error)
  }
}

export default fetchSavage
