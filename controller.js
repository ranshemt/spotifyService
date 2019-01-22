//npm modules
const request       = require ('request')
const rp            = require ('request-promise')
//my modules
const myAppConsts   = require ('./app_consts')
const connection    = require ('./db')
const User          = require ('./user')
const asyncWrapper  = require ('./async.wrapper')
//
//GLOBAL variables
const baseURL       = 'http://localhost:3000'
var UID = 'n76jbzpr8p28jfixqadct9k01'
//
//
//METHODS
//
//new AT (Authorization Token)
var newAT = async function(req, res, next){
    //let RT = 'AQCWjkPW0DYU08s5zAU6piJPo5U0pqZpSK54l0vZus7um2z4TrvN51gd0GwzLf4k4ttQ5QjFDc7xmWw6HIijRNak5uYjNq_i9gGcV6Yrqac4OFccARZ4u6Ts88-5IkrASG8xaQ'
    console.log('starting newAT()')
    //
    //get RT from DB
    let currUID = UID, currUser = null
    var RT = 'invalid_RT for user: ' + currUID
    var lookFor = {
        'id' : currUID
    }
    await User.findOne(lookFor, (err, curr_User) => {
        currUser = curr_User
        RT = curr_User.RT
        console.log(`found userID: ${curr_User.id} with RT: ${RT}`)
    })    
    //
    //call to Spotify API: POST /api/token
    let authOptions = {
        method: 'POST',
        url: 'https://accounts.spotify.com/api/token',
        form: {
            grant_type: 'refresh_token',
            refresh_token: RT
        },
        headers: {
            'Authorization' : 'Basic ' + (new Buffer(myAppConsts.client_id + ':' + myAppConsts.client_secret).toString('base64'))
        },
        json: true
    };
    //
    var access_token    = "some0_invalid_access_token_AT_invalid"
    //make the call
    //
    rp(authOptions)
        .then(async (body) => {
            access_token    = body.access_token
            //console.log new AT
            console.log(`new AT: ${access_token}`)
            //save new AT in DB
            await User.updateOne(
                {'id': UID},
                {$set: {AT: access_token}})
            res.json(body)
        })
        .catch((err) => {
            console.log(`response.statusCode = ${err.statusCode}`)
            console.log(`error in newAT(): ${err}`)
        })
}
//
//get basic data
var basicData = async function(req, res, next){
    console.log("basic data!")
    //
    //getting user from DB
    let currUID = UID, currUser = null
    var AT = 'invalid_AT for user: ' + currUID
    var lookFor = {
        'id' : currUID
    }
    await User.findOne(lookFor, (err, curr_User) => {
        currUser = curr_User
        AT = curr_User.AT
        console.log(`found userID: ${curr_User.id} with AT: ${AT}`)
    })
    //
    var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + AT },
        json: true
    };
    //call to Spotify API: GET /me
    rp(options)
        .then((body) => {
            console.log("no error doing: " + options.url)
            res.json(body)
        })
        .catch((err) => {
            //Forbidden to access
            if(err.statusCode === 403){
                console.log(`error in ${options.url} call with status: ${err.statusCode}`)
                console.log(`error in ${options.url} call with message: ${err.message}`)
                res.json(err)
            }
            //need new AT
            if(err.statusCode == 401){
                console.log('AT invalid in GET /basicData')

                let opt = {
                    url: baseURL + '/newAT',
                    json: true
                }
                //call to our route GET: /newAT
                rp(opt)
                    .then(async (body2) => {
                        //update options
                        currUser = null
                        await User.findOne(lookFor, (err, curr_User) => {
                            currUser = curr_User
                            AT = curr_User.AT
                        })
                        //options.qs.access_token = AT
                        options.headers = { 'Authorization': 'Bearer ' + AT }
                        //
                        //call to Spotify API: GET /me
                        rp(options)
                            .then((body3) => {
                                console.log('completed GET /basicData after creatingnew AT')
                                res.json(body3)
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                if(err3.statusCode === 401){
                                    console.log('creating new AT in GET /basicData FAILED! code=401')
                                    res.json(err3)
                                }
                            })
                    })
                    .catch((err2) => {
                        console.log('error in rp(opt) with: ' + opt.url)
                        res.json(err2)
                    })
            }
        })
}
//
//welcome message
var welcomeMsg = async function(req, res, next){
    const {id = null} = req.params
    //
    //getting user from DB
    let currUser = null
    let lookFor = {
        'id' : id
    }
    await User.findOne(lookFor, (err, curr_User) => {
        currUser = curr_User
    })
    let r = {
        un: currUser.name,
        img: currUser.img
    } 
    res.json(r)
}
//
//
var getPlaylists = async function(req, res, next){
    const {id = null} = req.params
    var lookFor = {
        'id' : id
    }
    //getting user from DB
    let currUser = null
    var AT = 'invalid_AT for user: ' + id
    await User.findOne(lookFor, (err, curr_User) => {
        currUser = curr_User
        AT = curr_User.AT
        //console.log(`found userID: ${curr_User.id} with AT: ${AT}`)
    })
    //
    let url_api = 'https://api.spotify.com/v1/users/' + id + '/playlists'
    var options = {
        url: url_api,
        headers: { 'Authorization': 'Bearer ' + AT },
        json: true
    };
    //call to Spotify API: GET /users/{user_id}/playlists
    rp(options)
        .then((body) => {
            console.log("no error doing: " + options.url)
            res.json(body)
        })
        .catch((err) => {
            //Forbidden to access
            if(err.statusCode === 403){
                console.log(`error in ${options.url} call with status: ${err.statusCode}`)
                console.log(`error in ${options.url} call with message: ${err.message}`)
                res.json(err)
            }
            //need new AT
            if(err.statusCode == 401){
                console.log('AT invalid in GET /getPlaylists')

                let opt = {
                    url: baseURL + '/newAT',
                    json: true
                }
                //call to our route GET /newAT
                rp(opt)
                    .then(async (body2) => {
                        //update options
                        currUser = null
                        await User.findOne(lookFor, (err, curr_User) => {
                            currUser = curr_User
                            AT = curr_User.AT
                        })
                        options.headers = { 'Authorization': 'Bearer ' + AT }
                        //
                        //call to Spotify API: GET /users/{user_id}/playlists
                        rp(options)
                            .then((body3) => {
                                console.log('completed GET /getPlaylists after creating new AT')
                                res.json(body3)
                                
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                if(err3.statusCode === 401){
                                    console.log('creating new AT in GET /getPlaylists FAILED! code=401')
                                    res.json(err3)
                                }
                            })
                    })
                    .catch((err2) => {
                        console.log('error in rp(opt) with: ' + opt.url)
                        res.json(err2)
                    })
            }
        })
}
//
//
module.exports = {
    newAT: newAT,
    basicData: basicData,
    welcomeMsg: welcomeMsg
}