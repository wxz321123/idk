'use strict';
const fs = require('fs');
//const global
const inputFiles = [
    {
        tag: 'B',
        date: '20180726',
        tagDate: 'b'
    }, {
        tag: 'A',
        date: '20180606',
        tagDate: 'a'
    }
]
function do_average(list) {
    let a = 0;
    list.forEach(el => {
        a += el;
    })
    a = a / list.length;
    return a;
}
function price(app, parameter) {
    const tot = do_average(app.resource.ram) + do_average(app.resource.cpu) + app.resource.memory + app.resource.pm + app.resource.m + app.resource.p;
    return (tot / parameter);
}
function riduciAUno(array) {
    array = array.filter(function (elem, pos) {
        return array.indexOf(elem) == pos;
    });
    return array;
}
inputFiles.forEach(files => {
    const applicationsList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_resources_${files.date}.json`).data;
    const istanceList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_instance_deploy_${files.date}.json`).data;
    const serverList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_machine_resources_${files.date}.json`).data;
    const conflictList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_interference_${files.date}.json`).data;
    const countAppList = require(`./localDataFormatted/countApp${files.tag}.json`).data;
    const serverType = [];
    const serverStatus = [];
    for (let j = 0; j < serverList.length; serverStatus.push({
        id_server: parseInt(serverList[j].id_server.substring(8)) - 1,
        app_list: [],
        istanceList: []
    }), j++) 
    ;
    /*
        {
            type: x,
            cpu: y,
            memory: z,
            ram: ,
            pm: ,
            p: ,
            m: ,
            count: ,
            list_server_id: []
        }
    */
    let type,
        i;
    serverList.forEach(el => {
        type = `cpu:${el.cpu}-ram:${el.ram}-memory:${el.memory}-pm:${el.pm}-m:${el.m}-p:${el.p}`;
        for (i = 0; i < serverType.length; i++) {
            if (serverType[i].type == type) {
                serverType[i].count++;
                serverType[i]
                    .list_server_id
                    .push(parseInt(el.id_server.substring(8)) - 1);
                i = serverType.length;
            }
        }
        if (i == serverType.length) {
            serverType.push({
                type: type,
                count: 1,
                cpu: parseInt(el.cpu),
                memory: parseInt(el.memory),
                ram: parseInt(el.ram),
                pm: parseInt(el.pm),
                p: parseInt(el.p),
                m: parseInt(el.m),
                list_server_id: [parseInt(el.id_server.substring(8)) - 1]
            })
        }
    });
    /*
    {
        id_app : x,
        selfConflit: y,
        count: k,
        otherConflit: [
            {
                id_app: z,
                max: t
            }
        ],
        blaklist: [v,v,v,v],
        istanceList:[]
    }
 */
    const data = [];
    for (let i = 0; i < countAppList.length; i++) {
        data.push({
            id_app: i,
            selfConflict: 700,
            count: 0,
            otherConflict: [],
            blacklist: [],
            istanceList: [],
            vector_conflict: [],
            resource: {
                avgRam: 0,
                avgCpu: 0,
                price: 0,
                memory: 0,
                pm: 0,
                m: 0,
                p: 0,
                cpu: [],
                ram: []
            }
        })
    }

    applicationsList.forEach(el => {
        data[el.id_app - 1].resource.memory = el.memory;
        data[el.id_app - 1].resource.pm = el.pm;
        data[el.id_app - 1].resource.m = el.m;
        data[el.id_app - 1].resource.p = el.p;
        el
            .cpu
            .forEach(elCpu => {
                data[el.id_app - 1]
                    .resource
                    .cpu
                    .push(elCpu);
            });
        el
            .ram
            .forEach(elRam => {
                data[el.id_app - 1]
                    .resource
                    .ram
                    .push(elRam);
            })
    })
    const blackListFullDuplex = [];
    let selfBlakList = [];
    //cerco conflitti blacklist
    conflictList.forEach(conflitto => {
        if (conflitto.id_app1 == conflitto.id_app2) {
            if (conflitto.k == 0) {
                selfBlakList.push(conflitto.id_app1 - 1);
            }
            if (conflitto.k < data[conflitto.id_app1 - 1].selfConflict) {
                data[conflitto.id_app1 - 1].selfConflict = conflitto.k;
            }
        } else {
            if (conflitto.k == 0) {
                blackListFullDuplex.push([
                    conflitto.id_app1 - 1,
                    conflitto.id_app2 - 1
                ]);
            }
        }
    })
    selfBlakList = riduciAUno(selfBlakList);
    selfBlakList.sort((a, b) => {
        return a - b;
    });
    //potrebbe essere utile scalare istance id per farlo diventare un id puro
    istanceList.forEach(el => {
        if (el.id_server != null) {
            serverStatus[el.id_server - 1]
                .istanceList
                .push(el.id_istance);
            serverStatus[el.id_server - 1]
                .app_list
                .push(el.id_app - 1);
        }
        data[el.id_app - 1].count++;
        data[el.id_app - 1]
            .istanceList
            .push(el.id_istance);
    })
    //aggiungo id blacklist tramite id
    blackListFullDuplex.forEach(el => {
        data[el[0]]
            .blacklist
            .push(el[1]);
        data[el[1]]
            .blacklist
            .push(el[0]);
    });
    conflictList.forEach(conflitto => {
        if (!data[conflitto.id_app1 - 1].blacklist.includes(conflitto.id_app2 - 1)) {
            let daAggiungere = 0;
            for (let i = 0; i < data[conflitto.id_app1 - 1].otherConflict.length; i++) {
                if (data[conflitto.id_app1 - 1].otherConflict[i].id_app == conflitto.id_app2 - 1 && data[conflitto.id_app1 - 1].otherConflict[i].max > conflitto.k) {
                    data[conflitto.id_app1 - 1].otherConflict[i].max = conflitto.k;
                    daAggiungere++;
                    i = data[conflitto.id_app1 - 1].otherConflict.length;
                }
            }
            if (daAggiungere == 0) {
                data[conflitto.id_app1 - 1]
                    .otherConflict
                    .push({
                        id_app: conflitto.id_app2 - 1,
                        max: conflitto.k
                    });
            }
        }
    })
    //raffinamento blacklist
    for (let i = 0; i < data.length; i++) {
        data[i].blacklist = riduciAUno(data[i].blacklist);
        data[i]
            .blacklist
            .sort((a, b) => {
                return a - b;
            })
    }
    //console.log(data);
    let server_parameter = 0;
    const priority_app = [];
    serverType.forEach(el => {
        const x = el.ram + el.memory + el.cpu + el.pm + el.p + el.m;
        if (server_parameter < x) {
            server_parameter = x;
        }
    })
    data.forEach(app => {
        priority_app.push({
            id_app: app.id_app,
            price: price(app, server_parameter)
        });
        data[app.id_app].resource.price = price(app, server_parameter);
        data[app.id_app].resource.avgCpu = do_average(app.resource.cpu);
        data[app.id_app].resource.avgRam = do_average(app.resource.ram);
    })
    priority_app.sort((a, b) => {
        if (a.price < b.price) 
            return 1;
        
        if (a.price > b.price) 
            return -1;
        return 0;
    })
    data.forEach(el => {
        let app_vector = [];
        for (let i = 0; i < data.length; app_vector.push(1000), i++) 
        ;
        el
            .blacklist
            .forEach(el2 => {
                app_vector[el2] = 0;
            });
        app_vector[el.id_app] = el.selfConflict;
        el
            .otherConflict
            .forEach(el2 => {
                if (app_vector[el2.id_app] > el2.max) {
                    app_vector[el2.id_app] = el2.max;
                }
            })
        data[el.id_app].vector_conflict = app_vector;
    })
    //console.log(priority_app); console.log(data);
    let sumCpu = 0,
        sumRam = 0,
        countIstance = 0,
        countServer = 0;
    data.forEach(app => {
        countIstance += app.count;
        sumCpu += app.resource.avgCpu;
        sumRam += app.resource.avgRam;
    })
    serverType.forEach(el => {
        countServer += el.count;
    });
    sumCpu = sumCpu / data.length;
    sumRam = sumRam / data.length;
    console.log(`media cpu: ${sumCpu} media ram: ${sumRam} istanze totali: ${countIstance} server totati: ${countServer}`);
    console.log(`media istanze per server ${countIstance / countServer} media cpu: ${ (countIstance / countServer) * sumCpu} media ram: ${ (countIstance / countServer) * sumRam}`);

    return;

    const app_identity = data;
    fs.writeFile(`./metaElaborated/formatted_${files.tag}.json`, JSON.stringify({priority_app, selfBlakList, app_identity, serverType, serverStatus}), (err) => {
        if (err) {
            return console.log(err);
        };
        console.log("Saved file " + files.tag);
    });
});
