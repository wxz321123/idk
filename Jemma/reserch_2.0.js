'use strict';
const fs = require('fs');
const files = ['A', 'B'];
const factor_X = 0.9;
files.forEach(file => {
    //richiesta dati raffinati
    const path = `./raffinamento_2.0/input_${file}.json`;
    const inputData = require(path);
    const server_done = [];
    // vector_average_order(inputData.application_sum_up);
    // vector_quality_rapport_cpu2ram(inputData.application_sum_up);
    // do_couple(inputData.application_sum_up);
    // console.log(inputData.serverType[1]);
    // salvaOutput(`./output/dataset_${file}.json`, serverList);
    // console.log(inputData.file_analisis);
    console.log(inputData.single_server_status_sum_up);
})
function salvaOutput(pathFile, serverList) {
    console.log("Avvio salvataggio..");
    fs.writeFile(pathFile, JSON.stringify({serverList}), (err) => {
        if (err) {
            return console.log(err);
        };
    });
}

function riduciAUno(array) {
    array = array.filter(function (elem, pos) {
        return array.indexOf(elem) == pos;
    });
    return array;
}
// restituisce un vettore di id ordinato in modo decrescente per utilizzo medio
// cpu
function vector_average_order(app) {
    const a = [];
    const res = [];
    app.forEach(application => {
        a.push({id_app: application.id_app, avg_cpu: application.resource_needed.avg_cpu});
    });
    a.sort((a, b) => {
        if (a.avg_cpu < b.avg_cpu) 
            return 1;
        if (a.avg_cpu > b.avg_cpu) 
            return -1;
        return 0;
    })
    a.forEach(el => {
        if (app[el.id_app].count > 0) {
            res.push(el.id_app);
        }
    })
    return res;
}
function vector_quality_rapport_cpu2ram(app) {
    const a = [];
    app.forEach(application => {
        a.push({
            id_app: application.id_app,
            quality: application.resource_needed.avg_cpu / application.resource_needed.avg_ram
        });
    });/*
    a.sort((a, b) => {
        if (a.quality < b.quality)
            return 1;
        if (a.quality > b.quality)
            return -1;
        return 0;
    })*/
    return a;
}
function do_couple(application_sum_up) {
    const couple = [];
    for (let k = 0; k < application_sum_up.length; k++) {
        const app = application_sum_up[k];
        if (app.count > 0) {
            let convergenza_cpu = -1.0,
                id_app_congergente = -1,
                media_cpu,
                convergenza_ram,
                media_ram;
            for (let z = k + 1; z < application_sum_up.length; z++) {
                const app_2 = application_sum_up[z];
                if (app_2.id_app > app.id_app && app_2.count > 0 && app_2.id_app != app.id_app) {
                    let fattibilita = 0;
                    app
                        .other_conflict
                        .forEach(el => {
                            if (el.id_app == app_2.id_app && el.max == 0) {
                                fattibilita = 1;
                            }
                        })
                    if (fattibilita == 0) {
                        app_2
                            .other_conflict
                            .forEach(el => {
                                if (el.id_app == app.id_app && el.max == 0) {
                                    fattibilita = 1;
                                }
                            })
                        if (fattibilita == 0) {
                            let new_average_cpu = 0;
                            let new_convergenza_cpu = 0;
                            let new_average_ram = 0;
                            let new_convergenza_ram = 0;
                            for (let i = 0; i < app.resource_needed.cpu.length; new_average_cpu += app.resource_needed.cpu[i] + app_2.resource_needed.cpu[i], new_average_ram += app.resource_needed.ram[i] + app_2.resource_needed.ram[i], i++) 
                            ;
                            new_average_cpu = new_average_cpu / app.resource_needed.cpu.length;
                            new_average_ram = new_average_ram / app.resource_needed.ram.length;
                            for (let i = 0; i < app.resource_needed.cpu.length; i++) {
                                if ((app.resource_needed.cpu[i] + app_2.resource_needed.cpu[i]) / new_average_cpu > 1) {
                                    new_convergenza_cpu += ((app.resource_needed.cpu[i] + app_2.resource_needed.cpu[i]) / new_average_cpu) - 1;
                                } else {
                                    new_convergenza_cpu += 1 - ((app.resource_needed.cpu[i] + app_2.resource_needed.cpu[i]) / new_average_cpu);
                                }
                                if ((app.resource_needed.ram[i] + app_2.resource_needed.ram[i]) / new_average_ram > 1) {
                                    new_convergenza_ram += ((app.resource_needed.ram[i] + app_2.resource_needed.ram[i]) / new_average_ram) - 1;
                                } else {
                                    new_convergenza_ram += 1 - ((app.resource_needed.ram[i] + app_2.resource_needed.ram[i]) / new_average_ram);
                                }
                            }
                            if (convergenza_cpu == -1 || (convergenza_cpu != -1 && new_convergenza_cpu < convergenza_cpu)) {
                                convergenza_cpu = new_convergenza_cpu;
                                id_app_congergente = app_2.id_app;
                                media_cpu = new_average_cpu;
                                media_ram = new_average_ram;
                                convergenza_ram = new_convergenza_ram;
                            }
                        }
                    }

                }
                if (convergenza_cpu == 0) {
                    z = application_sum_up.length;
                }
            }
            if (id_app_congergente != -1) {
                couple.push({
                    app_convergenti: [
                        app.id_app, id_app_congergente
                    ],
                    average_cpu: media_cpu,
                    indice_convergenza_cpu: convergenza_cpu,
                    average_ram: media_ram,
                    indice_convergenza_ram: convergenza_ram
                });
            }
        }
    }
    couple.sort((a, b) => {
        if (a.average_cpu < b.average_cpu) 
            return 1;
        if (a.average_cpu > b.average_cpu) 
            return -1;
        return 0;
    });
    return couple;
}