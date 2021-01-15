'use strict';

const Service = require('egg').Service

class HistoryService extends Service {
    constructor(ctx) {
        super(ctx)
        // history type
        // 0 undefined
        // 1 graph
        // 2 function
        // 3 option
    }

    async has_history(id, type) {
        const list = await this.service.sqls.exist_history(id, type)
        // console.log('history:', JSON.parse(JSON.stringify(list)).length)
        
        if (JSON.parse(JSON.stringify(list)).length > 0)return true
        return false
    }
    
    async get_history(id, type) {
        // console.log(history[id].data.nodes.length)
        const res = await this.service.sqls.get_history_data(id, type)

        const tmp = {
            data: JSON.parse(res.data),
            expanded: JSON.parse(res.expanded)
        }
        // console.log(tmp.expanded)
        return tmp
    }

    async save_history(type, data) {
        // console.log(Object.keys(history))
    
        await this.service.sqls.add_history(data.id, type, data)
        
        return
      }

      async add_history_expanded(id, type, nodeid, data) {
        // console.log(id,Object.keys(history[id].expanded))
        this.service.sqls.update_history_expanded(id, type, nodeid, data)
        
        return
      }

}

module.exports = HistoryService;

