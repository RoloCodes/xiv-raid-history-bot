import { Client, IntentsBitField, Events, EmbedBuilder } from 'discord.js'
import fetchRecruit from './fetchRecruit.js'

import dotenv from 'dotenv'
dotenv.config()
const { BOT_TOKEN } = process.env

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
})

client.once(Events.ClientReady, function (event) {
  console.log(`✅ ${event.user.username} is ready!`)
})

client.on(Events.InteractionCreate, async function (interaction) {
  if (!interaction.isChatInputCommand()) return

  const options = interaction.options
  if (interaction.commandName == 'getplayer') {
    const firstName = options.get('firstname').value
    const lastName = options.get('lastname').value
    const worldName = options.get('world').value
    const charName = `${firstName} ${lastName}`
    interaction.reply('...fetching data...')

    const recruit = await fetchRecruit(charName, worldName)
    const embed = new EmbedBuilder().setDescription(recruit.discordMessage)
    const urlString = `FFLogs: <${recruit.fflogsURL}>\nTomestone: ${recruit.tomestoneURL}`
    await interaction.editReply({ embeds: [embed], content: '' })
    interaction.followUp(urlString)
  }
})

client.login(BOT_TOKEN)
