'use strict';

const Service = require('egg').Service;

class SqlService extends Service {
  constructor(ctx) {
    super(ctx);
  }

  async get_edge_num(table, path1, path2){
    // SELECT SUM(COUNT) FROM `#{$sql_solist}` USE INDEX(F_path) WHERE F_path='#{$sline[i]}' AND C_path LIKE '#{$sline[j]}%'")
    const sql = `select sum(count) from \`${table}\` use index(f_path) where f_path = '${path1}' and c_path like '${path2}%';`
    const count = await this.app.mysql.query(sql);
    return count
  }

  async get_fun_list(table, list, file){
    const sql = `select ${list} from \`${table}\` where f_dfile='${file}';`
    // console.log(sql)
    const flist = await this.app.mysql.query(sql);
    return flist
  }

  async get_path_list(table, list){
    const sql = `select ${list} from \`${table}\` group by ${list} order by ${list} asc;`
    // console.log(sql)
    const flist = await this.app.mysql.query(sql);
    return flist
  } 
}

module.exports = SqlService;