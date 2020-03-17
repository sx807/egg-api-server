'use strict';

const Service = require('egg').Service;

class SqlService extends Service {
  constructor(ctx) {
    super(ctx);
  }

  // 函数调用图相关
  async get_edge_num(table, path1, path2){
    // SELECT SUM(COUNT) FROM `#{$sql_solist}` USE INDEX(F_path) WHERE F_path='#{$sline[i]}' AND C_path LIKE '#{$sline[j]}%'")
    const sql = `select sum(count) from \`${table}\` use index(f_path) where f_path = '${path1}' and c_path like '${path2}%';`
    const result = await this.app.mysql.query(sql);
    return result
  }

  async get_fun_list(table, list, file){
    const sql = `select ${list} from \`${table}\` where f_dfile='${file}';`
    // console.log(sql)
    const result = await this.app.mysql.query(sql);
    return result
  }

  async get_path_list(table, list){
    const sql = `select ${list} from \`${table}\` group by ${list} order by length(${list}) asc;`
    // console.log(sql)
    const result = await this.app.mysql.query(sql);
    return result
  } 

  // 函数调用表相关
  async get_tar_fun(table, sou, tar){
    // SELECT C_path, COUNT FROM `#{$sql_solist}` WHERE F_path=\"#{s_dir}\" AND C_path LIKE \"#{d_dir}%\"
    const sql = `select * from \`${table}\` where f_path like '${sou}' and c_path like '${tar}%';`
    const result = await this.app.mysql.query(sql);
    return result
  }

  async get_fun(table, name, file) {
    const sql = `select * from \`${table}\` where f_name='${name}' and f_dfile='${file}';`
    // console.log(sql)
    const result = await this.app.mysql.query(sql);
    return result
  }

  async get_call_by_id(table, s_id, t_id){
    const sql = `select cd_line from \`${table}\` where f_point=${s_id} and c_point=${t_id};`
    // console.log(sql)
    const result = await this.app.mysql.query(sql);
    return result
  }
}
module.exports = SqlService;