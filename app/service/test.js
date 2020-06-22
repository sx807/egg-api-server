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
    const start = Date.now()
    if (typeof query == 'object' && query.hasOwnProperty('source')){
      let cmd = `./app/public/callgraph-sql.rb -2 / -d ${query.source} ${query.target} -o ./app/public/test.graph null linux_${query.version} x86_64 null real`
      await exec(cmd);
      cmd = `dot -Tsvg ./app/public/test.graph -o ./app/public/test.svg`
      await exec(cmd);
      const { stdout, stderr } = await exec('du -h ./app/public/test.svg');
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
      // const result = JSON.parse(stdout.replace('\n', ''))
      const result = {
        time_cost : Date.now() - start,
        data_size : stdout.replace('\n', '').split(' ')[0]
      }
      // this.data.time_cost = Date.now() - start
      return result;
    }
    else{
      return {};
    }  
  }
}

module.exports = HomeService;
