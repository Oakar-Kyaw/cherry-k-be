
exports.loop = (length, fn) => {
    for(let i=0; i< length ; i++){
        fn(i)
    }
    
}