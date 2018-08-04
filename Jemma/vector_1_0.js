'use strict';
const fs = require('fs');
const files = ['A', 'B'];
const limitServer = [
    {
        cpuLimit: 35.5, //36
        averageCpuLimit: 0
    }, {
        cpuLimit: 47.5, //48
        averageCpuLimit: 0
    }
]
limitServer[0].averageCpuLimit = limitServer[0].cpuLimit * 0.9;
limitServer[1].averageCpuLimit = limitServer[1].cpuLimit * 0.9;
files.forEach(file => {
    let globalConst;
    if (file == 'A') {
        globalConst = limitServer[0];
    } else {
        globalConst = limitServer[1];
    }
    const path = `./metaElaborated/formatted_${file}.json`;
    const inputData = require(path);
    const serverList = [];
    let serverRimasti = 0;
    inputData
        .serverType
        .forEach(el => {
            serverRimasti += el.count;
        })
    while (inputData.selfBlakList.length != inputData.app_identity.length) {
        let local_server = {
            type_index: 0,
            cpu: [],
            ram: [],
            memory: 0,
            pm: 0,
            m: 0,
            p: 0,
            appList: []
        }
        for (let i = 0; i < inputData.serverType.length; i++) {
            if (inputData.serverType[i].count > 0) {
                local_server.type_index = i;
                i = inputData.serverType.length;
            }
        }
        //inizialization server
        for (let i = 0; i < inputData.app_identity[0].resource.ram.length; local_server.cpu.push(0), local_server.ram.push(0), i++) 
        ;
        let vectorApp = creaLista(inputData.app_identity.length, inputData.selfBlakList, inputData.app_identity); //dal più pesante al piu leggero
        const priority = [];
        for (let i = 0; i < vectorApp.length; i++) {
            let local_average_ram = 0;
            let local_average_cpu = 0;
            for (let j = 0; j < inputData.app_identity[i].resource.ram.length; local_average_cpu += inputData.app_identity[i].resource.cpu[j], local_average_ram += inputData.app_identity[i].resource.ram[j], j++) 
            ;
            local_average_cpu = local_average_cpu / inputData.app_identity[i].resource.ram.length;
            local_average_ram = local_average_ram / inputData.app_identity[i].resource.ram.length;
            local_average_cpu += local_average_ram + inputData.app_identity[i].resource.memory;
            local_average_cpu = local_average_cpu / (inputData.serverType[local_server.type_index].memory + inputData.serverType[local_server.type_index].ram + inputData.serverType[local_server.type_index].cpu);
            if (local_average_cpu <= 1) {
                priority.push({indexVector: i, price: local_average_cpu});
            }
        }
        priority.sort((a, b) => {
            if (a.price > b.price) 
                return -1;
            if (a.price < b.price) 
                return 1;
            return 0;
        });
        let aggiunti;
        do
        {
            aggiunti = 0;
            //mi scorro la lista priorità
            for (let i = 0; i < priority.length; i++) {
                const current_appID = priority[i].indexVector;
                if (vectorApp[current_appID] > 0 && inputData.app_identity[current_appID].count > 0 && local_server.memory + inputData.app_identity[current_appID].resource.memory <= inputData.serverType[local_server.type_index].memory && local_server.pm + inputData.app_identity[current_appID].resource.pm < inputData.serverType[local_server.type_index].pm && local_server.p + inputData.app_identity[current_appID].resource.p < inputData.serverType[local_server.type_index].p && local_server.m + inputData.app_identity[current_appID].resource.m <= inputData.serverType[local_server.type_index].m) {
                    let j,
                        averageCpu;
                    averageCpu = 0;
                    for (j = 0; j < inputData.app_identity[current_appID].resource.ram.length && local_server.ram[j] + inputData.app_identity[current_appID].resource.ram[j] <= inputData.serverType[local_server.type_index].ram && local_server.cpu[j] + inputData.app_identity[current_appID].resource.cpu[j] <= inputData.serverType[local_server.type_index].cpu && local_server.cpu[j] + inputData.app_identity[current_appID].resource.cpu[j] <= globalConst.cpuLimit; averageCpu += local_server.cpu[j] + inputData.app_identity[current_appID].resource.cpu[j], j++) 
                    ;
                    averageCpu = averageCpu / inputData.app_identity[current_appID].resource.ram.length;
                    if (j == inputData.app_identity[current_appID].resource.ram.length && averageCpu < globalConst.averageCpuLimit) {
                        aggiunti++;
                        local_server
                            .appList
                            .push(current_appID);
                        //soddisfa le condizioni del server vanno verificate le condizioni scalari
                        inputData.app_identity[current_appID].count--;
                        vectorApp[current_appID]--;
                        if (inputData.app_identity[current_appID].count <= 0) {
                            inputData
                                .selfBlakList
                                .push(current_appID);
                            vectorApp[current_appID] = 0;
                        }
                        local_server.pm += inputData.app_identity[current_appID].resource.pm;
                        local_server.p += inputData.app_identity[current_appID].resource.p;
                        local_server.m += inputData.app_identity[current_appID].resource.m;
                        local_server.memory += inputData.app_identity[current_appID].resource.memory;
                        for (let k = 0; k < inputData.app_identity[current_appID].resource.ram.length; local_server.ram[k] += inputData.app_identity[current_appID].resource.ram[k], local_server.cpu[k] += inputData.app_identity[current_appID].resource.cpu[k], k++) ;
                        }
                    }
            }
        }
        while (aggiunti > 0) 
        ;
        if (local_server.appList.length > 0) {
            inputData.serverType[local_server.type_index].count--;
            serverList.push({type_index: local_server.type_index, appList: local_server.appList});
            serverRimasti = 0;
            inputData
                .serverType
                .forEach(el => {
                    serverRimasti += el.count;
                });
        } else {
            inputData
                .app_identity
                .forEach(el1 => {
                    if (el1.count > 0 && el1.selfBlakList > 0) {
                        console.log(el1);
                    }
                })
        }
    }
    console.log("Server creati: " + serverList.length);
    // console.log(inputData.serverType[1]);
    inputData
        .app_identity
        .forEach(elData => {
            if (elData.count > 0 && elData.selfConflict != 0) {
                console.log(`${elData.id_app} ${elData.count} ${elData.resource.memory}`);
            }
        })
    // console.log(`App rimanenti del data set ${file}:
    // ${inputData.app_identity.length - inputData.selfBlakList.length}`);
    salvaOutput(`./output/dataset_${file}.json`, serverList);
})
function salvaOutput(pathFile, serverList) {
    console.log("Avvio salvataggio..");
    fs.writeFile(pathFile, JSON.stringify({serverList}), (err) => {
        if (err) {
            return console.log(err);
        };
    });
}
function creaLista(n_app, blacklistStandard, app_identity) {
    const randomBlackList = [];
    const limitRandom = parseInt(n_app * 0.2);
    for (let i = 0; i < limitRandom; i++, randomBlackList.push(Math.floor(Math.random() * n_app))) 
    ;
    let list = [];
    for (let i = 0; i < n_app; list.push(1000), i++) 
    ;
    randomBlackList.forEach(el => {
        list[el] = 0;
    })
    blacklistStandard.forEach(el => {
        //finiti oppure self descructor
        list[el] = 0;
    });
    //tolgo app in conflitto silenziatori
    for (let i = 0; i < n_app; i++) {
        if (list[i] != 0) {
            if (list[i] > app_identity[i].selfConflict) {
                list[i] = app_identity[i].selfConflict;
            }
            app_identity[i]
                .blacklist
                .forEach(el => {
                    list[el] = 0;
                })
        }
    }
    //ognuno impone limite ad altri reducer
    for (let i = 0; i < n_app; i++) {
        if (list[i] != 0) {
            app_identity[i]
                .otherConflict
                .forEach(el => {
                    if (list[el.id_app] > el.max) {
                        list[el.id_app] = el.max;
                    }
                })
        }
    }
    return list;
}

function riduciAUno(array) {
    array = array.filter(function (elem, pos) {
        return array.indexOf(elem) == pos;
    });
    return array;
}