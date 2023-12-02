import discord from 'discord.js'
import dotenv from 'dotenv'
import { REST } from '@discordjs/rest'
import { DisTube, Queue } from 'distube';
import { joinVoiceChannel } from '@discordjs/voice';
import { writeFile } from 'fs/promises'
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
//configure discord music bot setting
client.Distube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false
})

//getting tokens
const getToken = async () => {
  const url = 'https://accounts.spotify.com/api/token'
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
      },
      body: 'grant_type=client_credentials',
      json: true
    })
    const data = await res.json();
    return data.access_token

  } catch (error) {
    console.error(`error with fetching spotify tokens: ${error.message}`)
  }
}
const getSpotifyPlaylist = async (playlistURL) => {
  const token = await getToken();
  try {
    const res = await fetch(playlistURL, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      json:true
    });
    const data = await res.json();
    
    let allSongsInfo = data.tracks.items;
    const songArr = [];
    for (const song of allSongsInfo) {
      const basicSongInfo = {artist: []}
      basicSongInfo.songTitle = song.track.album.name
      for (let i = 0; i < song.track.album.artists.length; i++) {
        basicSongInfo.artist.push(song.track.album.artists[i].name) 
      }
      songArr.push(basicSongInfo)
    }
    console.log(songArr)
    return songArr
  } catch (error) {
    console.error(`error occurred when fetching spotify playlist: ${error}`)
  }
}
client.on('ready', () => {
  console.log("ready")
  getSpotifyPlaylist("https://api.spotify.com/v1/playlists/2RlXDmBCR6vRXsmKmligq1")
  console.log("done")

})
let inCorrectChannel = false;

client.on('messageCreate',async (message) => {
  if (message.author.bot) return;
  let prefix = "#"
  if (message.content[0] === prefix) {
    const messageArr = message.content.split(":");
    const cmd = messageArr[0];
    const song = messageArr[1];
    if (cmd === ("#play")) {

      client.Distube.play(message.member.voice.channel, song, {
        member: message.member,
        textChannel: message.channel,
        message
      })
    } else if (cmd === ("#pause")) {
      client.Distube.pause(message)
    } else if (cmd === ("#resume")) {
      client.Distube.resume(message)
    } else if (cmd === "#skip") {
      client.Distube.skip(message)
    } else if (cmd === "#shuffle") {
      client.Distube.shuffle(message)
    }
  }
})
client.Distube.on("playSong", (queue, song) => {
  console.log(song.name)
  queue.textChannel.send(`currently playing ${song.name}`)
})
client.login(process.env.TOKEN)