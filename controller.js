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
/** function
 *  @ gets user id
 *  @ query mongoose to find 'AT'
 *  @ returns new Promise:
 *  @ resolve   :   {access_token (string)}
 *  @ reject    :   {'property doesnt exist'} OR {err}
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
                let r_relevant_JSON = JSON.parse(JSON.stringify(res[0]))
                if(r_relevant_JSON.hasOwnProperty('AT')){
                    resolve(r_relevant_JSON.AT)
                } else{
                    reject('the property you tried to reach doesnt exist')   
                }
            })
            .catch((err) => {
                reject(err)
            })
    })
}
/** function
 *  @ gets user id
 *  @ query mongoose to find 'RT'
 *  @ returns new Promise:
 *  @ resolve   :   {refresh_token (string)}
 *  @ reject    :   {'property doesnt exist'} OR {err}
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
                let r_relevant_JSON = JSON.parse(JSON.stringify(res[0]))
                if(r_relevant_JSON.hasOwnProperty('RT')){
                    resolve(r_relevant_JSON.RT)
                } else{
                    reject('the property you tried to reach doesnt exist')   
                }
            })
            .catch((err) => {
                reject(err)
            })
    })
}
/** function
 *  @ gets user id
 *  @ returns new Promise:
 *  @ resolve   :   {status, message, realResponse, access_token}
 *  @ reject    :   {status, message, realResponse}
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
                                    access_token: body.access_token,
                                    realResponse: body
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
/** function
 *  @ gets user id
 *  @ query mongoose to update 'AT'
 *  @ returns new Promise
 */
async function make_invalidAT(uid){
    var f_name = 'make_invalidAT()'
    return new Promise(async (resolve, reject) => {
        var newAT = "invalid_AT_for_user__" + uid.substr(0, 5)
        //save new AT in DB
        User.updateOne({id: uid}, {$set: {AT: newAT}}).exec()
        .then((res) => {
            //console.log(`   in ${f_name}> res = ${JSON.stringify(res)}}`)
            resolve({
                statusCode: 200,
                message: `[${f_name} SUCCESS with message --success-- from: updateOne()]`,
                access_token: newAT,
                realResponse: res
            })
        })
        .catch((err) => {
            //console.log(`   in ${f_name}> err with updateOne() = ${err}`)
            reject({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${err}-- from: updateOne()]`,
                realResponse: err
            })
        })
    })
}
//
//
//ROUTES implementations
//
//
//
/** GET /invalidAT/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, realResponse}
 *  @ failure   :   {status, message, realResponse}
 */
var invalidAT = async function(req, res, next){
    let f_name = 'GET newAT/id', call1 = 'make_invalidAT()', call2= 'call2'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    console.log(`   in${f_name}> received partially id: ${id.substr(0, 5)}`)
    //
    //get new AT using our function
    make_invalidAT(id)
        .then((resolve_make_invalidAT) => {
            console.log(`   in ${f_name}> new_AT is: ${resolve_make_invalidAT.access_token}`)
            res.json({
                statusCode: resolve_make_invalidAT.statusCode,
                message: `[${f_name} SUCCESS with message --${resolve_make_invalidAT.message}-- from: ${call1}]`,
                access_token: resolve_make_invalidAT.access_token,
                realResponse: resolve_make_invalidAT
            })
        })
        .catch((reject_make_invalidAT) => {
            res.json({
                statusCode: reject_make_invalidAT.statusCode,
                message: `[${f_name} FAILED with message: --${reject_make_invalidAT.message}-- from: ${call1}]`,
                realResponse: reject_make_invalidAT
            })
        })
}
//
/** GET /newAT/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, realResponse}
 *  @ failure   :   {status, message, realResponse}
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
/** function
 *  @ gets user AT
 *  @ Spotify call GET /me. to get logged in user data 
 *  @ returns new Promise:
 *  @ resolve   :   {status, message, realResponse}
 *  @ reject    :   {status, message, realResponse}
 */
async function s_api_me(myAT){
    var f_name ='s_api_me()', call1 = 'Spotify_API GET /me', call2 = 'call2'
    console.log(`starting ${f_name}`)
    console.log(`   in ${f_name}> received partially AT: ${myAT.substr(0, 10)}`)
    return new Promise(async (resolve, reject) =>{
        var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + myAT },
            json: true
        }
        rp(options)
            .then((body) => {
                resolve({
                    statusCode: 200,
                    message: `[${f_name} SUCCESS with message --success-- from: ${call1}]`,
                    realResponse: body
                })
            })
            .catch((err) => {
                let sc = err.hasOwnProperty('statusCode') ? err.statusCode : 999
                let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
                reject({
                    statusCode: sc,
                    message: `[${f_name} FAILED with message: --${ms}-- from: ${call1}]`,
                    realResponse: err
                })
            })
    })//new Promise
}
//
/** GET /basicData/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, realResponse}
 *  @ failure   :   {status, message, realResponse}
 */
var basicData = async function(req, res, next){
    let f_name = '/GET basicData', call1 = 'getAT()', call2= 's_api_me()', call3 = 'get_new_AT()'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    console.log(`   in ${f_name}> received partially id: ${id.substr(0, 5)}`)
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((resolve_getAT) => {
            AT = resolve_getAT
            console.log(`   in ${f_name}> found partially userID: ${id.substr(0, 5)} with partially AT: ${AT.substr(0, 10)}`)
            //
            //make call
            s_api_me(AT)
                .then((resolve_s_api_me) => {
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --${resolve_s_api_me.message}-- from: ${call2}]`,
                        realResponse: resolve_s_api_me.realResponse
                    })
                })
                .catch((reject_s_api_me) => {
                    //need new AT
                    if(reject_s_api_me.statusCode == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((resolve_get_new_AT) => {
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${resolve_get_new_AT.access_token.substr(0, 10)}`)
                                AT = resolve_get_new_AT.access_token
                                s_api_me(AT)
                                    .then((resolve_s_api_me2) => {
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --${resolve_s_api_me2.message}-- from_2_: ${call2}]`,
                                            realResponse: resolve_s_api_me2.realResponse
                                        })
                                    })
                                    .catch((reject_s_api_me2) => {
                                        res.json({
                                            statusCode: reject_s_api_me2.statusCode,
                                            message: `[${f_name} FAILED with message: --${reject_s_api_me2.message}-- from_2_: ${call2}]`,
                                            realResponse: reject_s_api_me2.realResponse
                                        })
                                    })
                            })
                            .catch((reject_get_new_AT) => {
                                res.json({
                                    statusCode: reject_get_new_AT.statusCode,
                                    message: `[${f_name} FAILED with message --${reject_get_new_AT.message}-- from: ${call3}]`,
                                    realResponse: reject_get_new_AT.realResponse
                                })
                            })
                    }
                    //api call failed
                    else{
                        res.json({
                            statusCode: reject_s_api_me.statusCode,
                            message: `[${f_name} FAILED with message: --${reject_s_api_me.message}-- from: ${call2}]`,
                            realResponse: reject_s_api_me.realResponse
                        })
                    }
                })
        })
        //error getting AT using our function
        .catch((reject_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${reject_getAT}-- from: ${call1}]`,
                realResponse: reject_getAT
            })
        })
}
//
/** GET /welcomeMsg/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var welcomeMsg = async function(req, res, next){
    let f_name = '/GET welcomeMsg', call1 = 'find()', call2= 'call2'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    //
    //getting user from DB
    let lookFor = {
        'id' : id
    }
    let r = {
        un: 'error name',
        img: '#'
    } 
    User.find(lookFor).exec()
        .then((r_find) => {
            let r_relevant_JSON = JSON.parse(JSON.stringify(r_find[0]))
            r.un  = r_relevant_JSON.hasOwnProperty('name') ? r_relevant_JSON.name : 'no name for user'
            r.img = r_relevant_JSON.hasOwnProperty('img' ) ? r_relevant_JSON.img  : '#'
            res.json({
                statusCode: 200,
                message: `[${f_name} SUCCESS with message: --success-- from: ${call1}]`,
                actualResponse: {is: true, data: r},
                realResponse: r_find
            })
        })
        .catch((err) => {
            let sc = err.hasOwnProperty('statusCode') ? err.statusCode : 999
            let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
            res.json({
                statusCode: sc,
                message: `[${f_name} FAILED with message: --${ms}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: err
            })
        })
}
//
/** GET /getPlaylists/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var getPlaylists = async function(req, res, next){
    let f_name = '/GET getPlaylists', call1 = 'getAT()', call2= 'Spotify_API GET /users/{user_id}/playlists'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((at_find) => {
            AT = at_find
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
                        let curr_id   = currItem.hasOwnProperty('id'  ) ? currItem.id   : 'no id for playlist'
                        let curr_name = currItem.hasOwnProperty('name') ? currItem.name : 'no name for playlist'
                        let curr_img  = '#'
                        if(currItem.hasOwnProperty('images') && currItem.images.length > 0)
                            curr_img = currItem.images[0].url
                        //add to r object
                        r.playlists.push({
                            id: curr_id,
                            name: curr_name,
                            img: curr_img
                        })
                    })
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        actualResponse: {is: true, data: r},
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
                                        let r = {
                                            playlists: []
                                        }
                                        let items_response = body2.items
                                        items_response.forEach((currItem) => {
                                            let curr_id   = currItem.hasOwnProperty('id'  ) ? currItem.id   : 'no id for playlist'
                                            let curr_name = currItem.hasOwnProperty('name') ? currItem.name : 'no name for playlist'
                                            let curr_img  = '#'
                                            if(currItem.hasOwnProperty('images') && currItem.images.length > 0)
                                                curr_img = currItem.images[0].url
                                            //add to r object
                                            r.playlists.push({
                                                id: curr_id,
                                                name: curr_name,
                                                img: curr_img
                                            })
                                        })
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            actualResponse: {is: true, data: r},
                                            realResponse: body2
                                        })
                                    })
                                    .catch((err2) => {
                                        let sc2 = err.hasOwnProperty('statusCode') ? err2.statusCode : 999
                                        let ms2 = err.hasOwnProperty('message'   ) ? err2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                            actualResponse: {is: false},
                                            realResponse: err2
                                        })
                                    })//second call to API
                            })
                            .catch((mError) => {    //new AT wasn't created
                                res.json({
                                    statusCode: mError.statusCode,
                                    message: `[${f_name} FAILED with message --${mError.message}-- from: get_new_AT()]`,
                                    actualResponse: {is: false},
                                    realResponse: mError
                                })
                            })
                    }
                    else{
                        let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: err
                        })
                    }
                })//first call to API
        })
        .catch((err_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${err_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: err_getAT
            })
        })
}
//
/** GET /getTracks/id&pl_is
 *  @ gets user_id & pl_id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var getTracks = async function(req, res, next){
    let f_name = '/GET getTracks', call1 = 'getAT()', call2= 'Spotify_API GET /playlists/{pl_id}/tracks'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    const {pl_id = null} = req.params
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((at_find) => {
        AT = at_find
        //
        let url_api = 'https://api.spotify.com/v1/playlists/' + pl_id + '/tracks'
        var options = {
            url: url_api,
            headers: { 'Authorization': 'Bearer ' + AT },
            json: true
        }
        //call to Spotify API: GET /playlists/{pl_id}/tracks
        rp(options)
            .then((body) => {
                let r = {
                    tracks: []
                }
                let tracks_response = body.items
                tracks_response.forEach((currTrack) => {
                    let flagMsg = null
                    if((currTrack.hasOwnProperty('track')) == false)
                        flagMsg = 'no property track'
                    if(currTrack.hasOwnProperty('track') == true && (currTrack.track.hasOwnProperty('artists') == false))
                        flagMas = 'no property artists'
                    if(currTrack.hasOwnProperty('track') == true && currTrack.track.hasOwnProperty('artists') == true && currTrack.track.artists.length < 1)
                        flagMsg = 'no tracks in playlist'
                    if(flagMsg != null){
                        res.json({
                            statusCode: 404,
                            message: `[${f_name} FAILED with message --${flagMsg}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: body
                        })
                    }
                    let artists_response = currTrack.track.artists
                    let artists = ''
                    artists_response.forEach((currArtist) => {
                        artists += currArtist.name + ', '
                    })
                    artists = artists.slice(0, artists.length-1-1)
                    let track_id   = currTrack.track.hasOwnProperty('id'  ) ? currTrack.track.id   : 'no id for track'
                    let track_name = currTrack.track.hasOwnProperty('name') ? currTrack.track.name : 'no name for playlist'
                    //add to r object
                    r.tracks.push({
                        id: track_id,
                        name: track_name,
                        artist: artists
                    })
                })//forEach track
                res.json({
                    statusCode: 200,
                    message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                    actualResponse: {is: true, data: r},
                    realResponse: body
                })
            })
            .catch(async (err) => {
                let sc = err.hasOwnProperty('statusCode') ? err.statusCode : 999
                console.log(`   in ${f_name}> sc = ${sc}`)
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
                                .then((body_apiCall2) => {
                                    let r = {
                                        tracks: []
                                    }
                                    let tracks_response = body_apiCall2.items
                                    tracks_response.forEach((currTrack) => {
                                        let flagMsg = null
                                        if((currTrack.hasOwnProperty('track')) == false)
                                            flagMsg = 'no property track'
                                        if(currTrack.hasOwnProperty('track') == true && (currTrack.track.hasOwnProperty('artists') == false))
                                            flagMas = 'no property artists'
                                        if(currTrack.hasOwnProperty('track') == true && currTrack.track.hasOwnProperty('artists') == true && currTrack.track.artists.length < 1)
                                            flagMsg = 'no tracks in playlist'
                                        if(flagMsg != null){
                                            res.json({
                                                statusCode: 404,
                                                message: `[${f_name} FAILED with message --${flagMsg}-- from: ${call2}]`,
                                                actualResponse: {is: false},
                                                realResponse: body_apiCall2
                                            })
                                        }
                                        let artists_response = currTrack.track.artists
                                        let artists = ''
                                        artists_response.forEach((currArtist) => {
                                            artists += currArtist.name + ', '
                                        })
                                        artists = artists.slice(0, artists.length-1-1)
                                        let track_id   = currTrack.track.hasOwnProperty('id'  ) ? currTrack.track.id   : 'no id for track'
                                        let track_name = currTrack.track.hasOwnProperty('name') ? currTrack.track.name : 'no name for playlist'
                                        //add to r object
                                        r.tracks.push({
                                            id: track_id,
                                            name: track_name,
                                            artist: artists
                                        })
                                    })//forEach track
                                    res.json({
                                        statusCode: 200,
                                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                        actualResponse: {is: true, data: r},
                                        realResponse: body_apiCall2
                                    })
                                })
                                .catch((err_apiCall2) => {
                                    let sc2 = err.hasOwnProperty('statusCode') ? err_apiCall2.statusCode : 999
                                    let ms2 = err.hasOwnProperty('message'   ) ? err_apiCall2.message    : 'err: no message property'
                                    res.json({
                                        statusCode: sc2,
                                        message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                        actualResponse: {is: false},
                                        realResponse: err_apiCall2
                                    })
                                })//second call to API
                        })
                        .catch((mError) => {    //new AT wasn't created
                            res.json({
                                statusCode: mError.statusCode,
                                message: `[${f_name} FAILED with message --${mError.message}-- from: get_new_AT()]`,
                                actualResponse: {is: false},
                                realResponse: mError
                            })
                        })
                }
                else{
                    let ms = err.hasOwnProperty('message'   ) ? err.message    : 'err: no message property'
                    res.json({
                        statusCode: sc,
                        message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                        actualResponse: {is: false},
                        realResponse: err
                    })
                }
            })//first call to API
        })
        .catch((err_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${err_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: err_getAT
            })
        })
}
//
/** GET /getTopArtists/id
 *  @ gets user id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var getTopArtists = async function(req, res, next){
    let f_name = '/GET getTopArtists', call1 = 'getAT()', call2= 'Spotify_API GET /me/top/artists'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((resolve_getAT) => {
            AT = resolve_getAT
            //
            var options = {
                url: 'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5',
                headers: { 'Authorization': 'Bearer ' + AT },
                json: true
            }
            //call to Spotify API: GET /me/top/artists
            rp(options)
                .then((body_apiCall1) => {
                    let r = {
                        artists: []
                    }
                    let artists_response = body_apiCall1.items
                    artists_response.forEach((currArtist) => {
                        let art_id   = currArtist.hasOwnProperty('id'  ) ? currArtist.id   : 'no id for artist'
                        let art_name   = currArtist.hasOwnProperty('name'  ) ? currArtist.name   : 'no name for artist'
                        let art_popu   = currArtist.hasOwnProperty('popularity'  ) ? currArtist.popularity   : 'no popularity for artist'
                        r.artists.push({
                            id: art_id,
                            name: art_name,
                            popu: art_popu
                        })    
                    })
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        actualResponse: {is: true, data: r},
                        realResponse: body_apiCall1
                    })
                })
                .catch(async (err_apiCall1) => {
                    let sc = err_apiCall1.hasOwnProperty('statusCode') ? err_apiCall1.statusCode : 999
                    //need new AT
                    if(sc == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((resolve_get_new_AT) => {
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${resolve_get_new_AT.access_token.substr(0, 10)}`)
                                //call again
                                options.headers = { 'Authorization': 'Bearer ' + resolve_get_new_AT.access_token }
                                rp(options)
                                    .then((body_apiCall2) => {
                                        let r = {
                                            artists: []
                                        }
                                        let artists_response = body_apiCall2.items
                                        artists_response.forEach((currArtist) => {
                                            let art_id   = currArtist.hasOwnProperty('id'  ) ? currArtist.id   : 'no id for artist'
                                            let art_name   = currArtist.hasOwnProperty('name'  ) ? currArtist.name   : 'no name for artist'
                                            let art_popu   = currArtist.hasOwnProperty('popularity'  ) ? currArtist.popularity   : 'no popularity for artist'
                                            r.artists.push({
                                                id: art_id,
                                                name: art_name,
                                                popu: art_popu
                                            })    
                                        })
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            actualResponse: {is: true, data: r},
                                            realResponse: body_apiCall2
                                        })
                                    })
                                    .catch((err_apiCall2) => {
                                        let sc2 = err_apiCall2.hasOwnProperty('statusCode') ? err_apiCall2.statusCode : 999
                                        let ms2 = err_apiCall2.hasOwnProperty('message'   ) ? err_apiCall2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                            actualResponse: {is: false},
                                            realResponse: err_apiCall2
                                        })
                                    })//second call to API
                            })
                            .catch((reject_get_new_AT) => {    //new AT wasn't created
                                res.json({
                                    statusCode: reject_get_new_AT.statusCode,
                                    message: `[${f_name} FAILED with message --${reject_get_new_AT.message}-- from: get_new_AT()]`,
                                    actualResponse: {is: false},
                                    realResponse: reject_get_new_AT
                                })
                            })
                    }
                    else{
                        let ms = err_apiCall1.hasOwnProperty('message'   ) ? err_apiCall1.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: err_apiCall1
                        })
                    }
                })//first call to API
        })
        .catch((reject_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${reject_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: reject_getAT
            })
        })
}
//
/** GET /artistTopTracks/id&art_id
 *  @ gets user_id & artist_id from querystring
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var artistTopTracks = async function(req, res, next){
    let f_name = 'GET /artistTopTracks/id&art_id', call1 = 'getAT()', call2= 'Spotify_API GET /artists/artist_id/top-tracks'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    const {art_id = null} = req.params
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((resolve_getAT) => {
            AT = resolve_getAT
            //
            let api_url = 'https://api.spotify.com/v1/artists/' + art_id + '/top-tracks?country=IL'
            var options = {
                url: api_url,
                headers: { 'Authorization': 'Bearer ' + AT },
                json: true
            }
            //call to Spotify API: GET /artists/artist_id/top-tracks
            rp(options)
                .then((body_apiCall1) => {
                    let r = {
                        tracks: []
                    }
                    let tracks_response = body_apiCall1.tracks
                    tracks_response.forEach((currTrack) => {
                        //console.log("currArtist" + JSON.stringify(currArtist))
                        r.tracks.push({
                            id: currTrack.id
                        })    
                    })
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        actualResponse: {is: true, data: r},
                        realResponse: body_apiCall1
                    })
                })
                .catch(async (err_apiCall1) => {
                    let sc = err_apiCall1.hasOwnProperty('statusCode') ? err_apiCall1.statusCode : 999
                    //need new AT
                    if(sc == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((resolve_get_new_AT) => {
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${resolve_get_new_AT.access_token.substr(0, 10)}`)
                                //call again
                                options.headers = { 'Authorization': 'Bearer ' + resolve_get_new_AT.access_token }
                                rp(options)
                                    .then((body_apiCall2) => {
                                        let r = {
                                            tracks: []
                                        }
                                        let tracks_response = body_apiCall2.tracks
                                        tracks_response.forEach((currTrack) => {
                                            //console.log("currArtist" + JSON.stringify(currArtist))
                                            r.tracks.push({
                                                id: currTrack.id
                                            })    
                                        })
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            actualResponse: {is: true, data: r},
                                            realResponse: body_apiCall2
                                        })
                                    })
                                    .catch((err_apiCall2) => {
                                        let sc2 = err_apiCall2.hasOwnProperty('statusCode') ? err_apiCall2.statusCode : 999
                                        let ms2 = err_apiCall2.hasOwnProperty('message'   ) ? err_apiCall2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                            actualResponse: {is: false},
                                            realResponse: body_apiCall2
                                        })
                                    })//second call to API
                            })
                            .catch((reject_get_new_AT) => {    //new AT wasn't created
                                res.json({
                                    statusCode: reject_get_new_AT.statusCode,
                                    message: `[${f_name} FAILED with message --${reject_get_new_AT.message}-- from: get_new_AT()]`,
                                    actualResponse: {is: false},
                                    realResponse: reject_get_new_AT
                                })
                            })
                    }
                    else{
                        let ms = err_apiCall1.hasOwnProperty('message'   ) ? err_apiCall1.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: err_apiCall1
                        })
                    }
                })//first call to API
        })
        .catch((reject_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${reject_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: reject_getAT
            })
        })
}
//
/** POST /newPL/id
 *  @ gets user_id from querystring
 *  @ gets from body optional parameters: name/public/collaborative/description
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var newPL = async function(req, res, next){
    let f_name = 'POST /newPL/id', call1 = 'getAT()', call2= 'Spotify_API POST /users/{user_id}/playlists'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    //body data
    const name          = req.body.hasOwnProperty('name'         ) ? req.body.name          : "default name"
    const public        = req.body.hasOwnProperty('public'       ) ? req.body.public        : true
    const collaborative = req.body.hasOwnProperty('collaborative') ? req.body.collaborative : false
    const description   = req.body.hasOwnProperty('description'  ) ? req.body.description   : "some nice description"
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((resolve_getAT) => {
            AT = resolve_getAT
            //
            let api_uri = 'https://api.spotify.com/v1/users/' + id + '/playlists'
            var options = {
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
            }
            //call to Spotify API: POST /users/{pl_id}/playlists
            rp(options)
                .then((body_apiCall1) => {
                    let r = {
                        id: 'error id',
                        name: 'error name'
                    }
                    r.id   = body_apiCall1.hasOwnProperty('id'  ) ? body_apiCall1.id   : 'no id for new playlist'
                    r.name = body_apiCall1.hasOwnProperty('name') ? body_apiCall1.name : 'no name for new playlist'
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        actualResponse: {is: true, data: r},
                        realResponse: body_apiCall1
                    })
                })
                .catch(async (err_apiCall1) => {
                    let sc = err_apiCall1.hasOwnProperty('statusCode') ? err_apiCall1.statusCode : 999
                    //need new AT
                    if(sc == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((resolve_get_new_AT) => {
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${resolve_get_new_AT.access_token.substr(0, 10)}`)
                                //call again
                                options.headers = { 
                                    'content-type': 'application/json',
                                    'Authorization': 'Bearer ' + resolve_get_new_AT.access_token
                                }
                                rp(options)
                                    .then((body_apiCall2) => {
                                        let r = {
                                            id: 'error id',
                                            name: 'error name'
                                        }
                                        r.id   = body_apiCall2.hasOwnProperty('id'  ) ? body_apiCall2.id   : 'no id for new playlist'
                                        r.name = body_apiCall2.hasOwnProperty('name') ? body_apiCall2.name : 'no name for new playlist'
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            actualResponse: {is: true, data: r},
                                            realResponse: body_apiCall2
                                        })
                                    })
                                    .catch((err_apiCall2) => {
                                        let sc2 = err_apiCall2.hasOwnProperty('statusCode') ? err_apiCall2.statusCode : 999
                                        let ms2 = err_apiCall2.hasOwnProperty('message'   ) ? err_apiCall2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                            actualResponse: {is: false},
                                            realResponse: err_apiCall2
                                        })
                                    })//second call to API
                            })
                            .catch((reject_get_new_AT) => {    //new AT wasn't created
                                res.json({
                                    statusCode: reject_get_new_AT.statusCode,
                                    message: `[${f_name} FAILED with message --${reject_get_new_AT.message}-- from: get_new_AT()]`,
                                    actualResponse: {is: false},
                                    realResponse: reject_get_new_AT
                                })
                            })
                    }
                    else{
                        let ms = err_apiCall1.hasOwnProperty('message'   ) ? err_apiCall1.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: err_apiCall1
                        })
                    }
                })//first call to API
        })
        .catch((reject_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${reject_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: reject_getAT
            })
        })
}
//
/** PUT /addToPL/id&pl_id
 *  @ gets user_id & pl_id from querystring
 *  @ gets from body optional parameters: uris[spotify:track:track_id, ...]
 *  @ returns res.json():
 *  @ success   :   {status, message, actualResponse, realResponse}
 *  @ failure   :   {status, message, actualResponse, realResponse}
 *  @ actualRespone {is: false} OR {is: true, data: what_you_want}
 */
var addToPL = async function(req, res, next){
    let f_name = '/PUT addToPL/id&pl_id', call1 = 'getAT()', call2= 'Spotify_API POST /playlists/{pl_id}/tracks'
    console.log(`starting ${f_name}`)
    const {id = null} = req.params
    const {pl_id = null} = req.params
    //body data
    var default_track = ["spotify:track:1JLLDS0KN1ITeYL9ikHKIr"]
    const uris = req.body.hasOwnProperty('uris') ? req.body.uris : default_track
    //
    //get AT from DB using our funciton
    var AT = 'invalid_AT for user: ' + id
    getAT(id)
        .then((resolve_getAT) => {
            AT = resolve_getAT
            //
            let api_uri = 'https://api.spotify.com/v1/playlists/' + pl_id + '/tracks'
            var options = {
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
            }
            //call to Spotify API: POST /playlists/{pl_id}/tracks
            rp(options)
                .then((body_apiCall1) => {
                    let r = {
                        snap_id: 'error snap_id'
                    }
                    r.snap_id = body_apiCall1.hasOwnProperty('snapshot_id'  ) ? body_apiCall1.snapshot_id   : 'no snap_id for new playlist'
                    res.json({
                        statusCode: 200,
                        message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                        actualResponse: {is: true, data: r},
                        realResponse: body_apiCall1
                    })
                })
                .catch(async (err_apiCall1) => {
                    let sc = err_apiCall1.hasOwnProperty('statusCode') ? err_apiCall1.statusCode : 999
                    //need new AT
                    if(sc == 401){
                        console.log(`   in ${f_name}> AT is invalid from call: ${call2}`)
                        console.log(`   in ${f_name}> will attempt to get new AT for partially user: ${id.substr(0, 5)}`)
                        //get new AT using our function
                        get_new_AT(id)
                            .then((resolve_get_new_AT) => {
                                console.log(`   in ${f_name}> partially new_AT from get_new_AT() is: ${resolve_get_new_AT.access_token.substr(0, 10)}`)
                                //call again
                                options.headers = { 
                                    'content-type': 'application/json',
                                    'Authorization': 'Bearer ' + resolve_get_new_AT.access_token
                                }
                                rp(options)
                                    .then((body_apiCall2) => {
                                        let r = {
                                            snap_id: 'error snap_id'
                                        }
                                        r.snap_id = body_apiCall2.hasOwnProperty('snapshot_id'  ) ? body_apiCall2.snapshot_id   : 'no snap_id for new playlist'
                                        res.json({
                                            statusCode: 200,
                                            message: `[${f_name} SUCCESS with message --success-- from: ${call2}]`,
                                            actualResponse: {is: true, data: r},
                                            realResponse: body_apiCall2
                                        })
                                    })
                                    .catch((err_apiCall2) => {
                                        let sc2 = err_apiCall2.hasOwnProperty('statusCode') ? err_apiCall2.statusCode : 999
                                        let ms2 = err_apiCall2.hasOwnProperty('message'   ) ? err_apiCall2.message    : 'err: no message property'
                                        res.json({
                                            statusCode: sc2,
                                            message: `[${f_name} FAILED with message: --${ms2}-- from_2_: ${call2}]`,
                                            actualResponse: {is: false},
                                            realResponse: err_apiCall2
                                        })
                                    })//second call to API
                            })
                            .catch((reject_get_new_AT) => {    //new AT wasn't created
                                res.json({
                                    statusCode: reject_get_new_AT.statusCode,
                                    message: `[${f_name} FAILED with message --${reject_get_new_AT.message}-- from: get_new_AT()]`,
                                    actualResponse: {is: false},
                                    realResponse: reject_get_new_AT
                                })
                            })
                    }
                    else{
                        let ms = err_apiCall1.hasOwnProperty('message'   ) ? err_apiCall1.message    : 'err: no message property'
                        res.json({
                            statusCode: sc,
                            message: `[${f_name} FAILED with message --${ms}-- from: ${call2}]`,
                            actualResponse: {is: false},
                            realResponse: err_apiCall1
                        })
                    }
                })//first call to API
        })
        .catch((reject_getAT) => {
            res.json({
                statusCode: 404,
                message: `[${f_name} FAILED with message: --${reject_getAT}-- from: ${call1}]`,
                actualResponse: {is: false},
                realResponse: reject_getAT
            })
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
    getTopArtists: getTopArtists,
    artistTopTracks: artistTopTracks,
    newPL: newPL,
    addToPL: addToPL,
    invalidAT: invalidAT
}