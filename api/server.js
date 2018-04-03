var express = require('express');
var multiparty = require('connect-multiparty')
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var objectId = require('mongodb').ObjectId;
var fs = require("fs");

var app = express();

//body-parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(multiparty());

var port = 8000;
app.listen(port);

var db = new mongodb.Db(
    'Instagram',
    new mongodb.Server('localhost', 27017,{}),
    {}
);

console.log('Servidor HTTP está escutando na porta ' + port);

app.get('/', function(req, res){
    res.send({msg:'Olá'});
});

//Get
app.get('/api', function(req, res){            
    res.setHeader("Access-Control-Allow-Origin","*");//* Qualquer dominio ou o ip do request 
    
    db.open( function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find().toArray(function(err,results){
                if( err ){
                    res.json(err);
                }else{
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });
});

//Get By ID
app.get('/api/:id', function(req, res){            
    db.open( function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find(objectId(req.params.id)).toArray(function(err,results){
                if( err ){
                    res.json(err);
                }else{
                    res.status(200).json(results);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/uploads/:imagem', function(req, res){
    var img = req.params.imagem;

    fs.readFile('/uploads/' + img, function(err, content){
        if(err){
            res.status(400).json(err);
            return;
        }
        
        res.writeHead(200, {'content-type':'imagem/jpeg'});
        res.end(content);

    });

});

//PUT By ID (Update)
app.put('/api/:id', function(req, res){            
    db.open( function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                {_id : objectId(req.params.id)},
                { $set : {titulo : req.body.titulo}},
                { },
                function(err, records){
                    if( err ) {
                        res.json(err);
                    } else {
                        res.json(records);
                    }
                    mongoclient.close();
                }
            );
        });
    });
});

//DELETE By ID (Delete)
app.delete('/api/:id', function(req, res){            
    db.open( function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
        collection.remove({ _id : objectId(req.params.id)}, function(err, records){
                if( err ) {
                    res.json(err);
                } else {
                    res.json(records);
                }
                mongoclient.close();
            });
        });
    });
});

//Post
app.post('/api', function(req, res){
    
    res.setHeader("Access-Control-Allow-Origin","*");//* Qualquer dominio ou o ip do request 
    
    var date = new Date();
    var time_stamp = date.getTime();

    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;
    
    fs.rename(path_origem, path_destino, function(err){
        if( err ) {
            res.status(500).json({error : err});
            return;
        }

        var dados = {
            url_imagem : url_imagem,
            titulo : req.body.titulo
        }

        db.open( function(err, mongoclient){
            mongoclient.collection('postagens', function(err, collection){
                collection.insert(dados, function(err, records){
                    if( err ){
                        res.json({'status' : 'error'});
                    }else{
                        res.json({'status' : 'Inclusão realizada com sucesso!'});
                    }                  
                    mongoclient.close();
                });
            });
        });
    })    
});