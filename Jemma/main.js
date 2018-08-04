'use strict';
const fs = require('fs');
const applicationsList = require("../sourceFormatted/scheduling_preliminary_a_app_resources_20180606.json").data;
const istanceList = require("../sourceFormatted/scheduling_preliminary_a_instance_deploy_20180606.json").data;
const serverList = require("../sourceFormatted/scheduling_preliminary_a_machine_resources_20180606.json").data;
const conflictList = require("../sourceFormatted/scheduling_preliminary_a_app_interference_20180606.json").data;
const countAppList = require("./localDataFormatted/countAppA.json").data;
const statusServer = [];
const blackList = [];
const firstRaidDeleted = [];
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
conflictList.forEach(el => {
    if (el.id_app1 == el.id_app2 && el.k == 0) {
        // self limitation andrebbe eliminata dalla countAppList e mai aggiunta alla
        // blacklist in quanto non invalida
        countAppList.some((app, index, _arr) => {
            if (app.id_app == el.id_app1) {
                firstRaidDeleted.push(index);
            }
        })
    } else {
        if (!blackList.includes(el.id_app1)) 
            blackList.push(el.id_app1);
        }
    })
firstRaidDeleted.sort((a, b) => {
    if (a > b) 
        return -1;
    if (a < b) 
        return 1;
    return 0;
});
firstRaidDeleted.forEach(el => {
    countAppList.splice(el, 1);
});
blackList.sort((a, b) => {
    if (a < b) 
        return -1;
    if (a > b) 
        return 1;
    return 0;
});
const relazioniTraVincoli = [];
const appVincolati = [];
blackList.forEach(el => {
    appVincolati.push(el)
});
while (appVincolati.length != 0) {
    const localList = [];
    const statistic = [];
    const listToDelete = [];
    let trovato = 1;
    //raccolgo i vincoli legati al primo elemento
    conflictList.forEach(el => {
        if (el.id_app1 == appVincolati[0]) 
            localList.push(el);
        }
    )
    //lavoro i dati creando la legenda da seguire per l'assegnazione ai server
    statistic.push({id_app: appVincolati[0], max: 700});
    appVincolati.splice(0, 1);
    localList.forEach(el => {
        trovato = 1;
        statistic.some((el2, index, _arr) => {
            if (el2.id_app == el.id_app2 && el2.max > el.k) {
                el2.max = el.k;
                trovato = 0;
                return 0;
            }
        });
        if (trovato == 1) {
            statistic.push({id_app: el.id_app2, max: el.k});
        }
    })
    relazioniTraVincoli.push(statistic);
    statistic.forEach(el => {
        appVincolati.some((el2, index, _arr) => {
            if (el2 == el.id_app) {
                listToDelete.push(index);
                return 0;
            }
        })
    });
    //elimino dalla lista vincolati quelli considerati in questo ciclo
    listToDelete.sort((a, b) => {
        if (a > b) 
            return -1;
        if (a < b) 
            return 1;
        return 0;
    });
    listToDelete.forEach(el => {
        appVincolati.splice(el, 1);
    });
}
//tolgo dalla lista le app da smistare, quelle invalide
let countIstanzeTolte = 0;
relazioniTraVincoli.forEach(pack => {
    if (pack.length == 1 && pack[0].max == 0) {
        const listToDelete = [];
        countAppList.some((el, index, _arr) => {
            if (el.id_app == pack[0].id_app) {
                listToDelete.push(index);
                countIstanzeTolte += el.count;
            }
            return el.id_app == pack[0].id_app;
        })
        listToDelete.sort((a, b) => {
            if (a > b) 
                return -1;
            if (a < b) 
                return 1;
            return 0;
        });
        listToDelete.forEach(el => {
            countAppList.splice(el, 1);
        });
    }
});
countAppList.sort((a, b) => {
    if (a.count > b.count) 
        return -1;
    if (a.count < b.count) 
        return 1;
    return 0;
});
let j = relazioniTraVincoli.length;
relazioniTraVincoli.forEach(vincoli => {
    console.log("Vincolo: " + j);
    j--;
    while (vincoli.length > 0) {
        let server = {
            cpu: [],
            ram: [],
            memory: 0,
            listIstance: []
        }
        //const divietiId = [];
        const applicationsToDelete = [];
        const vincoliToDelete = [];
        for (let i = 0; i < 98; i++, server.cpu.push(0), server.ram.push(0)) {}
        vincoli.some((vincolo, indexVincolo, _arr) => {
            // il vincolo va ripetuto fino a quando i id non esistono piu nel count app
            // divietiId.push(vincolo.id_app);
            if (vincolo.max > 0) {
                countAppList.some((el, index, _arr) => {
                    if (el.id_app == vincolo.id_app) {
                        //console.log(el);
                        applicationsList.some((app, index2, _arr2) => {
                            if (app.id_app == vincolo.id_app) {
                                // ********************* vincolo importante j < 5 pone il limite di quanti
                                for (let j = 0; el.count > 0 && j < vincolo.max && j < 10 && app.memory + server.memory < 1024; j++) {
                                    let i;
                                    for (i = 0; i < 98 && app.cpu[i] + server.cpu[i] < 14.5 && app.ram[i] + server.ram[i] < 288; i++) 
                                    ;
                                    if (i == 98) {
                                        server
                                            .listIstance
                                            .push(app.id_app);
                                        server.memory += app.memory;
                                        el.count--;
                                        if (el.count == 0) {

                                            applicationsToDelete.push(index);
                                            vincoliToDelete.push(indexVincolo);
                                        }
                                        for (i = 0; i < 98; server.cpu[i] += app.cpu[i], server.ram[i] += app.ram[i], i++) ;
                                        }
                                    }
                            }
                            return app.id_app == vincolo.id_app;
                        })
                    }
                    return el.id_app == vincolo.id_app;
                })
            }
        })
        // finito giro vincoli mi faccio il giro del resto potenzialmente riempio fino a
        // quando ho spazio? fino a quando vi è add
        for (let k = 0; k < 3; k++) {
            countAppList.some((app, index, _arr) => {
                if (!blackList.includes(app.id_app) && app.count > 0) {
                    //provo a fare merge
                    let appValue = [];
                    applicationsList.some((el, index, _arr) => {
                        if (el.id_app == app.id_app) {
                            appValue = el;
                        }
                        return el.id_app == app.id_app;
                    });
                    if (appValue.memory + server.memory < 1024) {
                        let i;
                        for (i = 0; i < 98 && appValue.cpu[i] + server.cpu[i] < 14.5 && appValue.ram[i] + server.ram[i] < 288; i++) 
                        ;
                        if (i == 98) {
                            server
                                .listIstance
                                .push(appValue.id_app);
                            server.memory += appValue.memory;
                            app.count--;
                            if (app.count == 0) {
                                applicationsToDelete.push(index);
                            }
                            for (i = 0; i < 98; server.cpu[i] += appValue.cpu[i], server.ram[i] += appValue.ram[i], i++) ;
                            }
                        }
                }
                if (app.count == 0 && !applicationsToDelete.includes(app.id_app)) {
                    applicationsToDelete.push(index);
                }
            })
        }
        applicationsToDelete.sort((a, b) => {
            if (a > b) 
                return -1;
            if (a < b) 
                return 1;
            return 0;
        });
        applicationsToDelete.forEach(el => {
            countAppList.splice(el, 1);
        });
        vincoliToDelete.sort((a, b) => {
            if (a > b) 
                return -1;
            if (a < b) 
                return 1;
            return 0;
        });
        vincoliToDelete.forEach(el => {
            vincoli.splice(el, 1);
        });
        let isAllDiv0 = 0;
        vincoli.forEach(el => {
            if (el.max > 0) 
                isAllDiv0 = 1;
            }
        )
        if (isAllDiv0 == 0) {
            const listToDeleteBlacklist = [];
            vincoli.forEach(el => {
                blackList.some((el2, index, _arr) => {
                    if (el2 == el.id_app) 
                        listToDeleteBlacklist.push(index);
                    return el2 == el.id_app;
                })
            })
            listToDeleteBlacklist.sort((a, b) => {
                if (a > b) 
                    return -1;
                if (a < b) 
                    return 1;
                return 0;
            });
            listToDeleteBlacklist.forEach(el => {
                blackList.splice(el, 1);
            });
            vincoli = [];
        }
        statusServer.push(server);
        console.log("Server gestiti: " + statusServer.length);
        console.log('Vincoli rimanenti: ' + vincoli.length);
    }
});
fs.writeFile(`./metaElaborated/quest_a.json`, JSON.stringify({statusServer}), (err) => {
    if (err) {
        return
        console.log(err);
    };
    console.log("Saved meta");
});
if (statusServer.length <= 6000) {
    while (countAppList.length > 0 && added > 0) {
        let added = 1;
        let server = {
            cpu: [],
            ram: [],
            memory: 0,
            listIstance: []
        }
        const applicationsToDelete = [];
        for (let i = 0; i < 98; i++, server.cpu.push(0), server.ram.push(0)) 
        ;
        while (added > 0) {
            added = 0;
            countAppList.some((app, index, _arr) => {
                if (!blackList.includes(app.id_app) && app.count > 0) {
                    //provo a fare merge
                    let appValue = [];
                    applicationsList.some((el, index, _arr) => {
                        if (el.id_app == app.id_app) {
                            appValue = el;
                        }
                        return el.id_app == app.id_app;
                    });
                    if (appValue.memory + server.memory < 1024) {
                        let i;
                        for (i = 0; i < 98 && appValue.cpu[i] + server.cpu[i] < 14.5 && appValue.ram[i] + server.ram[i] < 288; i++) 
                        ;
                        if (i == 98) {
                            server
                                .listIstance
                                .push(appValue.id_app);
                            server.memory += appValue.memory;
                            app.count--;
                            if (app.count == 0) {
                                applicationsToDelete.push(index);
                            }
                            added++;
                            for (i = 0; i < 98; server.cpu[i] += appValue.cpu[i], server.ram[i] += appValue.ram[i], i++) ;
                            }
                        }
                }
                if (app.count == 0 && !applicationsToDelete.includes(app.id_app)) {
                    applicationsToDelete.push(index);
                }
            })
        }
        applicationsToDelete.sort((a, b) => {
            if (a > b) 
                return -1;
            if (a < b) 
                return 1;
            return 0;
        });
        applicationsToDelete.forEach(el => {
            countAppList.splice(el, 1);
        });
        statusServer.push(server);
    }
} else { //Caso in cui ho troppi server ma altre cose da gestire
    let count = 0;
    countAppList.forEach(el => {
        count += el.count;
    })
    console.log(`Sono rimasti fuori ${count} istanze da gestire`);
}
//console.log(statusServer);
fs.writeFile(`./metaElaborated/quest_a.json`, JSON.stringify({statusServer}), (err) => {
    if (err) {
        return
        console.log(err);
    };
    console.log("Saved");
});
/*
 {
    cpu:[],
    ram:[],
    memory:0,
    listIstance:[]
 }
*/
// console.log(countAppList.length); console.log(relazioniTraVincoli);
// console.log(applicationsList); console.log(blackList);