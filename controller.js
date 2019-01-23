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
/**
 *  @ gets user id
 *  @ query mongoose to find 'AT'
 *  @ returns Promise with the key resulted from mongoose query
 */
async function getAT(uid){
    return new Promise(async (resolve, reject) => {
        let f_name = 'getAT()', call1 = 'call1', call2= 'call2'
        //
        //getting user from DB
        console.log(`starting ${f_name}`)
        console.log(`   in ${f_name}> received partially id: ${uid.substr(0, 5)}`)
        var lookFor = {
            id : uid
        }
        User.find(lookFor).exec()
            .then((res) => {
                resolve(res[0].AT)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
/**
 *  @ gets user id
 *  @ query mongoose to find 'RT'
 *  @ returns Promise with the key resulted from mongoose query
 */
async function getRT(uid){
    return new Promise(async (resolve, reject) => {
        let f_name = 'getRT(uid)', call1 = 'call1', call2= 'call2'
        //
        //getting user from DB
        console.log(`starting ${f_name}`)
        console.log(`   in ${f_name}> received partially id: ${uid.substr(0, 5)}`)
        var lookFor = {
            id : uid
        }
        User.find(lookFor).exec()
            .then((res) => {
                resolve(res[0].RT)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
/**
 *  @ gets user id
 *  @ returns new Promise:
 *  @ success   :   {status, message, realResponse}
 *  @ failure   :   {status, message, realResponse, ..moreReleventKeys}
 */
async function get_new_AT(uid){
    return new Promise(async (resolve, reject) => {
        let f_name = 'get_new_AT()', call1 = 'getRT()', call2= 'Spotify_API: POST /api/token'
        console.log(`starting ${f_name}`)
        console.log(`   in ${f_name}> received partially id: ${uid.substr(0, 5)}`)
        //get RT from DB        
        var RT = 'invalid_RT for user: ' + uid
        getRT(uid)
            .then((rt_find) => {
                RT = rt_find
                console.log(`   in ${f_name}> found partially userID: ${uid.substr(0, 5)} with partially RT: ${RT.substr(0, 10)}`)
                //
                //get new access token from Spotify API
                let options = {
                    method: 'POST',
                    uri: 'https://accounts.spotify.com/api/token',
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: RT
                    },
                    headers: {
                        'Authorization' : 'Basic ' + (new Buffer.from(myAppConsts.client_id + ':' + myAppConsts.client_secret).toString('base64'))
                    },
                    json: true
                };
                //
                var access_token    = "some0_invalid_access_token_AT_invalid"
                rp(options)
                    .then(async (body) => {
                        access_token    = body.access_token
                        console.log(`   in ${f_name}> new partially AT= ${access_token.substr(0, 10)}`)
                        //save new AT in DB
                        User.updateOne({id: uid}, {$set: {AT: access_token}}).exec()
                            .then((res) => {
                                //console.log(`   in ${f_name}> res = ${JSON.stringify(res)}}`)
                                resolve({
                                    statusCode: 200,
                                    message: `[${f_name} SUCCESS with message --success-- from: updateOne()]`,
                                    realResponse: body,
                                    access_token: body.access_token
                                })
                            })
                            .catch((err) => {
                                //console.log(`   in ${f_name}> err with updateOne() = ${err}`)
                                reject({
                                    statusCode: 404,
                                    message: `[${f_name} FAILED with message: --${err}-- from: updateOne()]`,
                                    realResponse: {r: '[no realResponse]'}
                                })
                            })
                    })
                    .catch((err) => {
                        console.log(`   in ${f_name}> catch = ?}`)
                        let sc = err.hasOwnProperty('statusCode') ? err.statusCode : 999
                        let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
                        reject({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message: --${ms}-- from: ${call2}]`,
                            realResponse: err
                        })
                    })
            })
            .catch((err_getRT) => {
                reject({
                    statusCode: 404,
                    message: `[${f_name} FAILED with message: --${err_getRT}-- from: ${call1}]`,
                    realResponse: {r: '[no realResponse]'}
                })
            })
    })//new Promise
}
//
//
//ROUTES implementations
//
//new AT (Authorization Token)
/**
 *  @ gets user id
 *  @ returns new Promise:
 *  @ success   :   {status, message, realResponse}
 *  @ failure   :   {status, message, realResponse, ..moreReleventKeys}
 */
var newAT = async function(req, res, next){
    let f_name = '/GET newAT', call1 = 'get_new_AT()', call2= 'call2'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    console.log(`   in${f_name}> received partially id: ${id.substr(0, 5)}`)
    //
    //get new AT using our function
    get_new_AT(id)
        .then((mSuccess) => {
            console.log(`   in ${f_name}> partially new_AT is: ${mSuccess.access_token.substr(0, 10)}`)
            res.json({
                statusCode: mSuccess.statusCode,
                message: `[${f_name} SUCCESS with message --${mSuccess.message}-- from: ${call1}]`,
                realResponse: mSuccess
            })
        })
        .catch((mError) => {
            res.json({
                statusCode: mError.statusCode,
                message: `[${f_name} FAILED with message: --${mError.message}-- from: ${call1}]`,
                realResponse: mError
            })
        })
}
//
//get basic data from Spotify API
var basicData = async function(req, res, next){
    let f_name = '/GET basicData', call1 = 'getAT()', call2= 'Spotify_API GET /me'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    console.log(`   in ${f_name}> received partially id: ${id.substr(0, 5)}`)
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((at_find) => {
            AT = at_find
            console.log(`   in ${f_name}> found partially userID: ${id.substr(0, 5)} with partially AT: ${AT.substr(0, 10)}`)
            //
            //create Spotify API call
            var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + AT },
                json: true
            };
            rp(options)
                .then((body) => {
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        realResponse: body
                    })
                })
                .catch(async (err) => {
                    let sc = err.hasOwnProperty('statusCode') ? err.statusCode : 999
                    //need new AT
                    if(sc == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((mSuccess) => {   //new AT created successfully    
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${mSuccess.access_token.substr(0, 10)}`)
                                //call again
                                options.headers = { 'Authorization': 'Bearer ' + mSuccess.access_token }
                                rp(options)
                                    .then((body2) => {
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            realResponse: body2
                                        })
                                    })
                                    .catch((err2) => {
                                        let sc2 = err.hasOwnProperty('statusCode') ? err2.statusCode : 999
                                        let ms2 = err.hasOwnProperty('message'   ) ? err2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms}-- from: ${call2}]`,
                                            realResponse: err2
                                        })
                                    })//second call to API
                            })
                            .catch((mError) => {    //new AT wasn't created
                                res.json({
                                    statusCode: mError.statusCode,
                                    message: `[${f_name} FAILED with message --${mError.message}-- from: get_new_AT()]`,
                                    realResponse: mError
                                })
                            })
                    }
                    else{
                        let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            realResponse: err
                        })
                    }
                })//first call to API
        })
        .catch((err_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${err_getAT}-- from: ${call1}]`,
                realResponse: {r: '[no realResponse]'}
            })
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