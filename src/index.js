import discord from 'discord.js'
import dotenv from 'dotenv'
import { REST } from '@discordjs/rest'
import { DisTube } from 'distube';
import { joinVoiceChannel } from '@discordjs/voice';

dotenv.config();
//give permission to bot to access certain events
  //bot get access to Guilds event (server events)
const client = new discord.Client({
    intents: [
      "Guilds",
      "GuildMessages",
      "GuildVoiceStates",
      "MessageContent"
    ]
})

client.Distube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false
  })
client.on('ready', () => {
  console.log('server is ready')
})
let inCorrectChannel = false;

client.on('messageCreate',async (message) => {
  if (message.author.bot) return;
  let prefix = "#"
  if (message.content[0] === prefix) {
    console.log("within #")
    const messageArr = message.content.split(":");
    const cmd = messageArr[0];
    const song = messageArr[1];
    if (cmd === "#play") {
      client.Distube.play(message.member.voice.channel, song, {
        member: message.member,
        textChannel: message.channel,
        message
      })
    }
  }
  
})
client.login(process.env.TOKEN)