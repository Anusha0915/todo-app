



// const obj = require('./modules/math')


// console.log(obj.add(10,6));
// console.log(obj.multiply(10,6));
// console.log(obj.subtract(10,6));



const {add, subtract} = require('./modules/math') //object destructuring


console.log(add(10,6));
//console.log(multiply(10,6));
console.log(subtract(10,6));

