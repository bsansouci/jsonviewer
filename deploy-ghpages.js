var ghpages = require('gh-pages');
var fs = require('fs');
var path = require('path');

function copyFolder( source, target ) {
  files = fs.readdirSync( source );
  files.forEach( function ( file ) {
    fs.createReadStream(path.join( source, file ))
      .pipe( fs.createWriteStream(path.join( target, file )) );
  } );
}

copyFolder('assets','dist');
ghpages.publish('./dist', console.error.bind(console));
