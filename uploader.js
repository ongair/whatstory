module.exports = {

  process: function(file) {
    console.log("Processing file", file);

    if (file.mimetype == 'application/zip') {
      console.log('processing a zip file');
      return { success: true }
    }
    else
      return { success: false, message: 'Not a zip file' };
  }
}