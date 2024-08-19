const cache = require('memory-cache');

class CacheHelper {
    constructor(){
        if(!CacheHelper.instance) CacheHelper.instance = this
        return CacheHelper.instance
    }
    get(key){
        return cache.get(key)
    }
    set(key,value){
        return cache.put(key, value, 10 * 60000);
    } 
    clearAll(){
        return cache.clear();
    }
}

module.exports = new CacheHelper();