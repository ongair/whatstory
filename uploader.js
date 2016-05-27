var AWS = require('aws-sdk');
var rand = require("random-key");
var fs = require('fs');

var credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
};

var dynasty = require('dynasty')(credentials);
var stories = dynasty.table('story');

AWS.config.region = process.env.AWS_REGION;


module.exports = {

  process: function(file, res) {
    // console.log("Processing file", file);
    if (file.mimetype == 'application/zip') {
      
      console.log('About to upload to', process.env.AWS_REGION);      

      var key = rand.generate();
      var s3 = new AWS.S3({ params: { Bucket: process.env.S3_BUCKET, Key: key + ".zip", Metadata: { 'Content-Type' : 'application/zip' } }});

      s3.upload({ Body: file.buffer })
        .on('httpUploadProgress', function(event) {
          console.log("Progress uploading...");
        })
        .send(function(err, data) {
          if (err) {
            console.log("Error: ", err);
            res.status(500).json({ message: err }); 
          }
          else {
            console.log("Uploaded - Data: ", data);

            // save it to the stories table
            stories.insert({ id: key, status: 'new' })
              .then(function(response) {
                res.status(200).json({ success: true, url: data['Location'], key: key });
              });            
          }
        });
      
      // s3.listBuckets(function(err, data) {
      //   if (err) { 
      //     console.log("Error:", err); 
      //     // return { success: false, message: err };
      //     res.status(500).json({ message: err });
      //   }
      //   else {
      //     for (var index in data.Buckets) {
      //       var bucket = data.Buckets[index];
      //       console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
      //     }
      //     // return { success: true };
      //     res.status(200).json({ success: true });
      //   }
      // });      
    }
    else
      res.status(500).json({ message: 'Not a zip file provided' });
  },

  status: function(id, res) {
    stories
      .find(id)
      .then(function(story) {
        // console.log(land);
        res.status(200).json({ success: true, status: story.status });
      });
  },

  fetch: function(res) {
    stories
      .scan()
      .then(function(results) {
        res.status(200).json({ results });
      });
  }
}