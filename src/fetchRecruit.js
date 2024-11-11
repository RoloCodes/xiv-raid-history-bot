import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import { savageZones, ultimateEncounters } from './tables.js'
import fetchSavage from './fetchSavage.js'
import fetchUltimate from './fetchUltimate.js'
import { getRegion, cap } from './utils.js'
import { getTrolled } from './trollExceptions'

const { FFLOGS_CLIENT_ID, FFLOGS_SECRET_ID } = process.env

async function fetchRecruit(charName, world) {
  try {
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
      return {
        discordMessage: `Invalid world name or world not yet supported`,
        error: true,
      }
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
      return {
        discordMessage: `Character not found or logs for this character are hidden`,
        error: true,
      }
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

    const capCharName = getTrolled(
      charName
        .split(' ')
        .map((word) => cap(word))
        .join(' ')
    )

    const lodestoneId = response.data.data.characterData.character.lodestoneID
    const fflogsURL = `https://www.fflogs.com/character/lodestone-id/${lodestoneId}`
    const tomestoneURL = `https://tomestone.gg/character/${lodestoneId}/${charName.replace(
      ' ',
      '-'
    )}`

    const discordMessage = `
      # ${capCharName} - ${cap(world)}

      ## __Savage__
      ${savageResponses.join('\n')}

      ## __Ultimates__
      ${ultimateResponses.join('\n')} 
    `.replace(/^ +/gm, '')

    return { discordMessage, lodestoneId, fflogsURL, tomestoneURL }
  } catch (error) {
    console.log(error)
    return { discordMessage: error, error: true }
  }
}

export default fetchRecruit
