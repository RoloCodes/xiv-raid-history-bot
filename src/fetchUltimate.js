const axios = require('axios')
const { ultimateEncounters } = require('./tables.js')
const {
  getRegion,
  emojiFromJob,
  colorCheck,
  getEarliestClear,
  timeDiffInWeeks,
} = require('./utils.js')

async function fetchUltimate(charName, world, encounterName, authToken) {
  const encounter = ultimateEncounters.find(
    (item) => item.name === encounterName
  )

  if (encounter == undefined) {
    console.log('invalid ultimate encounter name')
    return 'Invalid Ultimate encounter error occurred'
  }

  const region = getRegion(world)
  if (region == 'other') {
    console.log('Invalid world name or world not yet supported')
    return 'Invalid world name or world not yet supported'
  }

  const queries = encounter.ids.map(
    (id) => `
      query CharacterData {
          characterData {
              character(name: "${charName}", serverSlug: "${world}", serverRegion: "${region}") {
                  encounterRankings(encounterID: ${id})
              }
          }
      }
    `
  )

  try {
    const responses = await Promise.all(
      queries.map((query) =>
        axios.post(
          `https://www.fflogs.com/api/v2/client`,
          JSON.stringify({
            query,
          }),
          {
            headers: {
              Authorization: `Bearer ${authToken.data.access_token}`,
              'Content-type': 'application/json',
            },
          }
        )
      )
    )

    const kills = responses.reduce(
      (acc, response) =>
        acc +
        response.data.data.characterData.character.encounterRankings.totalKills,
      0
    )

    if (kills < 1) {
      return `**${encounter.name}:** :x:`
    }

    const ranks = responses.reduce(
      (acc, response) => [
        ...acc,
        ...response.data.data.characterData.character.encounterRankings.ranks,
      ],
      []
    )

    const earliestClear = getEarliestClear(ranks)
    const weeks = timeDiffInWeeks(encounter.release, earliestClear)

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
    return `**${
      encounter.name
    }:** :thumbsup: ${color} - ${kills} total clears - cleared :stopwatch: **Week ${weeks}** ${emojiFromJob(
      bestSpec
    )}`
  } catch (error) {
    console.error(error)
  }
}

module.exports = fetchUltimate
