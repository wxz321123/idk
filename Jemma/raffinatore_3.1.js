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
const logger = fs.createWriteStream('submit_20180802-151103.csv', {
    flags: 'w' // 'a' means appending (old data will be preserved)
});
inputFiles.forEach(files => {
    const applicationsList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_resources_${files.date}.json`).data;
    const istanceList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_instance_deploy_${files.date}.json`).data;
    const serverList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_machine_resources_${files.date}.json`).data;
    const conflictList = require(`../sourceFormatted/scheduling_preliminary_${files.tagDate}_app_interference_${files.date}.json`).data;
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
    // inizializzazione dati da id a id_vector(scalare di 1) creazione lista server
    // singoli
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
    //creazione lista applicazioni
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
    //popolo la lista applicazioni con i relativi costi
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
    //ricerco la tipologia dei server inizializzando i relativi costi
    serverList.forEach(el => {
        const type = `ram${el.ram}-cpu${el.cpu}-memory${el.memory}-pm${el.pm}-m${el.m}-p${el.p}`;
        let i;
        for (i = 0; i < server_sum_up.length; i++) {
            if (server_sum_up[i].type == type) {
                server_sum_up[i].count++;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index = i;
                server_sum_up[i]
                    .free_id_list
                    .push(parseInt(el.id_server.substring(8)) - 1);
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index = i;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].memory = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].memory;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].pm = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].pm;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].m = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].m;
                single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].p = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].p;
                for (let j = 0; j < applicationsList[0].ram.length; single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].cpu_status.push(server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].cpu), single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].ram_status.push(server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].ram), j++) 
                ;
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
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].memory = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].memory;
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].pm = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].pm;
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].m = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].m;
            single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].p = server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].p;
            for (let j = 0; j < applicationsList[0].ram.length; single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].cpu_status.push(server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].cpu), single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].ram_status.push(server_sum_up[single_server_status_sum_up[parseInt(el.id_server.substring(8)) - 1].type_index].ram), j++) ;
            }
        })
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
            for (let j = 0; j < application_sum_up[istanceList[i].id_app].resource_needed.ram.length; single_server_status_sum_up[istanceList[i].id_server].cpu_status[j] -= application_sum_up[istanceList[i].id_app].resource_needed.cpu[j], single_server_status_sum_up[istanceList[i].id_server].ram_status[j] -= application_sum_up[istanceList[i].id_app].resource_needed.ram[j], j++) 
            ;
            application_sum_up[istanceList[i].id_app]
                .on_server_istance
                .push({
                    id_istance: istanceList[i].id_istance,
                    id_server: istanceList[i].id_server,
                    index_server_type: single_server_status_sum_up[istanceList[i].id_server].type_index
                });
        } else {
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
    //tolgo dalla lista app i count gia messi
    for (let i = 0; i < application_sum_up.length; i++) {
        application_sum_up[i].count -= application_sum_up[i].on_server_istance.length;
    }
    /* inizio codice ricerca */
    //ora vanno riempiti
    let istanze_rimaste = 0;
    let changed;
    application_sum_up.forEach(el => {
        istanze_rimaste += el.count;
    })
    console.log("Istanze da gestire: " + istanze_rimaste + " istanze");
    // vector_free_cpu_average(single_server_status_sum_up, 1); const v_pendence_cpu
    // = vector_pendence_cpu(single_server_status_sum_up, 1);
    let precisione = {
        precisione_shuffle: 10,
        precisione_rovesciamento: 10,
        precisione_iniettamento: 10
    }
    do
    {
        changed = 0;
        //ricerca app da mettere nei server
        let swiched = 0;
        let times = 0;
        let added;
        let combo_zero = 0;
        let spazio_creato = 0;
        const free_cpu_server = vector_free_cpu_average(single_server_status_sum_up, -1);
        console.log("Creazione spazio..");
        for (let i = 0; i < free_cpu_server.length - 1 && combo_zero < 100; i++) {
            let app_aggiunte,
                added_per_cicle = 0;
            let precisione_dinamico = precisione.precisione_rovesciamento;
            do
            {
                app_aggiunte = 0;
                precisione_dinamico = precisione_dinamico * 0.5;
                const match = the_best_solution_without_count_condition(single_server_status_sum_up[free_cpu_server[i]], application_sum_up, precisione_dinamico);
                if (match.id_app != -1) {
                    for (let j = 0; j < application_sum_up[match.id_app].on_server_istance.length; j++) {
                        const rest_list = free_cpu_server.slice(i + 1, free_cpu_server.length);
                        //trovo il server scorrendo la lista della applicazione
                        if (rest_list.includes(application_sum_up[match.id_app].on_server_istance[j].id_server)) { //anche altre condizioni
                            changed++;
                            spazio_creato++;
                            added_per_cicle++;
                            console.log(`Spostato dal server: ${application_sum_up[match.id_app].on_server_istance[j].id_server} nel server: ${free_cpu_server[i]} l'istanza numero: ${application_sum_up[match.id_app].on_server_istance[j].id_istance}`);
                            // scorro la lista istanze del server trovato nella applicazione e devo togliere
                            // la applicazione dai dati
                            for (let k = 0; k < single_server_status_sum_up[application_sum_up[match.id_app].on_server_istance[j].id_server].list_id_istance.length; k++) {
                                if (single_server_status_sum_up[application_sum_up[match.id_app].on_server_istance[j].id_server].list_id_istance[k] == application_sum_up[match.id_app].on_server_istance[j].id_istance) {
                                    single_server_status_sum_up[application_sum_up[match.id_app].on_server_istance[j].id_server]
                                        .list_id_app
                                        .splice(k, 1);
                                    single_server_status_sum_up[application_sum_up[match.id_app].on_server_istance[j].id_server]
                                        .list_id_istance
                                        .splice(k, 1);
                                }
                            }
                            logger.write(`inst_${application_sum_up[match.id_app].on_server_istance[j].id_istance + 1},machine_${free_cpu_server[i] + 1}\n`);
                            update_server(single_server_status_sum_up[application_sum_up[match.id_app].on_server_istance[j].id_server], application_sum_up[match.id_app], -1);
                            application_sum_up[match.id_app].on_server_istance[j].id_server = free_cpu_server[i];
                            application_sum_up[match.id_app].on_server_istance[j].index_server_type = single_server_status_sum_up[free_cpu_server[i]].type_index;
                            single_server_status_sum_up[free_cpu_server[i]]
                                .list_id_app
                                .push(match.id_app);
                            single_server_status_sum_up[free_cpu_server[i]]
                                .list_id_istance
                                .push(application_sum_up[match.id_app].on_server_istance[j].id_istance);
                            //il server deve cercare l'istanza e toglierlo
                            update_server(single_server_status_sum_up[free_cpu_server[i]], application_sum_up[match.id_app], 1);
                            app_aggiunte++;
                            j = application_sum_up[match.id_app].on_server_istance;
                        }
                    }
                }
            }
            while (app_aggiunte > 0) 
            ;
            console.log("Ciclo " + i + "-esimo app spostate " + added_per_cicle);
            if (added_per_cicle == 0) {
                combo_zero++;
            } else {
                combo_zero = 0;
            }
        }
        if (spazio_creato > 0) {
            precisione.precisione_rovesciamento = precisione.precisione_rovesciamento * 0.5;
        } else {
            precisione.precisione_rovesciamento = precisione.precisione_rovesciamento * 3;
        }
        console.log(`App spostate per creare spazio: ${spazio_creato}`);
        console.log("Riempimento server..");
        let total_add = 0;
        do
        {
            added = 0;
            const v_pendence_cpu = vector_pendence_cpu(single_server_status_sum_up, 1);
            v_pendence_cpu.forEach(server_el => {
                const best_match = the_best_solution(single_server_status_sum_up[server_el], application_sum_up, precisione.precisione_iniettamento);
                if (best_match.id_app != -1) {
                    added++;
                    total_add++;
                    changed++;
                    //devo togliere da app count
                    logger.write(`inst_${application_sum_up[best_match.id_app].free_istance[0] + 1},machine_${server_el + 1}\n`);
                    application_sum_up[best_match.id_app]
                        .on_server_istance
                        .push({
                            id_istance: application_sum_up[best_match.id_app].free_istance[0],
                            id_server: server_el,
                            index_server_type: single_server_status_sum_up[server_el].type_index
                        })
                    single_server_status_sum_up[server_el]
                        .list_id_app
                        .push(best_match.id_app);
                    single_server_status_sum_up[server_el]
                        .list_id_istance
                        .push(application_sum_up[best_match.id_app].free_istance[0]);
                    application_sum_up[best_match.id_app].count--;
                    application_sum_up[best_match.id_app]
                        .free_istance
                        .splice(0, 1);
                    update_server(single_server_status_sum_up[server_el], application_sum_up[best_match.id_app], 1);
                    istanze_rimaste--;
                    console.log(`Riempio il server : ${server_el} +1 --- Istanze aggiunte finora ${added} --- Istanze rimaste ${istanze_rimaste}`);
                }
            })
            console.log("Istanze aggiunte: " + added);
        }
        while (added > 0) 
        ;
        if (total_add == 0) {
            precisione.precisione_iniettamento = precisione.precisione_iniettamento * 3;
        } else {
            precisione.precisione_iniettamento = precisione.precisione_iniettamento * 0.5;
        }
        istanze_rimaste = 0;
        application_sum_up.forEach(el => {
            istanze_rimaste += el.count;
        })
        do
        {
            times++;
            const v_pendence_cpu = vector_pendence_cpu(single_server_status_sum_up, -1);
            const app_whish = [];
            swiched = 0;
            //0 in 1 out
            for (let i = 0; i < application_sum_up.length; app_whish.push({id_server_in: [], id_server_out: []}), i++) 
            ;
            v_pendence_cpu.forEach(server_id => {
                const solution_in = the_best_solution_without_count_condition(single_server_status_sum_up[server_id], application_sum_up,precisione.precisione_shuffle);
                const solution_out = the_best_solution_inverse(single_server_status_sum_up[server_id], application_sum_up);
                if (solution_in.id_app != -1) {
                    app_whish[solution_in.id_app]
                        .id_server_in
                        .push(server_id);
                };
                if (solution_out.id_app != -1) {
                    app_whish[solution_out.id_app]
                        .id_server_out
                        .push(server_id);
                };

            });
            //guardo se si riescono a fare matching
            let total_swiched = 0;
            console.log("Inizio fase scambio per ottimizzazione spazio");
            for (let i = 0; i < app_whish.length; i++) {
                if (app_whish[i].id_server_out.length > 0 && app_whish[i].id_server_in.length > 0) {
                    //scambio... fino a quando possibile
                    do
                    {
                        for (let j = 0; app_whish[i].id_server_in.length > 0 && app_whish[i].id_server_out.length > 0 && j < single_server_status_sum_up[app_whish[i].id_server_out[0]].list_id_app.length; j++) {
                            if (single_server_status_sum_up[app_whish[i].id_server_out[0]].list_id_app[j] == i) {
                                changed++;
                                total_swiched++;
                                for (let k = 0; k < application_sum_up[i].on_server_istance.length; k++) {
                                    if (application_sum_up[i].on_server_istance[k].id_server == app_whish[i].id_server_out[0]) {
                                        //trovato va cambiato id_server
                                        logger.write(`inst_${application_sum_up[i].on_server_istance[k].id_istance + 1},machine_${app_whish[i].id_server_in[0] + 1}\n`);
                                        application_sum_up[i].on_server_istance[k].id_server = app_whish[i].id_server_in[0];
                                        application_sum_up[i].on_server_istance[k].index_server_type = single_server_status_sum_up[app_whish[i].id_server_in[0]].type_index;
                                    }
                                }
                                single_server_status_sum_up[app_whish[i].id_server_in[0]]
                                    .list_id_app
                                    .push(single_server_status_sum_up[app_whish[i].id_server_out[0]].list_id_app[j]);
                                single_server_status_sum_up[app_whish[i].id_server_in[0]]
                                    .list_id_istance
                                    .push(single_server_status_sum_up[app_whish[i].id_server_out[0]].list_id_istance[j]);
                                single_server_status_sum_up[app_whish[i].id_server_out[0]]
                                    .list_id_app
                                    .splice(j, 1);
                                single_server_status_sum_up[app_whish[i].id_server_out[0]]
                                    .list_id_istance
                                    .splice(j, 1);
                                j = single_server_status_sum_up[app_whish[i].id_server_out[0]].list_id_app.length;
                                update_server(single_server_status_sum_up[app_whish[i].id_server_in[0]], application_sum_up[i], 1);
                                update_server(single_server_status_sum_up[app_whish[i].id_server_out[0]], application_sum_up[i], -1);
                                swiched++;
                                app_whish[i]
                                    .id_server_in
                                    .splice(0, 1);
                                app_whish[i]
                                    .id_server_out
                                    .splice(0, 1);
                            }
                        }
                    }
                    while (app_whish[i].id_server_out.length > 0 && app_whish[i].id_server_in.length > 0) ;
                    }
                }
            console.log("App scambiate: " + swiched);
            if (total_swiched == 0) {
                precisione.precisione_shuffle = precisione.precisione_shuffle * 3;
            } else {
                precisione.precisione_shuffle = precisione.precisione_shuffle * 0.5;
            }
        }
        while (times < 20 && swiched > 0) 
        ;
        console.log("Azioni compiute: " + changed);
    }
    while (changed > 0 && istanze_rimaste > 0) 
    ;
    console.log("Sono rimasti: " + istanze_rimaste + " istanze");
    if (files.tag == 'A') {
        logger.write('#\n');
    }
});
logger.end();

// restituisce un vettore di id ordinato in modo decrescente per utilizzo medio
// cpu
function vector_average_order(app, crescente_decrescente) {
    const a = [];
    const res = [];
    app.forEach(application => {
        a.push({id_app: application.id_app, avg_cpu: application.resource_needed.avg_cpu});
    });
    a.sort((a, b) => {
        if (a.avg_cpu < b.avg_cpu) 
            return -1 * crescente_decrescente;
        if (a.avg_cpu > b.avg_cpu) 
            return 1 * crescente_decrescente;
        return 0;
    })
    //dal meno costoso in cpu
    a.forEach(el => {
        if (app[el.id_app].count > 0) {
            res.push(el.id_app);
        }
    })
    return res;
}
function vector_free_cpu_average(single_server_list, crescente_decrescente) {
    const a = [];
    const res = [];
    single_server_list.forEach(server => {
        let average = 0;
        server
            .cpu_status
            .forEach(el => {
                average += el;
            })
        average = average / server.cpu_status.length;
        a.push({id_server: server.id_server, average_free_cpu: average});
    });
    a.sort((a, b) => {
        if (a.average_free_cpu < b.average_free_cpu) 
            return -1 * (crescente_decrescente);
        if (a.average_free_cpu > b.average_free_cpu) 
            return 1 * (crescente_decrescente);
        return 0;
    });
    //dal meno libero in cpu
    a.forEach(el => {
        res.push(el.id_server);
    });
    return res;
}
function vector_pendence_cpu(single_server_list, crescente_decrescente) { //1 crescente -1 decrescente
    const a = [];
    const res = [];
    single_server_list.forEach(server => {
        const b = prestazioni_server(server);
        a.push({id_server: server.id_server, cpu_pendence: b.convergenza_cpu, ram_pendence: b.convergenza_ram});
    });
    a.sort((a, b) => {
        if (a.convergenza_cpu < b.convergenza_cpu) 
            return -1 * (crescente_decrescente);
        if (a.convergenza_cpu > b.convergenza_cpu) 
            return 1 * (crescente_decrescente);
        return 0;
    });
    //dal meno libero in cpu
    a.forEach(el => {
        res.push(el.id_server);
    });
    return res;
}
function compatible_list_id(list_main, id_to_add, app_status) {
    let min = app_status[id_to_add].self_limit,
        count = 1;
    //ricerca count minimo
    app_status[id_to_add]
        .inverse_other_conflict
        .forEach(el => {
            if (list_main.includes(el.id_app) && min > el.max) {
                min = el.max;
            }
        });
    list_main.forEach(el => {
        if (el == id_to_add) {
            count++;
        }
    });
    // caso fosse possibile metterlo va verificato il contrario, lui ad altri e
    // rispetta il self limit
    if (count <= min) {
        const count_app = [];
        let i;
        //crea count per app
        list_main.forEach(app => {
            for (i = 0; i < count_app.length; i++) {
                if (count_app[i].id_app == app) {
                    count_app[i].count++;
                }
            }
            if (i == count_app.length) {
                count_app.push({id_app: app, count: 1});
            }
        })
        for (i = 0; i < app_status[id_to_add].other_conflict.length; i++) {
            if (list_main.includes(app_status[id_to_add].other_conflict[i].id_app)) {
                let j;
                for (j = 0; j < count_app.length; j++) {
                    if (count_app[j].id_app == app_status[id_to_add].other_conflict[i].id_app) {
                        if (count_app[j].count > app_status[id_to_add].other_conflict[i].max) {
                            j = -1;
                        }
                        break;
                    }
                }
                if (j == -1) {
                    //vuol dire che non va bene => uscita forzata
                    i = -1;
                    break;
                }
            }
        }
        if (i == -1) {
            //ok non
            return 1;
        } else {
            return 0;
        }
    }
}
function compatible_resource_server(server_resource_in, id_to_add, app_status) { //0 free priority 1 on_server priority
    const server_resource = JSON.parse(JSON.stringify(server_resource_in));
    server_resource.memory -= app_status[id_to_add].resource_needed.memory;
    server_resource.pm -= app_status[id_to_add].resource_needed.pm;
    server_resource.m -= app_status[id_to_add].resource_needed.m;
    server_resource.p -= app_status[id_to_add].resource_needed.p;
    if (server_resource.memory >= 0 && server_resource.pm >= 0 && server_resource.m >= 0 && server_resource.p >= 0) {
        let i;
        for (i = 0; i < server_resource.cpu_status.length; server_resource.cpu_status[i] -= app_status[id_to_add].resource_needed.cpu[i], server_resource.ram_status[i] -= app_status[id_to_add].resource_needed.ram[i], i++) 
        ;
        for (i = 0; i < server_resource.cpu_status.length && server_resource.cpu_status[i] >= 0 && server_resource.ram_status[i] >= 0; i++) 
        ;
        if (i == server_resource.cpu_status.length) {
            //puo essere più intelligente prendendo quello in uso e spostandolo
            server_resource
                .list_id_app
                .push(id_to_add);
            server_resource
                .list_id_istance
                .push(app_status[id_to_add].free_istance[0]);
            // 0 => istanza free 1 => istanza in uso
            return {is_possible: 0, type_istance: 0, index_istance_to_delete: 0, new_server_resource: server_resource}
        } else {
            return {is_possible: 1};
        }
    } else {
        return {is_possible: 1};
    }
}
function the_best_solution(server_resource, app_status_all, precision) {
    //quello che meglio aprossima
    let status_convergenza = {
        id_app: -1,
        convergenza_ram: 0,
        convergenza_cpu: 0,
        cpu: server_resource.cpu_status,
        ram: server_resource.ram_status
    }
    for (let j = 0; j < app_status_all.length; j++) {
        const app = app_status_all[j];
        if (app.count > 0 && compatible_list_id(server_resource.list_id_app, app.id_app, app_status_all) == 0) {
            const res = compatible_resource_server(server_resource, app.id_app, app_status_all);
            if (res.is_possible == 0) {
                let current_convergenza = {
                    convergenza_ram: 0,
                    convergenza_cpu: 0,
                    avg_ram: 0,
                    avg_cpu: 0
                }
                for (let i = 0; i < status_convergenza.cpu.length; current_convergenza.avg_cpu += res.new_server_resource.cpu_status[i], current_convergenza.avg_ram += res.new_server_resource.ram_status[i], i++) 
                ;
                current_convergenza.avg_cpu = current_convergenza.avg_cpu / server_resource.cpu_status.length;
                current_convergenza.avg_ram = current_convergenza.avg_ram / server_resource.ram_status.length;
                for (let i = 0; i < status_convergenza.cpu.length; i++) {
                    current_convergenza.convergenza_cpu += res.new_server_resource.cpu_status[i] / current_convergenza.avg_cpu;
                    current_convergenza.convergenza_ram += res.new_server_resource.ram_status[i] / current_convergenza.avg_ram;
                }
                //confronto con il prescelto
                if (status_convergenza.id_app == -1 || (current_convergenza.convergenza_cpu < status_convergenza.convergenza_cpu || (current_convergenza.convergenza_cpu + current_convergenza.convergenza_ram < status_convergenza.convergenza_cpu + status_convergenza.convergenza_ram))) {
                    status_convergenza.id_app = app.id_app;
                    status_convergenza.convergenza_cpu = current_convergenza.convergenza_cpu;
                    status_convergenza.convergenza_ram = current_convergenza.convergenza_ram;
                    status_convergenza.cpu = res.new_server_resource.cpu_status;
                    status_convergenza.cpu = res.new_server_resource.ram_status;
                    if (status_convergenza.convergenza_cpu < precision) {
                        j = app_status_all.length;
                    }
                }
            }
        }
    }
    return status_convergenza;
}
function the_best_solution_inverse(server_resource, app_status_all) {
    //quello che meglio aprossima quale app se tolta porta a tanti benifici?
    const inizialization = prestazioni_server(server_resource);
    let status_convergenza = {
        id_app: -1,
        convergenza_ram: inizialization.convergenza_ram,
        convergenza_cpu: inizialization.convergenza_cpu,
        cpu: server_resource.cpu_status,
        ram: server_resource.ram_status
    }
    if (server_resource.list_id_app.length > 1) {
        server_resource
            .list_id_app
            .forEach(app => {
                const server_cloned = JSON.parse(JSON.stringify(server_resource));
                let current_convergenza = {
                    convergenza_ram: 0,
                    convergenza_cpu: 0,
                    avg_ram: 0,
                    avg_cpu: 0
                }
                server_cloned.memory += app_status_all[app].resource_needed.memory;
                server_cloned.pm += app_status_all[app].resource_needed.pm;
                server_cloned.m += app_status_all[app].resource_needed.m;
                server_cloned.p += app_status_all[app].resource_needed.p;
                for (let i = 0; i < server_cloned.cpu_status.length; server_cloned.cpu_status[i] += app_status_all[app].resource_needed.cpu[i], server_cloned.ram_status[i] += app_status_all[app].resource_needed.ram[i], i++) 
                ;
                /*puo essere più intelligente prendendo quello in uso e spostandolo*/
                // continua da qui tolgo e verifico convergenza... quindi va a priori calcolata
                // la convergenza
                for (let i = 0; i < status_convergenza.cpu.length; current_convergenza.avg_cpu += server_cloned.cpu_status[i], current_convergenza.avg_ram += server_cloned.ram_status[i], i++) 
                ;
                current_convergenza.avg_cpu = current_convergenza.avg_cpu / server_cloned.cpu_status.length;
                current_convergenza.avg_ram = current_convergenza.avg_ram / server_cloned.ram_status.length;
                for (let i = 0; i < status_convergenza.cpu.length; i++) {
                    current_convergenza.convergenza_cpu += server_cloned.cpu_status[i] / current_convergenza.avg_cpu;
                    current_convergenza.convergenza_ram += server_cloned.ram_status[i] / current_convergenza.avg_ram;
                }
                //confronto con il prescelto
                if (status_convergenza.id_app == -1 || (current_convergenza.convergenza_cpu < status_convergenza.convergenza_cpu || (current_convergenza.convergenza_cpu + current_convergenza.convergenza_ram < status_convergenza.convergenza_cpu + status_convergenza.convergenza_ram))) {
                    status_convergenza.id_app = app;
                    status_convergenza.convergenza_cpu = current_convergenza.convergenza_cpu;
                    status_convergenza.convergenza_ram = current_convergenza.convergenza_ram;
                    //errato sono divisi
                    status_convergenza.cpu = server_cloned.cpu_status;
                    status_convergenza.cpu = server_cloned.ram_status;
                }
            });
    }
    return status_convergenza;
}
function convergenza(server_resource, id_app) {} //forse inutile
function prestazioni_server(server) {
    let current_convergenza = {
        convergenza_ram: 0,
        convergenza_cpu: 0,
        avg_ram: 0,
        avg_cpu: 0
    }
    // continua da qui tolgo e verifico convergenza... quindi va a priori calcolata
    // la convergenza
    for (let i = 0; i < server.cpu_status.length; current_convergenza.avg_cpu += server.cpu_status[i], current_convergenza.avg_ram += server.ram_status[i], i++) 
    ;
    current_convergenza.avg_cpu = current_convergenza.avg_cpu / server.cpu_status.length;
    current_convergenza.avg_ram = current_convergenza.avg_ram / server.ram_status.length;
    for (let i = 0; i < server.cpu_status.length; i++) {
        current_convergenza.convergenza_cpu += server.cpu_status[i] / current_convergenza.avg_cpu;
        current_convergenza.convergenza_ram += server.ram_status[i] / current_convergenza.avg_ram;
    }
    return current_convergenza;
}
function update_server(server, application, add_or_delete) {
    //1 add -1 delete
    if (add_or_delete == 1) {
        add_or_delete = -1;
    } else {
        add_or_delete = 1;
    }
    server.memory += (add_or_delete) * application.resource_needed.memory;
    server.pm += (add_or_delete) * application.resource_needed.pm;
    server.m += (add_or_delete) * application.resource_needed.m;
    server.p += (add_or_delete) * application.resource_needed.p;
    for (let i = 0; i < server.ram_status.length; server.cpu_status[i] += (add_or_delete) * application.resource_needed.cpu[i], server.ram_status[i] += (add_or_delete) * application.resource_needed.ram[i], i++) ;
    }

function the_best_solution_without_count_condition(server_resource, app_status_all, precisone) {
    //quello che meglio aprossima
    let status_convergenza = {
        id_app: -1,
        convergenza_ram: 0,
        convergenza_cpu: 0,
        cpu: server_resource.cpu_status,
        ram: server_resource.ram_status
    }
    for (let j = 0; j < app_status_all.length; j++) {
        const app = app_status_all[j];
        if (app.on_server_istance.length > 0) {
            if (compatible_list_id(server_resource.list_id_app, app.id_app, app_status_all) == 0) {
                const res = compatible_resource_server(server_resource, app.id_app, app_status_all);
                if (res.is_possible == 0) {
                    let current_convergenza = {
                        convergenza_ram: 0,
                        convergenza_cpu: 0,
                        avg_ram: 0,
                        avg_cpu: 0
                    }
                    for (let i = 0; i < status_convergenza.cpu.length; current_convergenza.avg_cpu += res.new_server_resource.cpu_status[i], current_convergenza.avg_ram += res.new_server_resource.ram_status[i], i++) 
                    ;
                    current_convergenza.avg_cpu = current_convergenza.avg_cpu / server_resource.cpu_status.length;
                    current_convergenza.avg_ram = current_convergenza.avg_ram / server_resource.ram_status.length;
                    for (let i = 0; i < status_convergenza.cpu.length; i++) {
                        current_convergenza.convergenza_cpu += res.new_server_resource.cpu_status[i] / current_convergenza.avg_cpu;
                        current_convergenza.convergenza_ram += res.new_server_resource.ram_status[i] / current_convergenza.avg_ram;
                    }
                    //confronto con il prescelto
                    if (status_convergenza.id_app == -1 || (current_convergenza.convergenza_cpu < status_convergenza.convergenza_cpu || (current_convergenza.convergenza_cpu + current_convergenza.convergenza_ram < status_convergenza.convergenza_cpu + status_convergenza.convergenza_ram))) {
                        status_convergenza.id_app = app.id_app;
                        status_convergenza.convergenza_cpu = current_convergenza.convergenza_cpu;
                        status_convergenza.convergenza_ram = current_convergenza.convergenza_ram;
                        status_convergenza.cpu = res.new_server_resource.cpu_status;
                        status_convergenza.cpu = res.new_server_resource.ram_status;
                        if (status_convergenza.convergenza_cpu < precisone) {
                            j = app_status_all.length;
                        }
                    }
                }
            }
        }
    };
    return status_convergenza;
}
/*
    console.log(`Analisi dati ${files.tag} \nApp totali: ${file_analisis.app_totali} \nServer totali: ${file_analisis.server_totali} \nIstanze totali: ${file_analisis.istanze_totali} \nAverage cpu: ${file_analisis.average_cpu} \nAverage cpu x server: ${file_analisis.average_cpu_x_server}`);
    fs.writeFile(`./raffinamento_2.0/input_${files.tag}.json`, JSON.stringify({file_analisis, server_sum_up, single_server_status_sum_up, application_sum_up}), (err) => {
        if (err) {
            return console.log(err);
        };
        console.log("Saved file " + files.tag);
    });
 */
function free_server(servers, file) {
    servers.forEach(server => {
        if (server.list_id_istance.length == 0) {
            console.log(`Server ${server.id_server} libero di tipo ${server.type_index} del file ${file.tag}`);
        }
    })
}