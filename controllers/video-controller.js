const fs = require('fs')
const { dirname } = require('path')
const path = require('path');
let uploads = {}
module.exports = {
  videoFetch:async(req,res)=>{
    const directoryPath =  './public/Temp';

    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
    console.log(files,'files')
      res.json(files)
    });
  }
}