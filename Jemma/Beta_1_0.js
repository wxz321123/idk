'use strict';
/*
const istanceList = require("../sourceFormatted/scheduling_preliminary_a_instance_deploy_20180606.json").data;
const serverList = require("../sourceFormatted/scheduling_preliminary_a_machine_resources_20180606.json").data;
const conflictList = require("../sourceFormatted/scheduling_preliminary_a_app_interference_20180606.json").data;
*/
const fs = require('fs');
const applicationsList = require("../sourceFormatted/scheduling_preliminary_a_app_resources_20180606.json").data;
const countAppList = require("./localDataFormatted/countAppA.json").data;
const vincoli = require('./metaElaborated/vincoli_A.json');
let serverLimit = 0;
const serverOrganized = [];
/*
    ---DOCUMENTATION ABOUT VINCOLI---
    vincoli.selfConflict => massimo se stesso x server
    vincoli.otherConflict => massimo se stesso x server in convivenza con un'altra app
    vincoli.zeroConflict => se ci sono io gli altri non possono starci
    vincoli.SelfConflictIdAppZero => app in conflitto con se stesso max 0 di se stesso per server
    .listaConflitti => ottengo la lista di tutti i app che appartengono almeno ad un conflitto
*/
function riduciAUno(array) {
    const a = array.concat();
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) 
                a.splice(j--, 1);
            }
        }
    return a;
}
/*
    unire 2 array
    array1.concat(array2)
     const array3 = [
    ...array1,
    ...array2
    ];
*/
//elimino le app in conflitto con se stesse
const countAppListDelete = [];
countAppList.some((el, index, arr) => {
    if (vincoli.SelfConflictIdAppZero.includes(el.id_app)) {
        countAppListDelete.push(index);
    }
});
countAppListDelete.sort((a, b) => {
    return b - a;
});
countAppListDelete.forEach(el => {
    countAppList.splice(el, 1);
})
//fino a quando esistono conflitti da gestire
serverLimit = 4500;
let currentServer = 0;
//console.log(vincoli.otherConflict);
while (vincoli.otherConflict.length > 0 && serverLimit > currentServer && countAppList.length > 0) {
    const maxXIdApp = [];
    let IdDaIterare = [vincoli.otherConflict[0].id_app1];
    currentServer++;
    console.log("Server creati: " + currentServer);
    let server = {
        cpu: [],
        ram: [],
        memory: 0,
        listApp: []
    }
    for (let i = 0; i < 98; i++, server.cpu.push(0), server.ram.push(0)) {}
    //let prevIter = [];
    let blacklist = [];
    let iterIt = 0;
    //cerco vincoli data la lista id app while (IdDaIterare.length > 0) {
    while (iterIt < 2) {
        iterIt++;
        const output = [];
        const IdDaIterareDaEliminare = [];
        vincoli
            .otherConflict
            .forEach(relazione => {
                if (IdDaIterare.includes(relazione.id_app1) || IdDaIterare.includes(relazione.id_app2)) {
                    output.push(relazione);
                }
            });
        const prev = [];
        IdDaIterare.forEach(el => {
            prev.push(el);
        })
        //prevIter = prev; ricavo tutti gli id app ottenuti dalla ricerca
        output.forEach(out => {
            IdDaIterare.push(out.id_app1);
            IdDaIterare.push(out.id_app2);
        })
        //riduco a 1
        IdDaIterare = riduciAUno(IdDaIterare);
        IdDaIterare.sort((a, b) => {
            return a - b;
        });
        //cerco lista id della blacklist(già considerati o non compatibili)
        IdDaIterare.some((id, index, arr) => {
            if (blacklist.includes(id)) {
                IdDaIterareDaEliminare.push(index);
            }
        });
        //li elimino
        IdDaIterareDaEliminare.forEach(index => {
            IdDaIterare.splice(index, 1);
        });
        //cercasi le blaklist
        for (let i = 0; i < IdDaIterare.length; i++) {
            vincoli
                .zeroConflict
                .some((elZeroConflict, index, arr) => {
                    // trovata blacklist scorro la lista da iterare se trovo un true lo tolgo dalla
                    // lista per ogni id trovato nei conflitti add la lista alla blacklist
                    if (elZeroConflict.main_app == IdDaIterare[i]) {
                        blacklist = riduciAUno(blacklist.concat(elZeroConflict.blacklist));
                        for (let j = i + 1; j < IdDaIterare.length; j++) {
                            if (elZeroConflict.blacklist.includes(IdDaIterare[j])) {
                                IdDaIterare.splice(j, 1);
                                j--;
                            }
                        }
                    }
                    return elZeroConflict.main_app == IdDaIterare[i];
                });
        }
        //ricerca minimo data la condizione
        let trovato = 0;
        if (IdDaIterare.length > 0) {
            output.forEach(relazione => {
                if (IdDaIterare.includes(relazione.id_app1) && IdDaIterare.includes(relazione.id_app2)) {
                    maxXIdApp.some((statusApp, index2, arr) => {
                        if (statusApp.id_app == relazione.id_app1 && statusApp.max > relazione.max1) {
                            statusApp.max = relazione.max1;
                            trovato++;
                        }
                        if (statusApp.id_app == relazione.id_app2 && statusApp.max > relazione.max2) {
                            statusApp.max = relazione.max1;
                            trovato += 2;
                        }
                        return trovato == 3;
                    })
                    if (trovato == 0) {
                        maxXIdApp.push({id_app: relazione.id_app1, max: relazione.max1});
                        maxXIdApp.push({id_app: relazione.id_app2, max: relazione.max2});
                    }
                    if (trovato == 1) {
                        maxXIdApp.push({id_app: relazione.id_app2, max: relazione.max2});
                    }
                    if (trovato == 2) {
                        maxXIdApp.push({id_app: relazione.id_app1, max: relazione.max1});
                    }
                    trovato = 0;
                }
            });
            //qui
            for (let i = 0; i < IdDaIterare.length; i++) {
                if (prev.includes(IdDaIterare[i])) {
                    IdDaIterare.splice(i, 1);
                    i--;
                }
            }
            blacklist = riduciAUno(blacklist.concat(prev));
        }
    }
    let aggiunto1 = 1;
    while (aggiunto1 > 0 && maxXIdApp.length > 0) {
        aggiunto1 = 0;
        for (let i = 0; i < maxXIdApp.length; i++) {
            for (let j = 0; j < countAppList.length; j++) {
                if (maxXIdApp[i].id_app == countAppList[j].id_app) {
                    for (let k = 0; k < applicationsList.length; k++) {
                        if (applicationsList[k].id_app == countAppList[j].id_app) {
                            if (applicationsList[k].memory + server.memory < 1024) {
                                let z;
                                for (z = 0; z < 98, server.cpu[z] + applicationsList[k].cpu[z] < 14.5 && server.ram[z] + applicationsList[k].ram[z] < 288; z++) 
                                ;
                                if (z == 98 && countAppList[j].count > 0 && maxXIdApp[i].max > 0) {
                                    aggiunto1++;
                                    for (z = 0; z < 98; server.cpu[z] += applicationsList[k].cpu[z], server.ram[z] += applicationsList[k].ram[z], z++) 
                                    ;
                                    countAppList[j].count--;
                                    maxXIdApp[i].max--;
                                    if (countAppList[j].count == 0) {
                                        countAppList.splice(j, 1);
                                        maxXIdApp.splice(i, 1);
                                        i--;
                                    }
                                    if (maxXIdApp[i].max == 0) {
                                        maxXIdApp.splice(i, 1);
                                        i--;
                                    }
                                }
                            }
                            k = applicationsList.length;
                        }
                    }
                    j = countAppList.length;
                }
            }
        }
    }
    //esce dopo aver popolato il server con i vincoli
    aggiunto1++;
    while (aggiunto1 > 0) {
        aggiunto1 = 0;
        for (let i = 0; i < countAppList.length; i++) {
            if (countAppList[i].count > 0 && !vincoli.listaConflitti.includes(countAppList[i].id_app)) {
                for (let j = 0; j < applicationsList.length; j++) {
                    if (applicationsList[j].id_app == countAppList[i].id_app) {
                        if (applicationsList[j].memory + server.memory < 1024) {
                            let z;
                            for (z = 0; z < 98, server.cpu[z] + applicationsList[j].cpu[z] < 14.5 && server.ram[z] + applicationsList[j].ram[z] < 288; z++) 
                            ;
                            if (z == 98 && countAppList[i].count > 0) {
                                server.memory += applicationsList[j].memory;
                                server
                                    .listApp
                                    .push(applicationsList[j].id_app)
                                aggiunto1++;
                                for (z = 0; z < 98; server.cpu[z] += applicationsList[j].cpu[z], server.ram[z] += applicationsList[j].ram[z], z++) 
                                ;
                                countAppList[i].count--;
                                if (countAppList[i].count == 0) {
                                    countAppList.splice(i, 1);
                                    i--;
                                }
                            }
                        }
                        j = applicationsList.length;
                    }
                }
            }
        }
    }
    serverOrganized.push(server);
}
fs.writeFile(`./metaElaborated/quest_a.json`, JSON.stringify({serverOrganized}), (err) => {
    if (err) {
        return
        console.log(err);
    };
    console.log("Saved meta");
});
while (currentServer < serverLimit && countAppList.length > 0) {
    let server = {
        cpu: [],
        ram: [],
        memory: 0,
        listApp: []
    }
    currentServer++;
    console.log("Server creati: " + currentServer);
    let aggiunto1 = 1;
    while (aggiunto1 > 0) {
        aggiunto1 = 0;
        for (let i = 0; i < countAppList.length; i++) {
            if (countAppList[i].count > 0 && !vincoli.listaConflitti.includes(countAppList[i].id_app)) {
                for (let j = 0; j < applicationsList.length; j++) {
                    if (applicationsList[j].id_app == countAppList[i].id_app) {
                        if (applicationsList[j].memory + server.memory < 1024) {
                            let z;
                            for (z = 0; z < 98, server.cpu[z] + applicationsList[j].cpu[z] < 14.5 && server.ram[z] + applicationsList[j].ram[z] < 288; z++) 
                            ;
                            if (z == 98 && countAppList[i].count > 0) {
                                server.memory += applicationsList[j].memory;
                                server
                                    .listApp
                                    .push(applicationsList[j].id_app)
                                aggiunto1++;
                                for (z = 0; z < 98; server.cpu[z] += applicationsList[j].cpu[z], server.ram[z] += applicationsList[j].ram[z], z++) 
                                ;
                                countAppList[i].count--;
                                if (countAppList[i].count == 0) {
                                    countAppList.splice(i, 1);
                                    i--;
                                }
                            }
                        }
                        j = applicationsList.length;
                    }
                }
            }
        }
    }
    serverOrganized.push(server);
}
fs.writeFile(`./metaElaborated/quest_a.json`, JSON.stringify({serverOrganized}), (err) => {
    if (err) {
        return
        console.log(err);
    };
    console.log("Saved");
});
//console.log(applicationsList);