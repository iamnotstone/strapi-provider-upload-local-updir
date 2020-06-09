'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const fs = require('fs');
const path = require('path');

module.exports = {
  init({ sizeLimit = 1000000 } = {}) {
    const verifySize = file => {
      if (file.size > sizeLimit) {
        throw strapi.errors.badRequest('FileToBig', {
          errors: [
            {
              id: 'Upload.status.sizeLimit',
              message: `${file.name} file is bigger than limit size!`,
              values: { file: file.name },
            },
          ],
        });
      }
    };

    return {
      upload(file) {
        verifySize(file);
        let localPath
        let baseUrl = '/uploads'
        if(file.path){
          baseUrl = baseUrl + '/' + file.path
          let baseFullPath = path.join(strapi.config.paths.static, baseUrl)
          if(!fs.existsSync(baseFullPath)){
            return Promise.reject('wrong path')
          }
        }

        if(file.updir){
          let dir = path.join(strapi.config.paths.static, `${baseUrl}/${file.updir}`)
          if(!fs.existsSync(dir))
            fs.mkdirSync(dir)
          localPath = path.join(dir, `/${file.hash}${file.ext}`)
        }
        else
          localPath = path.join(strapi.config.paths.static, `${baseUrl}/${file.hash}${file.ext}`)


        return new Promise((resolve, reject) => {
          // write file in public/assets folder
          fs.writeFile(
            localPath,
            file.buffer,
            err => {
              if (err) {
                return reject(err);
              }
              if(file.updir)
                file.url = `${baseUrl}/${file.updir}/${file.hash}${file.ext}`
              else
                file.url = `${baseUrl}/${file.hash}${file.ext}`;

              resolve();
            }
          );
        });
      },
      delete(file) {
        let baseUrl = '/uploads'
        if(file.path){
          baseUrl = baseUrl + '/' + file.path
        }
        return new Promise((resolve, reject) => {
          let filePath
          if(file.updir){
            filePath = path.join(strapi.config.paths.static, `${baseUrl}/${file.updir}`)

            if(!fs.existsSync(filePath))
              return resolve("Directory doesn't exist")

            fs.rmdir(filePath, {recursive: true}, (err) => {
              if(err)
                return reject(err);
              resolve();
            })
          }else{
            filePath = path.join(
              strapi.config.paths.static,
              `${baseUrl}/${file.hash}${file.ext}`
            );

            if (!fs.existsSync(filePath)) {
              return resolve("File doesn't exist");
            }

            // remove file from public/assets folder
            fs.unlink(filePath, err => {
              if (err) {
                return reject(err);
              }

              resolve();
            });

          }
        });
      },
    };
  },
};
