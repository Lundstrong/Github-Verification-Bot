const express = require('express')
const app = express()
const axios = require('axios').default
const query = require('querystring')
const clientId = "541415639525621760"
const clientSecret = process.env.clientSecret
var redirectUrl = "https://github-verification-bot.sasial.repl.co/callback"

app.get("/login", async (req,res) => {
    res.redirect("https://discord.com/oauth2/authorize?client_id=541415639525621760&redirect_uri=https%3A%2F%2Fgithub-verification-bot.sasial.repl.co%2Fcallback&response_type=code&scope=identify%20connections&prompt=none")
})

app.get("/callback", async (req,res) => {
    const data = await axios.post('https://discord.com/api/v8/oauth2/token', query.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: redirectUrl
    }), {
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).catch(err => {
        console.error(err.request.data)
    })
    
    if (data) {
        var connectionFound = false
        const connections = await axios.get('https://discord.com/api/v8/users/@me/connections', {
            headers: {
                Authorization: `Bearer ${data.data.access_token}`
            }
        }).catch(err => {
          console.error(err.request.data)
        })
        if (connections) {
            var i = 0
            for (i = 0; i < connections.data.length; i++) {
                if (connections.data[i].type == "github") {
                    const contributors = await axios.get('https://api.github.com/repos/sasial-dev/Vanilla-Updater/contributors').catch(err => {
                        console.error(err.request.data)
                    })
                    if (contributors) {
                        var j = 0
                        var contributorIds = []
                        for (j = 0; j < contributors.data.length; j++) {
                            contributorIds.push(contributors.data[j].id)
                        }
                        if (contributorIds.includes(Number(connections.data[i].id))) {
                            connectionFound = true
                            res.json({
                                contributor: true
                            })
                        }
                    }
                }
            }
            if (!connectionFound) {
              res.json({
                    contributor: false
              })
            }
        }
    }
})

app.listen()
