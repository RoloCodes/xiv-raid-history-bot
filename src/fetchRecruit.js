const axios = require('axios')
require('dotenv').config()
const { FFLOGS_CLIENT_ID, FFLOGS_SECRET_ID } = process.env
const { savageZones, ultimateEncounters } = require('./tables.js')
const fetchSavage = require('./fetchSavage.js')
const fetchUltimate = require('./fetchUltimate.js')
const { getRegion, cap } = require('./utils.js')

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

    const savageRequests = Promise.all(
      savageZones.map((zone) =>
        fetchSavage(charName, world, zone.id, authToken)
      )
    )
    const ultimateRequests = Promise.all(
      ultimateEncounters.map((encounter) =>
        fetchUltimate(charName, world, encounter.name, authToken)
      )
    )

    const [savageResponses, ultimateResponses] = await Promise.all([
      savageRequests,
      ultimateRequests,
    ])

    const capCharName = charName
      .split(' ')
      .map((word) => cap(word))
      .join(' ')

    const discordMessage = `
      # ${capCharName} - ${cap(world)}

      Logs: <https://www.fflogs.com/character/id/${lodestoneId}>
      Tomestone: https://tomestone.gg/character/${lodestoneId}/${charName.replace(
      ' ',
      '-'
    )}

      ## __Savage__
      ${savageResponses.join('\n')}

      ## __Ultimates__
      ${ultimateResponses.join('\n')} 
    `.replace(/^ +/gm, '')

    return discordMessage
  } catch (error) {
    console.log(error)
  }
}

module.exports = fetchRecruit
