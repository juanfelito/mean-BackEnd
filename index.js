'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;

//Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/curso_mean_stack', { useNewUrlParser: true })
                .then(
                    () => {
                        console.log('La conexión a la base de datos se realizó correctamente');

                        //Crear servidor
                        app.listen(port, ()=> {
                            console.log('Servidor creado en puerto '+port);
                        });
                    }
                )
                .catch(err => console.log(err));