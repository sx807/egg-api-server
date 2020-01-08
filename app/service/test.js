'use strict';

const Service = require('egg').Service;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class HomeService extends Service {
  constructor(ctx) {
    super(ctx);
    this.show();
  }

  async show(query) {
    // console.log(query)
    if (typeof query == 'object' && query.hasOwnProperty('source')){
      const cmd = `./app/public/callgraph-sql.rb -2 / -d ${query.source} ${query.target} -o ./app/public/test.json null linux_${query.version} x86_64 null real`
      await exec(cmd);
      const { stdout, stderr } = await exec('cat ./app/public/test.json');
      // console.log('stdout:', stdout);
      // console.log('stderr:', stderr);
      const result = JSON.parse(stdout.replace('\n', ''))
      return result;
    }
    else{
      return {};
    }  
  }
}

module.exports = HomeService;
