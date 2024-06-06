const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

require('dotenv').config()
const { BOT_TOKEN, CLIENT_ID } = process.env

const commands = [
  {
    name: 'getplayer',
    description: 'Fetch raid history of player',
    options: [
      {
        name: 'firstname',
        description: 'First name of character',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'lastname',
        description: 'Last name of character',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'world',
        description: 'World name of character',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
]

const rest = new REST().setToken(BOT_TOKEN)

;(async function () {
  try {
    console.log(`Started loading ${commands.length} application (/) commands`)
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    })
    console.log(`Successfully loaded ${data.length} application (/) commands`)
  } catch (error) {
    console.error(error)
  }
})()
