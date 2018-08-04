'use strict';
const fs = require('fs');
//const global
const inputFiles = [
    {
        tag: 'A',
        date: '20180606',
        tagDate: 'a'
    }, {
        tag: 'B',
        date: '20180726',
        tagDate: 'b'
    }
]
function riduciAUno(array) {
    array = array.filter(function (elem, pos) {
        return array.indexOf(elem) == pos;
    });
    return array;
}
inputFiles.forEach(files => {
    const applicationsList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_resources_${files.date}.json`).data;
    const istanceList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_instance_deploy_${files.date}.json`).data;
    /*da convertire a intero*/
    const serverList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_machine_resources_${files.date}.json`).data;
    const conflictList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_interference_${files.date}.json`).data;
    const countAppList = require(`./localDataFormatted/countApp${files.tag}.json`).data;
    const application_sum_up = [];
    const server_sum_up = [];
    const single_server_status_sum_up = [];
    let file_analisis = {
        server_totali: 0,
        istanze_totali: 0,
        app_totali: 0,
        average_cpu: 0,
        average_cpu_x_server: 0
    }
    // inizializzazione dati da id a id_vector(scalare di 1)
    // console.log(applicationsList[0]);
    for (let i = 0; i < serverList.length; i++) {
        single_server_status_sum_up.push({
            type_index: 0,
            id_server: i,
            list_id_app: [],
            list_id_istance: [],
            ram_status: [],
            cpu_status: [],
            memory: 0,
            pm: 0,
            p: 0,
            m: 0
        });
    }

    for (let i = 0; i < applicationsList.length; i++) {
        applicationsList[i].id_app--;
        application_sum_up.push({
            id_app: i,
            count: 0,
            self_limit: 1000,
            other_conflict: [],
            inverse_other_conflict: [],
            resource_needed: {
                avg_cpu: 0,
                avg_ram: 0,
                cpu: [],
                ram: [],
                memory: 0,
                pm: 0,
                p: 0,
                m: 0
            },
            on_server_istance: [],
            free_istance: []
        })
        /*
            other_conflict dico ad altri
            inverse_other_conflict altri a me
            == ricerca a range ristretto al caso
         */
    };

    for (let i = 0; i < applicationsList.length; i++) {
        if (application_sum_up[applicationsList[i].id_app].self_limit > 0) {
            application_sum_up[applicationsList[i].id_app].resource_needed.memory = applicationsList[i].memory;
            application_sum_up[applicationsList[i].id_app].resource_needed.pm = applicationsList[i].pm;
            application_sum_up[applicationsList[i].id_app].resource_needed.m = applicationsList[i].m;
            application_sum_up[applicationsList[i].id_app].resource_needed.p = applicationsList[i].p;
            application_sum_up[applicationsList[i].id_app].resource_needed.cpu = applicationsList[i].cpu;
            application_sum_up[applicationsList[i].id_app].resource_needed.ram = applicationsList[i].ram;
            //calcolo media cpu e ram
            for (let j = 0; j < application_sum_up[applicationsList[i].id_app].resource_needed.cpu.length; application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu += application_sum_up[applicationsList[i].id_app].resource_needed.cpu[j], application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram += application_sum_up[applicationsList[i].id_app].resource_needed.ram[j], j++) 
            ;
            application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu = application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu / application_sum_up[applicationsList[i].id_app].resource_needed.cpu.length;
            application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram = application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram / application_sum_up[applicationsList[i].id_app].resource_needed.ram.length;
        }
    }
    serverList.forEach(el => {
        const type = `ram${el.ram}-cpu${el.cpu}-memory${el.memory}-pm${el.pm}-m${el.m}-p${el.p}`;
        let i;
        for (i = 0; i < server_sum_up.length; i++) {
            if (server_sum_up[i].type == type) {
                server_sum_up[i].count++;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index = i;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].memory = server_sum_up[i].memory;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].pm = server_sum_up[i].pm;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].m = server_sum_up[i].m;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].p = server_sum_up[i].p;
                for (let j = 0; j < applicationsList[0].ram.length; single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].cpu_status[j] -= server_sum_up[i].resource_needed.cpu[j], single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].ram_status[j] -= server_sum_up[i].resource_needed.ram[j], j++) 
                ;
                server_sum_up[i]
                    .free_id_list
                    .push(parseInt(el.id_server.substring(8)) - 1);
                i = server_sum_up.length;
            }
        }
        if (i == server_sum_up.length) {
            server_sum_up.push({
                type: type,
                count: 1,
                ram: parseInt(el.ram),
                cpu: parseInt(el.cpu),
                memory: parseInt(el.memory),
                pm: parseInt(el.pm),
                p: parseInt(el.p),
                m: parseInt(el.m),
                free_id_list: [parseInt(el.id_server.substring(8)) - 1]
            })
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index = server_sum_up.length - 1;
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].cpu_status = server_sum_up[i].resource_needed.cpu;
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].ram_status = server_sum_up[i].resource_needed.ram;
        }
    })
    console.log(single_server_status_sum_up[0]);
    return;
    for (let i = 0; i < istanceList.length; i++) {
        istanceList[i].id_app--;
        istanceList[i].id_istance--;
        application_sum_up[istanceList[i].id_app].count++;
        if (istanceList[i].id_server != null) {
            istanceList[i].id_server--;
            //posso cercare il tipo di server e toglierlo
            single_server_status_sum_up[istanceList[i].id_server]
                .list_id_app
                .push(istanceList[i].id_app);
            single_server_status_sum_up[istanceList[i].id_server]
                .list_id_istance
                .push(istanceList[i].id_istance);
            single_server_status_sum_up[istanceList[i].id_server].memory -= application_sum_up[istanceList[i].id_app].resource_needed.memory;
            single_server_status_sum_up[istanceList[i].id_server].pm -= application_sum_up[istanceList[i].id_app].resource_needed.pm;
            single_server_status_sum_up[istanceList[i].id_server].m -= application_sum_up[istanceList[i].id_app].resource_needed.m;
            single_server_status_sum_up[istanceList[i].id_server].p -= application_sum_up[istanceList[i].id_app].resource_needed.p;
            for (let j = 0; j < application_sum_up[istanceList[i].id_app].resource_needed.ram.length; single_server_status_sum_up[istanceList[i].id_server].cpu_status[j] -= application_sum_up[istanceList[i].id_app].resource_needed.cpu[j], j++) 
                application_sum_up[istanceList[i].id_app].on_server_istance.push({
                    id_istance: istanceList[i].id_istance,
                    id_server: istanceList[i].id_server,
                    index_server_type: single_server_status_sum_up[istanceList[i].id_server].type_index
                });
            }
        else {
            application_sum_up[istanceList[i].id_app]
                .free_istance
                .push(istanceList[i].id_istance);
        }
    }
    single_server_status_sum_up.forEach(server => {
        if (server.list_id_app.length > 0) {
            for (let i = 0; i < server_sum_up[server.type_index].free_id_list.length; i++) {
                if (server_sum_up[server.type_index].free_id_list[i] == server.id_server) {
                    server_sum_up[server.type_index]
                        .free_id_list
                        .splice(i, 1);
                    i = server_sum_up[server.type_index].free_id_list.length;
                }
            }
        }
    })
    for (let i = 0; i < conflictList.length; i++) {
        conflictList[i].id_app1--;
        conflictList[i].id_app2--;
        if (conflictList[i].id_app1 == conflictList[i].id_app2) {
            application_sum_up[conflictList[i].id_app1].self_limit = conflictList[i].k;
            // sto considerando 0 come se fosse un limite ovvero se ci sono io quanti altri
            // come me possono esserci ovvero 0 ma come limite a se stesso è 1
            if (conflictList[i].k == 0) {
                application_sum_up[conflictList[i].id_app1].self_limit++;
            }
        } else {
            application_sum_up[conflictList[i].id_app1]
                .other_conflict
                .push({id_app: conflictList[i].id_app2, max: conflictList[i].k});
            application_sum_up[conflictList[i].id_app2]
                .inverse_other_conflict
                .push({id_app: conflictList[i].id_app1, max: conflictList[i].k});
        }
    }
    for (let i = 0; i < applicationsList.length; i++) {
        if (application_sum_up[applicationsList[i].id_app].self_limit > 0) {
            application_sum_up[applicationsList[i].id_app].resource_needed.memory = applicationsList[i].memory;
            application_sum_up[applicationsList[i].id_app].resource_needed.pm = applicationsList[i].pm;
            application_sum_up[applicationsList[i].id_app].resource_needed.m = applicationsList[i].m;
            application_sum_up[applicationsList[i].id_app].resource_needed.p = applicationsList[i].p;
            application_sum_up[applicationsList[i].id_app].resource_needed.cpu = applicationsList[i].cpu;
            application_sum_up[applicationsList[i].id_app].resource_needed.ram = applicationsList[i].ram;
            //calcolo media cpu e ram
            for (let j = 0; j < application_sum_up[applicationsList[i].id_app].resource_needed.cpu.length; application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu += application_sum_up[applicationsList[i].id_app].resource_needed.cpu[j], application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram += application_sum_up[applicationsList[i].id_app].resource_needed.ram[j], j++) 
            ;
            application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu = application_sum_up[applicationsList[i].id_app].resource_needed.avg_cpu / application_sum_up[applicationsList[i].id_app].resource_needed.cpu.length;
            application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram = application_sum_up[applicationsList[i].id_app].resource_needed.avg_ram / application_sum_up[applicationsList[i].id_app].resource_needed.ram.length;
        }
    }
    for (let i = 0; i < application_sum_up.length; i++) {
        // se il self limit è minore del miniti a cui si viene posti non ha senso
        // considerarli
        for (let j = 0; j < application_sum_up[i].inverse_other_conflict.length; j++) {
            if (application_sum_up[i].self_limit <= application_sum_up[i].inverse_other_conflict[j].max) {
                application_sum_up[i]
                    .inverse_other_conflict
                    .splice(j, 1);
                j--;
            }
        }
    }
    server_sum_up.forEach(el => {
        file_analisis.server_totali += el.count;
    });
    application_sum_up.forEach(el => {
        file_analisis.app_totali++;
        file_analisis.istanze_totali += el.count;
        file_analisis.average_cpu += el.resource_needed.avg_cpu * el.count;
    });
    file_analisis.average_cpu = file_analisis.average_cpu / file_analisis.istanze_totali;
    file_analisis.average_cpu_x_server = (file_analisis.istanze_totali / file_analisis.server_totali) * file_analisis.average_cpu;
    console.log(`Analisi dati ${files.tag} \nApp totali: ${file_analisis.app_totali} \nServer totali: ${file_analisis.server_totali} \nIstanze totali: ${file_analisis.istanze_totali} \nAverage cpu: ${file_analisis.average_cpu} \nAverage cpu x server: ${file_analisis.average_cpu_x_server}`);
    fs.writeFile(`./raffinamento_2.0/input_${files.tag}.json`, JSON.stringify({file_analisis, server_sum_up, single_server_status_sum_up, application_sum_up}), (err) => {
        if (err) {
            return console.log(err);
        };
        console.log("Saved file " + files.tag);
    });
});
