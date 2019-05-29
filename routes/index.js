var express = require('express');
var router = express.Router();


router.param('userId', function (req, res, next, userId) {
  req.userId = userId;
  next();

});

router.get('/api/user/:userId', (req, res, next) => {
  if (req.path.indexOf('avatar') != -1) {
    //if we've got /avatar/ in url we're going to next step to do something with img
    next();
  }

  var request = require('request');

  request.get('https://reqres.in/api/users/' + req.userId, function (err, response, body) {
    if (err) console.log(err);
    console.log('statusCode:', response && response.statusCode);
    console.log('body:', body);
    res.json(body);
  });

});

router.get('/api/user/:userId/avatar', (req, res, next) => {
  var fs = require('fs');
  var request = require('request');

  fs.stat('./public/images/' + req.userId + '.jpg', function (err, status) {
    if (err) console.log(err)

    //if img exists
    if (status) {
      var base64Img = fs.readFileSync('./public/images/' + req.userId + '.jpg');
      base64Img = new Buffer.from(base64Img).toString('base64');
      res.send(base64Img);
    } else {
      //if there is no img we will download it
      var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
          request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
      };

      request.get('https://reqres.in/api/users/' + req.userId, function (err, response, body) {
        if (err) console.log(err);
        body = JSON.parse(body);

        download(body.data.avatar, './public/images/' + body.data.id + '.jpg', function () {
          var base64Img = fs.readFileSync('./public/images/' + body.data.id + '.jpg');
          base64Img = new Buffer.from(base64Img).toString('base64');
          res.send(base64Img);
        });
      });

    }
  });
});


router.delete('/api/user/:userId/avatar', (req, res, next) => {
  var fs = require('fs');

  //check img
  fs.stat('./public/images/' + req.userId + '.jpg', function (err, status) {
    if (err) console.log(err)

    //if img exists
    if (status) {
      fs.unlink('./public/images/' + req.userId + '.jpg', (err) => {
        if (err) console.log(err);
        console.log('Deleted');
      });

    } else {
      console.log('There is no such img');
    }
  });

});

//To run cron go to localhost:3000/api/cronStart

router.get('/api/cronStart', (req, res, next) => {
  var cron = require('node-cron');
  var fs = require('fs');
  var request = require('request');
  var page = 1;

  function addData(page) {
    
    fs.stat('./public/users.json', function (err, status) {

      if (err) {
        console.log("TCL: addData -> err", err)
      }
  
      if (status) {
        //if file exists we weill append new page to that
        fs.readFile('./public/users.json', 'utf8', function (err, data) {
          if (err) console.log('Err in read json', err);
          var json = JSON.parse(data);
  
          request('https://reqres.in/api/users?page=' + page, function (err, response, body) {
            if (err) console.log(err);
            var body = JSON.parse(body);


            body.data.forEach(element => {
              json.data.push(element);
            });
  
            fs.writeFile('./public/users.json', JSON.stringify(json), (err) => {
              if (err) console.log(err);
            });
          });
        });
  
      }



    });

  }




  cron.schedule('* * * * * *', () => {
    addData(page);
    page++;
    console.log("TCL: page", page)
  });

});

module.exports = router;