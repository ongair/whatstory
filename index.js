var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var uploader = require('./uploader');
var upload = multer();
var app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.set('port', (process.env.PORT || 8081));


app.post('/stories', upload.single('file'), function(req, res) {  
  if (req.file != null) {
    upload = req.file;
    uploader.process(upload, res);
  }
  else
    res.status(422).json({ error: 'No export file was provided'}); 
});

app.get('/stories/:id/status', function(req, res) {
  uploader.status(req.params.id, res);
});

app.get('/stories', function(req, res) {
  uploader.fetch(res);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});