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

app.use(express.static('public'));


app.set('port', (process.env.PORT || 8081));


app.post('/stories', upload.single('file'), function(req, res) {  
  if (req.file != null) {
    upload = req.file;

    // fake the upload for dev purposes
    if (process.env.NODE_ENV == 'development')
      res.status(200).json({ success: true, key: 'fPWAoWMsMXQag7xa' });
    else
      uploader.upload(upload, res);    
  }
  else
    res.status(422).json({ error: 'No export file was provided'}); 
});

app.post('/worker', function(req, res) {
  story = req.body.Key;
  console.log("Processing story: ", story);
  
  uploader.process(story, res);
});

app.get('/health', function(req, res) {
  res.status(200).json({ success: true });
});

app.get('/stories/:id/status', function(req, res) {
  uploader.get(req.params.id, res);
});

app.get('/stories/:id', function(req, res) {
  uploader.get(req.params.id, res);
});

app.get('/stories', function(req, res) {
  uploader.fetch(res);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  console.log("Environment: ", process.env.NODE_ENV);
});