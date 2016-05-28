var aws = require('aws-sdk');
var rand = require("random-key");
var fs = require('fs');
var Zip = require('adm-zip');

var credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,  
};

var dynasty = require('dynasty')(credentials);
var stories = dynasty.table('story');

aws.config.region = process.env.AWS_REGION;

// Utils
if (!Array.prototype.last){
  Array.prototype.last = function(){
    return this[this.length - 1];
  };
};

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search, replacement) {  
    return this.replace(new RegExp(search, 'g'), replacement);
  };
};


module.exports = {

  upload: function(file, res) {
    // console.log("Processing file", file);
    if (file.mimetype == 'application/zip') {
      
      console.log('About to upload to', process.env.AWS_REGION);      

      var key = rand.generate();
      var s3 = new aws.S3({ params: { Bucket: process.env.S3_BUCKET, Key: key + ".zip", Metadata: { 'Content-Type' : 'application/zip' } }});

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
            stories.insert({ id: key, status: 'new', created_at: new Date() })
              .then(function(response) {

                // send a message to SQS
                var sqs = new aws.SQS();
                var msg = { Key: key };
                var params = { MessageBody: JSON.stringify(msg), QueueUrl: process.env.SQS_QUEUE_URL };

                sqs.sendMessage(params, function(err, data) {
                  if (err)
                    console.log("Error posting to SQS", err);
                  else {
                    res.status(200).json({ success: true, url: data['Location'], key: key });
                  }
                });                
              });            
          }
        });     
    }
    else
      res.status(500).json({ message: 'Not a zip file provided' });
  },

  get: function(id, res) {
    stories
      .find(id)
      .then(function(story) {
        res.status(200).json({ success: true, status: story.status, messages: story.messages });
      });
  },

  fetch: function(res) {
    stories
      .scan()
      .then(function(results) {
        res.status(200).json({ results });
      });
  },


  process: function(story_id, res) {
    console.log("Processing : ", story_id); 

    var self = this;
    var start = new Date();
    
    stories
      .find(story_id)
      .then(function(story) {
        if (story.status == 'new') {
          // start the processing of the job
          var s3 = new aws.S3();

          s3.getObject({ Bucket: process.env.S3_BUCKET, Key: story_id + ".zip" },
            function(err, data) {
              if (err)
              {
                console.log("Error: ", err);
                res.status(500).json({ success: false, error: err, message: 'Failed when getting S3 item'});
              }
              else {
                
                // console.log("Data: ", data);
                zip = new Zip(data['Body']);
                zip.getEntries().forEach(function(zipEntry) {
                  // console.log("File: ", zipEntry.entryName);

                  if (zipEntry.entryName == "_chat.txt") {
                    // we are processing the message file
                    messages = self.parse(zipEntry);
                    
                    // update the db
                    stories
                      .update(story_id, { status: 'ready', messages: messages })
                      .then(function(resp) {
                        var end = new Date();
                        var duration = (end - start)/1000;    
                        console.log("Processed in " + duration + " seconds");

                        res.status(200).json({ success: true, duration: duration });
                      });
                    
                  }
                });
              }
            });
        } 
        else
          res.status(200).json({ success: true });
      });
  },

  parse: function(file) {
    text = file.getData().toString();
    lines = text.match(/^.*((\r\n|\n|\r)|$)/gm);

    messages = [];   

    for(var idx=0;idx<lines.length;idx++) {
      line = lines[idx];
      message = this.format(line);
      
      if (message.author && message.date) {
        messages.push(message);
      }
      else {
        msg = messages.last()
        msg.text += "\r\n";
        msg.text += message.text;
      }
    }    
    return messages;
  },

  format:  function(line) {
    date_regex = /\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{1,2}:\d{2}.{3}?/;

    date = line.match(date_regex);
    var author, text;
    if (date) {
      date = Date.parse(date.toString());

      body_block = line.split(date_regex).last();
      author_regex = /^:.*?:/;

      author = body_block.match(author_regex);

      if (author) {
        author = author.toString().replaceAll(':', '').trim();
        
      }
      text = body_block.split(author_regex).last().replaceAll('\r\n','').trim()
    }
    else 
      text = line;

    return {
      author: author,
      date: date,
      text: text
    };
  }
}