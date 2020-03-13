var express = require('express');
const Hashids = require('hashids/cjs')
const downloadasset = require('../lib/downloadasset')
var fs = require('fs-extra')
const path= require('path')
const shelljs = require('shelljs')
const executor = require('../lib/executor')
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'KGrid NodeJS Express Runtime' });
});

/* GET INFO */
router.get('/info', function(req, res, next) {
  var protocol = getProtocol(req)
  var infoObj = {}
  infoObj.Status ="Up"
  infoObj.Url =  protocol +"://"+req.get('host')
  res.send(infoObj);
});

router.get('/context', function(req, res,next){
    res.send(global.cxt)
})


router.get('/endpoints', function(req, res, next) {
  var protocol = getProtocol(req)
  var epArray=[]
  for(var key in global.cxt.map){
    epArray.push(protocol+"://"+req.get('host')+'/'+key)
  }
  res.send(epArray)
})

/* POST a deployment descriptor to activate */
router.post('/deployments', function(req, res, next) {
  var targetpath = req.app.locals.shelfPath
  fs.ensureDirSync(targetpath)
  var idPath = "kn"
  var id = ""
  var version = ""
  var endpoint = ""
  var protocol = getProtocol(req)
  if(req.body.artifact==null | req.body.artifact=="" | req.body.entry ==null ){
    res.status(400).send({"Error":"Bad Request"})
  }else {
    // Download resources
    idPath = "kn"+hashid(path.basename(req.body.artifact[0]))
    id = req.body.identifier || idPath
    version = req.body.version || idPath
    endpoint = req.body.endpoint || idPath
    var result = {}
    result.endpoint_url = protocol+"://"+req.get('host')+"/"+idPath
    result.activated = (new Date()).toString()
    Promise.all(downloadasset.download_files(req.body.artifact, targetpath, idPath)).then(function (artifacts) {
      var entryfile = targetpath+ '/'+idPath+'/'+ path.basename(req.body.entry)
      const exec = Object.create(executor)
      if(exec.init(entryfile)){
        global.cxt.map[idPath] = {}
        global.cxt.map[idPath].identifier = id
        global.cxt.map[idPath].version = version
        global.cxt.map[idPath].endpoint = endpoint
        global.cxt.map[idPath].src = entryfile
        global.cxt.map[idPath].executor = exec
        fs.writeJSONSync(path.join(req.app.locals.shelfPath,'context.json'), global.cxt.map,{spaces: 4} )
        res.json(result);
      } else {
        downloadasset.cleanup(targetpath, idPath)
        res.status(404).send({"Error":'Cannot find the dependency. Please install the dependency first.'})
      }
    })
    .catch(errors => {
      setTimeout(()=> {
        downloadasset.cleanup(targetpath, idPath)
        res.status(404).send({"Error":'Cannot download '+errors})
      }, 500)
    });
  }
});

/* POST dependencies to install*/
router.post('/dependencies', function(req, res, next) {
  var targetpath = req.app.locals.shelfPath
  fs.ensureDirSync(targetpath)
  if(req.body.dependencies){
    shelljs.cd(targetpath)
    var hasError = false
    for(var key in req.body.dependencies){
        if(req.body.dependencies[key].startsWith('http') | req.body.dependencies[key].startsWith('https')){
          if(shelljs.error(shelljs.exec('npm install --save '+req.body.dependencies[key]))) {
            hasError = true
          }
        } else {
          if(shelljs.error(shelljs.exec('npm install --save '+key))) {
            hasError = true
          }
        }
      }
      if(hasError){
        res.status(400).send({"Error":"Failed installing dependencies"})
      } else {
        res.send({"Info":"Dependencies installed."})
    }
  } else {
    res.status(400).send({"Error":"No dependency specified."})
  }
})

router.get('/mem', function(req, res, next){
  const used = process.memoryUsage();
  // for (let key in used) {
  //   console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  // }
  res.send(used)
})

router.post('/:ep', function(req, res, next) {
  if(global.cxt.map[req.params.ep]){
    processEndpointwithGlobalCxtExecutor(req.params.ep, req.body).then(function(output){
      output.request_id=req.id
      res.send(output)
    }).catch(function(error){
      res.status(400).send({"Error":error})
    })
  } else {
    res.status(404).send({"Error": 'Cannot found the endpoint: '+req.params.ep})
  }
});

function hashid(filename){
  var ts = new Date()
  const hashids = new Hashids(ts.toString()+filename, 10)
  return hashids.encode(1,2)
}

function getProtocol(req) {
  var protocol = "https"
  if(process.env.NODE_ENV){
    if(process.env.NODE_ENV.toLowerCase() == "dev") {
      protocol = req.protocol
    }
  }
  return protocol
}

function processEndpointwithGlobalCxtExecutor(key, input){
  var func = global.cxt.getExecutor(key)
  var output = {}
  return new Promise((resolve, reject)=>{
    func.execute(input).then(function(data){
        output.result = data
        resolve(output);
      }).catch(error=>{
        reject(error)
      })
    })
}

module.exports = router;
