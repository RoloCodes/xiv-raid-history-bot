import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import { savageZones, ultimateEncounters } from './tables.js'
import fetchSavage from './fetchSavage.js'
import fetchUltimate from './fetchUltimate.js'
import { getRegion, cap } from './utils.js'

const { FFLOGS_CLIENT_ID, FFLOGS_SECRET_ID } = process.env

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

    const lodestoneId = response.data.data.characterData.character.lodestoneID

    const discordMessage = `
      # ${capCharName} - ${cap(world)}

      Logs: <https://www.fflogs.com/character/lodestone-id/${lodestoneId}>
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

export default fetchRecruit
