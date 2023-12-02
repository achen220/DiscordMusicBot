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
  // console.log("getting spotify playlist")
  // console.log(playlistURL)
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
    // console.log(songArr)
    return songArr
  } catch (error) {
    console.error(`error occurred when fetching spotify playlist: ${error}`)
  }
}
client.on('ready', () => {
  console.log("ready")
})


client.on('messageCreate',async (message) => {
  // if (message.author.bot) return;
  console.log(message.member.voice.channel)

  let prefix = "#"
  if (message.content[0] === prefix) {
    const messageArr = message.content.split(":");
    const cmd = messageArr[0];
    const utility = messageArr[1];
    if (message.member.voice.channel === null) {
      message.channel.send("you need to be in a voice channel in order to add the bot dummy")
      return;
    }
    if (cmd === ("#play")) {
      client.Distube.play(message.member.voice.channel, utility, {
        member: message.member,
        textChannel: message.channel,
        message
      })
      message.channel.send(`Added ${utility} - to the queue`)
    } else if (cmd === ("#pause")) {
      client.Distube.pause(message)
    } else if (cmd === ("#resume")) {
      client.Distube.resume(message)
    } else if (cmd === "#skip") {
      const queue = client.Distube.getQueue(message);
      if (queue.songs.length <= 1) message.channel.send("No next song to skip to")
      else {
        client.Distube.skip(message)
      }
    } 
    // else if (cmd === "#shuffle") {
    //   client.Distube.shuffle(message)
    // } 
      else if (cmd === "#spotify") {
      let apiLink = "https://api.spotify.com/v1/playlists/" + utility.trim();
      const songArr = await getSpotifyPlaylist(apiLink);
      let limit = 20;
      if (songArr.length > limit) message.channel.send(`Does not allow playlist longer than ${limit} songs, go make a fucken shorter playlist we not gonna be here for that long`)
      else {
        message.channel.send(`Playing spotify playlist: ${apiLink}`)
        for (let i = 0; i < songArr.length; i++) {
          let info = songArr[i];
          const songsID = `${info.songTitle} by ${info.artist[0]}`
          client.Distube.play(message.member.voice.channel, songsID, {
            member: message.member,
            textChannel: message.channel,
            message
          })
        }
      }
    } else if (cmd === "#getQueue") {
      const queue = client.Distube.getQueue(message);
      message.channel.send('Current queue:\n' + queue.songs.map((song, id) =>
          `**${id+1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``
      ).join("\n"));
    } else if (cmd === "#commands") {
      message.channel.send("no i will not give you the commands")
    }
  }
})

// client.Distube.on("playSong", (queue, song) => {
//   queue.textChannel.send(`currently playing ${song.name}`)
// })

// client.Distube.on("addSong", (queue, song) => {
//   queue.textChannel.send(`Added ${song.name} - to the queue by ${song.user}.`)
// })
client.login(process.env.TOKEN)