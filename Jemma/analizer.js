'use strict';
const fs = require('fs');
const applicationsList = require("../sourceFormatted/scheduling_preliminary_a_app_resources_20180606.json").data;
const istanceList = require("../sourceFormatted/scheduling_preliminary_a_instance_deploy_20180606.json").data;
const serverList = require("../sourceFormatted/scheduling_preliminary_a_machine_resources_20180606.json").data;
const conflictList = require("../sourceFormatted/scheduling_preliminary_a_app_interference_20180606.json").data;
const countAppList = require("./localDataFormatted/countAppA.json").data;
const typeServer = [];
let countTot = 0;
let trovato = 0;
countAppList.forEach(el => {
    countTot += el.count;
});
let sum = 0.0;
applicationsList.forEach(el1 => {
    let local_sum = 0.0;
    el1
        .cpu
        .forEach(el2 => {
            local_sum += el2;
        })
    local_sum = local_sum / applicationsList[0].cpu.length;
    countAppList.forEach(el2 => {
        if (el2.id_app == el1.id_app) {
            sum += local_sum * el2.count;
        }
    })
})
serverList.forEach(el => {
    const type = el.ram + '-' + el.cpu + '-' + el.memory;
    trovato = 1;
    typeServer.forEach(el2 => {
        if (el2.type == type) {
            el2.count++;
            trovato = 0;
        }
    })
    if (trovato == 1) {
        typeServer.push({type: type, count: 1});
    }
})
countAppList.sort((el1, el2) => {
    if (el1.count > el2.count) 
        return -1;
    if (el1.count < el2.count) 
        return 1;
    return 0;
})
console.log('Tipi server:') //identificazione tipi server
typeServer.forEach(el => {
    console.log(`Prestazioni: ${el.type} quantità: ${el.count}`);
})
//console.log(typeServer);

console.log('\n\nMedia potenza cpu x server: ' + sum / serverList.length); //caso migliore
console.log('Massimo per app: ' + countAppList[0].count);
console.log('Timeline: ' + applicationsList[0].cpu.length + ' secondi');
console.log('Operazioni da smistare: ' + countTot); //identificazione numero operazioni da smistare
console.log('Operazioni medie x server: ' + countTot / serverList.length)
console.log('Server a disposizione: ' + serverList.length); //identificazione numero server a disposizione