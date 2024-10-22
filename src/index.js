const { Client, IntentsBitField, Events, EmbedBuilder } = require('discord.js')
const fetchRecruit = require('./fetchRecruit')

require('dotenv').config()
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
    const embed = new EmbedBuilder().setDescription(
      await fetchRecruit(charName, worldName)
    )
    interaction.reply({ embeds: [embed] })
  }
})

client.login(BOT_TOKEN)
