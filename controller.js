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
    const {id = null} = req.params
    console.log("received id: " + id)
    var RT = 'invalid_RT for user: ' + id
    let lookFor = {
        id: id
    }
    const r_find = await User.find(lookFor)
    //console.log("r_find: " + JSON.stringify(r_find))
    if(r_find){
        RT = r_find[0].RT
        console.log(`found userID: ${r_find[0].id} with RT: ${RT}`)
    }
    else{
        res.status(404).json({
            status: 404,
            message: 'not found'
        })
    }
    //
    //call to Spotify API: POST /api/token
    let options = {
        method: 'POST',
        uri: 'https://accounts.spotify.com/api/token',
        form: {
            grant_type: 'refresh_token',
            refresh_token: RT
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + (new Buffer(myAppConsts.client_id + ':' + myAppConsts.client_secret).toString('base64'))
        },
        json: true
    };
    //
    var access_token    = "some0_invalid_access_token_AT_invalid"
    //make the call
    //
    rp(options)
        .then(async (body) => {
            access_token    = body.access_token
            console.log(`new AT: ${access_token}`)
            //save new AT in DB
            const r_updateOne = await User.updateOne(
                {'id': id},
                {$set: {AT: access_token}})
            if(r_updateOne){
                res.json(body)
            }
            else {
                res.status(404).send('not found')
            }
        })
        .catch((err) => {
            console.log(`response.statusCode = ${err.statusCode}`)
            console.log(`error in newAT(): ${err}`)
            res.status(err.statusCode).json({
                status: err.statusCode,
                message: err.message
            })
        })
}
//
//get basic data
var basicData = async function(req, res, next){
    console.log("starting basicData()")
    //
    //getting user from DB
    const {id = null} = req.params
    console.log("received id: " + id)
    var AT = 'invalid_AT for user: ' + id
    var lookFor = {
        id : id
    }
    let r_find = await User.find(lookFor)
    if(r_find){
        AT = r_find.AT
        //console.log(`found userID: ${curr_User.id} with AT: ${AT}`)
    }
    else{
        res.status(404).json({
            status: 404,
            message: 'not found'
        })
    }
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
                let opt_url = baseURL + '/newAT/' + id
                let opt = {
                    url: opt_url,
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
                            console.log("User AT: " + AT)
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
    console.log("getPlaylists()")    
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
            let r = {
                playlists: []
            }
            let items_response = body.items
            items_response.forEach((currItem) => {
                //add to r object
                r.playlists.push({
                    id: currItem.id,
                    name: currItem.name,
                    img: currItem.images[0].url
                })
            }) 
            res.json(r)
            //res.json(body)
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
                                items_response = body3.items
                                items_response.forEach((currItem) => {
                                    //add to r object
                                    r.playlists.push({
                                        id: currItem.id,
                                        name: currItem.name,
                                        img: currItem.images[0].url
                                    })
                                }) 
                                res.json(r)
                                //res.json(body3)
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
//get tracks
var getTracks = async function(req, res, next){
    console.log("getTracks()")
    const {id = null} = req.params
    const {pl_id = null} = req.params
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
    //creating API call
    let url_api = 'https://api.spotify.com/v1/playlists/' + pl_id + '/tracks'
    var options = {
        url: url_api,
        headers: { 'Authorization': 'Bearer ' + AT },
        json: true
    };
    //call to Spotify API: GET /playlists/{user_id}/playlists
    rp(options)
        .then((body) => {
            let r = {
                tracks: []
            }
            let tracks_response = body.items
            tracks_response.forEach((currItem) => {
                let artists = ''
                let artists_response = currItem.track.artists
                //console.log('artists_response = ' + JSON.stringify(artists_response))
                artists_response.forEach((currArtist) => {
                    artists += currArtist.name + ', '
                })
                artists = artists.slice(0, artists.length-1-1)
                //add to r object
                r.tracks.push({
                    id: currItem.track.id,
                    name: currItem.track.name,
                    artist: artists
                })
            }) 
            res.json(r)
            //res.json(body)
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
                                items_response = body3.items
                                items_response.forEach((currItem) => {
                                    //add to r object
                                    r.playlists.push({
                                        id: currItem.id,
                                        name: currItem.name,
                                        img: currItem.images[0].url
                                    })
                                }) 
                                res.json(r)
                                //res.json(body3)
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
//get tracks
var getArtists = async function(req, res, next){
    console.log("getArtists()")
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
    //creating API call
    var options = {
        url: 'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5',
        headers: { 'Authorization': 'Bearer ' + AT },
        json: true
    };
    //call to Spotify API: GET /users/{user_id}/playlists
    rp(options)
        .then((body) => {
            let r = {
                artists: []
            }
            let artists_response = body.items
            artists_response.forEach((currArtist) => {
                //console.log("currArtist" + JSON.stringify(currArtist))
                r.artists.push({
                    id: currArtist.id,
                    name: currArtist.name,
                    popu: currArtist.popularity//,
                    //img: currArtist.images[0].url
                })    
            })
            res.json(r)
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
                                console.log('completed GET /getArtists after creating new AT')
                                artists_response = body3.items
                                artists_response.forEach((currArtist) => {
                                    r.push({
                                        id: currArtist.id,
                                        name: currArtist.name,
                                        popu: currArtist.popularity,
                                        img: currArtist.images[0].url
                                    })    
                                })
                                res.json(r)
                                //res.json(body3)
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                console.log('error in rp(options) second call with err: ' + JSON.stringify(err3))
                                console.log('error in rp(options) second call with status: ' + err3.statusCode)
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
//get artist's top tracks
var artistTopTracks = async function(req, res, next){
    console.log("artistTopTracks()")
    const {id = null} = req.params
    const {art_id = null} = req.params
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
    //creating API call
    let api_url = 'https://api.spotify.com/v1/artists/' + art_id + '/top-tracks?country=IL'
    var options = {
        url: api_url,
        headers: { 'Authorization': 'Bearer ' + AT },
        json: true
    };
    //call to Spotify API: GET /users/{user_id}/playlists
    rp(options)
        .then((body) => {
            let r = {
                tracks: []
            }
            let tracks_response = body.tracks
            tracks_response.forEach((currTrack) => {
                //console.log("currArtist" + JSON.stringify(currArtist))
                r.tracks.push({
                    id: currTrack.id
                })    
            })
            res.json(r)
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
                console.log('AT invalid in GET /artistTopTracks')
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
                                console.log('completed GET /artistTopTracks after creating new AT')
                                tracks_response = body3.tracks
                                tracks_response.forEach((currTrack) => {
                                    //console.log("currArtist" + JSON.stringify(currArtist))
                                    r.tracks.push({
                                        id: currTrack.id
                                    })    
                                })
                                res.json(r)
                                //res.json(body3)
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                console.log('error in rp(options) second call with err: ' + JSON.stringify(err3))
                                console.log('error in rp(options) second call with status: ' + err3.statusCode)
                                if(err3.statusCode === 401){
                                    console.log('creating new AT in GET /artistTopTracks FAILED! code=401')
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
//new Pl
var newPL = async function(req, res, next){
    console.log('starting newPL()')
    //body data
    const name          = req.body.hasOwnProperty('name'         ) ? req.body.name          : "default name"
    const public        = req.body.hasOwnProperty('public'       ) ? req.body.public        : true
    const collaborative = req.body.hasOwnProperty('collaborative') ? req.body.collaborative : false
    const description   = req.body.hasOwnProperty('description'  ) ? req.body.description   : "some nice description"
    //
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
    //call to Spotify API: POST /api/token
    let api_uri = 'https://api.spotify.com/v1/users/' + id + '/playlists'
    let options = {
        method: 'POST',
        uri: api_uri,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + AT
        },
        body: {
            name: name,
            public: public,
            collaborative: collaborative,
            description: description
        },
        json: true
    };
    //
    //call to Spotify API: POST /users/{user_id}/playlists
    rp(options)
        .then((body) => {
            res.json({
                id: body.id
            })
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
                console.log('AT invalid in POST /newPL')
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
                        options.headers = { 
                            'content-type': 'application/json',
                            'Authorization': 'Bearer ' + AT
                        }
                        //
                        //call to Spotify API: GET /users/{user_id}/playlists
                        rp(options)
                            .then((body3) => {
                                console.log('completed POST /newPL after creating new AT')
                                tracks_response = body3.tracks
                                tracks_response.forEach((currTrack) => {
                                    //console.log("currArtist" + JSON.stringify(currArtist))
                                    r.tracks.push({
                                        id: currTrack.id
                                    })    
                                })
                                res.json(r)
                                //res.json(body3)
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                console.log('error in rp(options) second call with err: ' + JSON.stringify(err3))
                                console.log('error in rp(options) second call with status: ' + err3.statusCode)
                                if(err3.statusCode === 401){
                                    console.log('creating new AT in POST /newPL FAILED! code=401')
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
//add to PL
var addToPL = async function(req, res, next){
    console.log('starting addToPL()')
    //body data
    var default_track = ["spotify:track:1JLLDS0KN1ITeYL9ikHKIr"]
    const uris = req.body.hasOwnProperty('uris') ? req.body.uris : default_track
    //
    const {id = null} = req.params
    const {pl_id = null} = req.params
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
    //call to Spotify API: POST /api/token
    let api_uri = 'https://api.spotify.com/v1/playlists/' + pl_id + '/tracks'
    let options = {
        method: 'POST',
        uri: api_uri,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + AT
        },
        body: {
            uris: uris
        },
        json: true
    };
    //
    //call to Spotify API: POST /users/{user_id}/playlists
    rp(options)
        .then((body) => {
            res.json(body.snapshot_id)
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
                console.log('AT invalid in POST /addToPL')
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
                        options.headers = { 
                            'content-type': 'application/json',
                            'Authorization': 'Bearer ' + AT
                        }
                        //
                        //call to Spotify API: GET /users/{user_id}/playlists
                        rp(options)
                            .then((body3) => {
                                console.log('completed POST /addToPL after creating new AT')
                                res.json(body.snapshot_id)
                                //res.json(body3)
                            })
                            .catch((err3) => {
                                console.log('error in rp(options) second call with: ' + options.url)        
                                console.log('error in rp(options) second call with err: ' + JSON.stringify(err3))
                                console.log('error in rp(options) second call with status: ' + err3.statusCode)
                                if(err3.statusCode === 401){
                                    console.log('creating new AT in POST /addToPL FAILED! code=401')
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
    welcomeMsg: welcomeMsg,
    getPlaylists: getPlaylists,
    getTracks: getTracks,
    getArtists: getArtists,
    artistTopTracks: artistTopTracks,
    newPL: newPL,
    addToPL: addToPL
}