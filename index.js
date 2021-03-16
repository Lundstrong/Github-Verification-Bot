const express = require('express')
const app = express()
const axios = require('axios').default
const query = require('querystring')
const discord = require("discord.js")
const Database = require("@replit/database")
const db = new Database()
const clientId = "541415639525621760"
const clientSecret = process.env.clientSecret

var redirectUrl = "https://github-verification-bot.sasial.repl.co/callback"
var token = process.env.TOKEN

// Bot

var client = new discord.Client()

client.login(token)

client.on("message", async message => {
    if (!message.guild) return;
    if (message.bot) return;
    if (message.content == "!verify-contributor") {
        if (!message.member.roles.cache.has("821234698491396108")) {
            if (await db.get(message.member.id)) {
                await message.member.roles.add("821234698491396108")
                message.channel.send("Done!")
            } else {
                message.channel.send("Please go to https://github-verification-bot.sasial.repl.co/login, and then re-run the command after you finish the prompts!")
            }
        } else {
            message.channel.send("You already have the role!")
        }
    }
})

// Server

app.get("/", async (req,res) => {
    res.json({
        message: "ok"
    })
})

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
        console.error(err)
    })
    
    if (data) {
        const user = await axios.get('https://discord.com/api/v8/users/@me', {
            headers: {
                Authorization: `Bearer ${data.data.access_token}`
            }
        }).catch(err => {
            console.error(err)
        })
        if (user) {
            var connectionFound = false
            const connections = await axios.get('https://discord.com/api/v8/users/@me/connections', {
                headers: {
                    Authorization: `Bearer ${data.data.access_token}`
                }
            }).catch(err => {
            console.error(err)
            })
            if (connections) {
                var i = 0
                for (i = 0; i < connections.data.length; i++) {
                    if (connections.data[i].type == "github") {
                        const contributors = await axios.get('https://api.github.com/repos/sasial-dev/Vanilla-Updater/contributors', {
                            auth: {
                                username: "205e43a274d60cdbdcde",
                                password: process.env.GitHubSecret
                            }
                        }).catch(err => {
                            console.error(err)
                        })
                        if (contributors) {
                            var j = 0
                            var contributorIds = []
                            for (j = 0; j < contributors.data.length; j++) {
                                contributorIds.push(contributors.data[j].id)
                            }
                            if (contributorIds.includes(Number(connections.data[i].id))) {
                                connectionFound = true
                                await db.set(user.data.id, true)
                                res.send("Sucess!")
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
    }
})

app.listen()
