var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var uploader = require('./uploader');
var app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var upload = multer();
console.log('Set up multer');

app.set('port', (process.env.PORT || 5000));


app.post('/stories', upload.single('file'), function(req, res) {
  console.log("File is ", req.file);
  
  if (req.file != null) {
    upload = req.file;

    result = uploader.process(upload);
    console.log("Result is ", result);

    if (result['success'])
      res.status(200).json({ success: true });
    else
      res.status(500).json({ message: result['message'] });
  }
  else
    res.status(422).json({ error: 'No export file was provided'}); 
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});