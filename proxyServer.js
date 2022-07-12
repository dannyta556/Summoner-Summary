var express = require('express')
var cors = require('cors')
const axios = require('axios')
const { request } = require('express')

var app = express()

app.use(cors())


// API key to use with all api calls, must be refreshed every 24hrs for development
const API_KEY = ""
let okResponse = true
// for AMERICAS -> americas.api.riotgames.com
// for ASIA -> asia.api.riotgames.com
// for EUROPE -> europe.api.riotgames.com

// gets the player unique ID
function getPlayerPUUID(playerName, region) {
    return axios.get("https://" + region + ".api.riotgames.com" + "/lol/summoner/v4/summoners/by-name/" + playerName + "?api_key=" + API_KEY)
        .then(response => {
            return response.data.puuid
        }).catch(err => err)
}
// returns summoner data (id, level, etc...) with a name input
function getPlayerData(playerName, region) {
    return axios.get("https://" + region + ".api.riotgames.com" + "/lol/summoner/v4/summoners/by-name/" + playerName + "?api_key=" + API_KEY)
        .then(response => {
            return response.data
        }).catch(err => {
            console.log(err.response.status)
            okResponse = false
        })
}
// returns player ranked data for each queue, returns an empty array if player hasn't played any ranked games
function getPlayerRank(id, region) {
    return axios.get("https://" + region + ".api.riotgames.com/lol/league/v4/entries/by-summoner/" + id + "?api_key=" + API_KEY)
        .then(response => {
            return response.data
        }).catch(err => err)
}
// Returns a list of champion masteries from a summoner(user)
function getChampionMasteries(id, region) {
    return axios.get("https://" + region + ".api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/" + id + "?api_key=" + API_KEY)
        .then(response => {
            return response.data
        }).catch(err => err)
}
// takes a champion id to return the champion name belonging to that id
function getChampionName(champID) {
    return axios.get("http://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json")
        .then(response => {
            let champName = ""
            Object.keys(response.data.data).forEach(function (i) {
                if (response.data.data[i].key == champID) {
                    champName = response.data.data[i].id;
                }
            })
            return champName
        }).catch(err => {
            console.log(err)
        })
}

// GET summary
// localhost:4000/summary
app.get('/summary', async (req, res) => {
    const playerName = req.query.username;
    const REGION = req.query.region;
    // PUUID
    //const PUUID = await getPlayerPUUID(playerName)


    const playerData = await getPlayerData(playerName, REGION)
    if (!okResponse) {
        const returnObj = {
            name: "NULL", icon: "NULL", level: "NULL",
            rank: "NULL", tier: "NULL", lp: "0", wins: 0, losses: 0, mainChamp: "NULL",
            championNames: ["NULL", "NULL", "NULL", "NULL", "NULL"], championLevels: 0, championPoints: [0, 0, 0, 0, 0]
        }

        res.json(returnObj)
        okResponse = true
    }
    else {
        const playerRank = await getPlayerRank(playerData.id, REGION)
        const championMasteries = await getChampionMasteries(playerData.id, REGION)

        //console.log(championMasteries[0])
        const championName = await getChampionName(championMasteries[0].championId)
        const championName2 = await getChampionName(championMasteries[1].championId)
        const championName3 = await getChampionName(championMasteries[2].championId)
        const championName4 = await getChampionName(championMasteries[3].championId)
        const championName5 = await getChampionName(championMasteries[4].championId)

        const championNames = [championName, championName2, championName3, championName4, championName5]
        const championPoints = [championMasteries[0].championPoints, championMasteries[1].championPoints, championMasteries[2].championPoints, championMasteries[3].championPoints, championMasteries[4].championPoints]
        const championLevels = [championMasteries[0].championLevel, championMasteries[1].championLevel, championMasteries[2].championLevel, championMasteries[3].championLevel, championMasteries[4].championLevel]

        // console.log(championNames)
        // console.log(championPoints)
        // console.log(championLevels)

        let returnRank = "unranked"
        let returnTier = ""
        let returnLP = "0"
        let returnWins = "0"
        let returnLosses = "0"
        let position = 0;

        // We only want to return player rank info if they have played ranked soloduo
        if (playerRank.length == 2) {
            if (playerRank[0].queueType == "RANKED_SOLO_5x5") {
                position = 0;
            } else {
                position = 1;
            }
        } else if (playerRank.length == 1) {
            if (playerRank[0].queueType == 'RANKED_SOLO_5x5') {
                position = 0;
            } else {
                position = 3;
            }
        } else {
            position = 3;
        }

        if (position !== 3) {
            returnRank = playerRank[position].rank
            returnTier = playerRank[position].tier
            returnLP = playerRank[position].leaguePoints
            returnWins = playerRank[position].wins
            returnLosses = playerRank[position].losses
        }
        const returnObj = {
            name: playerData.name, icon: playerData.profileIconId, level: playerData.summonerLevel,
            rank: returnRank, tier: returnTier, lp: returnLP, wins: returnWins, losses: returnLosses, mainChamp: championName,
            championNames: championNames, championLevels: championLevels, championPoints: championPoints
        }

        res.json(returnObj)

    }

})

app.listen(4000, function () {
    console.log('Server started on port 4000')
})

//localhost:4000