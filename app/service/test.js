'use strict';

const Service = require('egg').Service;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class HomeService extends Service {
  constructor(ctx) {
    super(ctx);
    this.show();
  }

  async show() {
    const { stdout, stderr } = await exec('pwd');
    // console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    // const result = stdout.replace('\n', '');
    const result = await this.app.mysqlshow.select('linux_4-15-18_R_x86_64_FDLIST');
    return result;
  }
}

module.exports = HomeService;
