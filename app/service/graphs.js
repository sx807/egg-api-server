'use strict';

const Service = require('egg').Service
const path = require("path")
const crypto = require('crypto')

let history = {}
let share_data = {}

class GraphService extends Service {
  constructor(ctx) {
    super(ctx)
    this.table = {
      fd : 'test',
      so : 'test'
      // s : 'linux_' + String(params.version) + '_R_x86_64_SLIST'
    }
    this.options = {
      per: 1,
      group: 1,
      expanded: ''
    }
    this.data = {
      id: '',
      nodes: [],
      edges: []
      // groups:[]
    }
    // this.t1 = new Date().getTime();
    // this.t2 = this.t1
  }

  async show(params) {
    const res = await this.service.sqls.get_share_data(params.id)
    return res.data
  }

  async test(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    const { ctx } = this;

    this.table.fd = 'linux_' + params.version + '_R_' + params.platform + '_FDLIST';
    this.table.so = 'linux_' + params.version + '_R_' + params.platform + '_SOLIST';
    const id = params.version + ' ' + params.platform  + ' ' + params.source + ' ' + params.target
    await this.setoptions(params)
    if(params.expand) {
      await this.expands_data(params)
    } else {
      if (await this.is_history(id) && this.options.per) {
        ctx.logger.info(id + ' has history')
        const res = await this.get_history(id)
        return res.data
      }
      await this.normal_data(params)
    }

    return this.data
  }

  async create(params) {
    // console.log(params.data.nodes)
    const md5 = crypto.createHash('md5')
    const date = Date.now()
    const id = params.config.version + ' ' +
               params.platform + ' ' + 
               params.config.source + ' ' + 
               params.config.target  + ' ' + 
               date.toString()
    const share_kay = md5.update(id).digest('hex')
    const data = {
      id: id,
      date: date,
      config: params.config,
      data: params.data
    }
    this.service.sqls.add_share(share_kay,data)
    return share_kay;
  }

  async expand_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log('expand')
    let expanded = []
    const id = config.id
    this.data.id = id
    const nodeid = config.expand
    log = log + ' expand ' + nodeid
    // console.log(config)
    await this.setoptions({ per: 0 })
    if(this.options.expanded !== '') expanded = this.options.expanded.split(',')

    list = await this.path(nodeid,3)
    this.nodes(list)
    const connect_node = await this.seach_history(id, nodeid, expanded)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    // console.log(connect_node)
    await this.edges_async(list, connect_node.tar)
    await this.edges_async(connect_node.sou, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    ctx.logger.info(log)
  }

  async normal_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log(config)
    const id = config.version + ' ' + config.platform + ' ' + config.source + ' ' + config.target
    
    this.data.id = id
    // console.log(this.options)

    list = await this.paths(config)
    this.nodes(list)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    await this.edges_async(list, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    // if(this.options.per) this.save_history(this.data)

    ctx.logger.info(log)
    this.data.time_cost = Date.now() - start
    return this.data
  }

  async expands_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log('expand')
    let expanded = []
    const id = config.id
    this.data.id = id
    const nodeid = config.expand
    log = log + ' expand ' + nodeid
    // console.log(config)
    await this.setoptions(config)
    await this.setoptions({ per: false })
    if(this.options.expanded !== '') expanded = this.options.expanded.split(',')

    list = await this.path(nodeid,3)
    this.nodes(list)
    const connect_node = await this.seach_history(id, nodeid, expanded)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    // console.log(connect_node)
    await this.edges_async(list, connect_node.tar)
    await this.edges_async(connect_node.sou, list)
    // await this.edges_async(list, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    ctx.logger.info(log)
    this.add_history_expanded(id,nodeid,this.data.nodes)
  }

  async is_history(id) {
    const list = await this.service.sqls.exist_history(id)
    console.log('history:', JSON.parse(JSON.stringify(list)).length)
    
    // console.log(history.hasOwnProperty(id))
    if (JSON.parse(JSON.stringify(list)).length > 0)return true
    return false
  }

  async get_history(id) {
    // console.log(history[id].data.nodes.length)
    const res = await this.service.sqls.get_history_data(id)

    const tmp = {
      data: JSON.parse(res.data),
      expanded: JSON.parse(res.expanded)
    }
    // console.log(tmp.expanded)
    return tmp
  }

  async seach_history(id, nodeID, expanded) {
    let expand = [nodeID]
    let tmp = {
      sou: [],
      tar: []
    }

    let history = await this.get_history(id)
    // console.log(edges)
    // console.log(history)
    for (const i of Object.keys(expanded)) {
      let key = expanded[i]
      console.log(key)
      if (nodeID.indexOf(key) === 0) {
        console.log(nodeID, key)
        expand.push(key)
        console.log(JSON.parse(history.expanded[key]))
        tmp.sou = tmp.sou.concat(JSON.parse(history.expanded[key]))
        tmp.tar = tmp.tar.concat(JSON.parse(history.expanded[key]))
      }
    }
    console.log(expanded, tmp)
    for (let edge of history.data.edges) {
      if (expand.includes(edge.source)) {
        // console.log(edge.source, expanded.includes(edge.source))
        if (expanded.includes(edge.target)) {
          // console.log(edge.target, JSON.parse(history.expanded[edge.target]))
          tmp.tar = tmp.tar.concat(JSON.parse(history.expanded[edge.target]))
        } else {
          tmp.tar.push({
            id: edge.target,
            type: edge.type
          })
        }
      }
      if (expand.includes(edge.target)) {
        // console.log(edge)
        if (expanded.includes(edge.source)) {
          // console.log(edge.source, expanded.includes(edge.source))
          tmp.sou = tmp.sou.concat(JSON.parse(history.expanded[edge.source]))
        } else {
          tmp.sou.push({
          id: edge.source,
          type: edge.type
        })
        }
        
      }
    }
    if (expand.length > 1) {
      for (const key of expand) {
        console.log('del', key)
        let i = tmp.sou.findIndex((item) => item.id === key)
        if (i > 0) {
          tmp.sou.splice(i, 1)
        }
        i = tmp.tar.findIndex((item) => item.id === key)
        if (i > 0) {
          tmp.tar.splice(i, 1)
        }
      }
    }
    
    // console.log(tmp)
    return tmp
  }

  async save_history(data) {
    // console.log(Object.keys(history))
    history[data.id] = {}
    history[data.id].data = data

    await this.service.sqls.add_history(data.id,data)
    
    return
  }

  async add_history_expanded(id,nodeid,data) {
    // console.log(id,Object.keys(history[id].expanded))
    this.service.sqls.update_history_expanded(id,nodeid,data)
    
    return
    // console.log(id,Object.keys(history[id].expanded))
  }

  async setoptions(set){
    const keys = Object.keys(set)
    for (let key of keys) {
      if(this.options.hasOwnProperty(key)) {
        // console.log(Number(set[key]),String(set[key]))
        if(key === 'per'){
          this.options[key] = Number(set[key])
        } else {
          this.options[key] = String(set[key])
        }
        
        // console.log(key,this.options[key],Boolean(set[key]))
      }
    }
  }

  async nodes(list){
    for (let item of list){
      if (item.id != '') {
        this.data.nodes.push(item)
      }
      // data.nodes.push(tmp)
    }
  }

  async edges(list){
    for (let sou of list){
      for (let tar of list){
        if(sou != tar){
          if (false){
            // tar /x/x.c/fun
          }
          else{
            // tar /x/x /x.c
            let s = sou
            if(sou.indexOf('.') < 0){
              s = sou + '/'
            }
            // console.log(s,tar)
            await this.edge(s,tar)
          }
        }
      }
    }
  }

  async edges_async(sou_list, tar_list){
    const _s = this
    let promises = []
    for (let sou of sou_list){
      for (let tar of tar_list){
        if(sou.id != tar.id){
          promises.push(new Promise(async function(resolve, reject) {
            await _s.edge(sou,tar)
            resolve()
          }))
        }
      }
    }
    // console.log(promises.length)
    await Promise.all(promises);
  }

  async edge(sou,tar){
    // console.log(sou,tar)
    let s = sou.id
    let t = tar.id
    if(s.indexOf('.') < 0){
      s = s + '/'
    }
    let sql_res = await this.service.sqls.get_edge_num(this.table.so,s.slice(1),t.slice(1))
    let val = JSON.parse(JSON.stringify(sql_res))[0]['sum(count)']
    if (Number(val)>0){
      // console.log(val)
      let tmp = {
        source: sou.id,
        target: tar.id,
        sourceWeight: val,
        type: tar.type
        // groupId: 'test'
      }
      this.data.edges.push(tmp)
      // data.edges.push(tmp)
    }
    // console.log(t)
  }

  async tojson(){

  }

  async paths(p){
    let res = []
    if (p.source ===  p.target){
      res = await this.path(p.source,0)
      // res = res.filter(item => !(this.isrootpath(p.source,item.id) || this.isrootpath(p.target,item.id)))
    }
    else if (p.source === '/') {
      let path1 = await this.path(p.source,0)
      let path2 = await this.path(p.target,1)
      res = res.concat(path1, path2)
    }
    else if (p.target === '/') {
      let path1 = await this.path(p.source,0)
      let path2 = await this.path(p.target,1)
      res = res.concat(path2, path1)
    }
    else {
      let path1 = await this.path(p.source,0)
      let path2 = await this.path(p.target,1)
      res = res.concat(path1, path2)
    }
    res = await this.unique_obj(res)
    
    // res = res.filter(item => !(this.isrootpath(p.source,item.id) || this.isrootpath(p.target,item.id)))
    // console.log(res)
    return res
  }

  isrootpath(path,root){
    let res = false
    if(path != '/'  && path.indexOf(root) == 0){
      res = true
    }
    return res
  }

  async path(str,type){
    const path_input = path.normalize(str)
    // console.log(path.parse(path_input))
    let path_per = path.parse(path_input).dir
    let res = []
    
    if (path.parse(path_input).ext != '') {
      // .x file
      console.log('1 ' + path_input)
      let list = await this.service.sqls.get_fun_list(this.table.fd,'f_dfile, f_name', path_input.slice(1))
      for (let item of list) {
        let tmp = {}
        tmp.id = '/' + item.f_dfile + '/' + item.f_name
        tmp.type = type
        // tmp.groupId = path.parse(tmp.id).dir
        // this.group(tmp.groupId)
        // let p = '/' + item.f_dfile + '/' + item.f_name
        
        res.push(tmp)
      }
      //per path
      if(this.options.per){
        // console.log('1 per ' + path_input)
        res = res.concat(await this.path(path_per,2))
      }

    } else if (path.parse(path_per).ext === '') {
      // /x dir
      console.log('2 ' + path_input)
      // t.push(path.parse(path_in).dir)
      let list = await this.service.sqls.get_path_list(this.table.fd,'f_dfile')
      for (let item of list){
        let p = '/' + item.f_dfile
        let tmp = {}
        if (p.indexOf(path_input) == 0){
        // if (path_input != '/' && p.indexOf(path_input) == 0){
          // x/...
          if(p.slice(path_input.length + 1).indexOf('/') > 0){
            p = p.slice(0,p.indexOf('/',path_input.length + 1))
            // console.log(p)
          }
          tmp.id = p
          tmp.type = type
          // tmp.groupId = path.parse(tmp.id).dir
          // console.log('2.1 ' + p)

        }
        else if (p.indexOf(path_per) == 0 && this.options.per){
          // console.log('2 per ' + )
          tmp.id = p.slice(0,p.indexOf('/',path_per.length + 1))
          tmp.type = 2
          // console.log(path.parse(tmp.id))
          // tmp.groupId = path.parse(tmp.id).dir
          // console.log('2.2 ' + p)
        }

        if(Object.keys(tmp).length > 0 && res.findIndex((item) => item.id === tmp.id) < 0){
          // this.group(tmp.groupId)
          res.push(tmp)
        }
      }
    } else {
      // /xx/xx.x/xxxx
      console.log('3 ' + path_input)
      let tmp = {}
        tmp.id = path_input
        tmp.type = type
        res.push(tmp)
    }

    const result = await this.unique_obj(res)
    // console.log(res)
    // console.log(result)
    return result
  }

  async group(id) {
    if (this.data.groups.findIndex((item) => item.id === id) < 0) {
      let tmp = {
        id: id,
        title: id
      }
      // if (this.options.per) {
      //   tmp.parentId = path.parse(id).dir
      // }
      this.data.groups.push(tmp)
    }
  }

  async unique (arr) {
    return Array.from(new Set(arr))
  }

   async unique_obj (arr) {
    let obj ={}
    return arr.reduce((cur,next) => {
      obj[next.id] ? "" : obj[next.id] = true && cur.push(next);
      return cur;
    },[])
  }

  async per_path(p){
    return path.parse(path.normalize(p)).dir + '/'
  }

  pathtojson(str) {
    let tmp = str.split('/')
    // let tmp = path.parse(str);
    let root  = {}
    let tree = {}
    let t
    for (let i in tmp){
      if (i == 0) {
        t = tmp[i]
        tree[t]={}
      }
      else if (i%2){
        // root[tmp[i]] = tree
        tree[tmp[i]] = root
      }
      else{
        // tree[tmp[i]] = root
        root[tmp[i]] = tree
      }
      
    }
    return root
  }

}

module.exports = GraphService;

