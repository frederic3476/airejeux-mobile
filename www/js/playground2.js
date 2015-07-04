//var api_url = "http://www.airejeux.com/api/";
var id;
var url_img = "http://www.airejeux.com/uploads/aires/";
var image;
var comments =[];

app.playground = {
    elems: {
		titre: document.getElementById("titre_playground"),
                description: document.getElementById("description_playground"),
                surface: document.getElementById("surface_playground"),
                age: document.getElementById("age_playground"),
                nbr: document.getElementById("nbr_playground"),
                playground_img: document.getElementById("playground_img"),
                note: document.getElementById("note_playground"),
                note_value: document.getElementById("note_value")
	},
        
        bindEvents: function () {
            //document.getElementById("button_vote").addEventListener("touchend", app.playground.vote, false);
            //document.getElementById("button_comment").addEventListener("touchend", app.playground.comment, false);
            //document.getElementById("favorite").addEventListener("touchend", app.playground.addFavorite, false);
            document.getElementById("footer_vote").addEventListener("touchend", function(){
            document.getElementById("screen_vote").classList.remove('off-screen');
            }, false);
            /*document.getElementById("footer_comment").addEventListener("click", function(){
                document.getElementById("screen_comment").classList.remove('off-screen2');
            }, false);*/
            
            
        },
        
        clear: function(){
            app.playground.elems.titre.innerHTML = "";
            app.playground.elems.description.innerHTML = "";
            app.playground.elems.surface.innerHTML = "";
            app.playground.elems.age.innerHTML = "";
            app.playground.elems.nbr.innerHTML = "";
            document.getElementById("note_value").innerHTML = "";
            app.playground.elems.playground_img.src = "img/imagedefaut.png";
            document.getElementById('comments').innerHTML = "";
            comments = [];
            stars = document.getElementById("note_playground").querySelectorAll(".casquette");

            Array.prototype.forEach.call(
                stars, function (item) {
                    if (item.classList.contains('full')){
                        item.classList.remove('full');
                        item.classList.add('empty');
                    }
                });
        },
        
        show: function(from){
            // from = 1 (network) 
            app.playground.bindEvents();
            app.playground.clear();
            if (!sessionStorage.getItem("playground_id"))
            {
                alert('erreur');
            }
            else{
            id = sessionStorage.getItem("playground_id");
            
            //show in local if exist
            db.transaction(function(tx) {
               tx.executeSql("select * from aire where aire.id= "+id,
                                [],
                                function(tx, res) {
                                    if (res.rows.length === 0 || from === 1){
                                        //network location
                                        httpReq.getJSON(api_url+"playgrounds/"+id, 
                                            function(status, data) {
                                                var result = {
                                                    nom :  data.nom,
                                                    description : data.description,
                                                    surface : data.surface,
                                                    age_min : data.age_min,
                                                    age_max : data.age_max,
                                                    nbr_jeux : data.nbr_jeux,
                                                    average : data.average,
                                                    file_name : (data.file_name?data.file_name:null)
                                                };
                                                app.playground.applyData(result);
                                                app.playground.addComments(data.comments);   
                                               
                                            });
                                    }
                                    else{
                                        //local location
                                        var result = {
                                                    nom :  res.rows.item(0).nom,
                                                    description : res.rows.item(0).description,
                                                    surface : res.rows.item(0).surface,
                                                    age_min : res.rows.item(0).age_min,
                                                    age_max : res.rows.item(0).age_max,
                                                    nbr_jeux : res.rows.item(0).nbr_jeux,
                                                    average : res.rows.item(0).average,
                                                    file_name : (res.rows.item(0).file_name?res.rows.item(0).file_name:null)
                                                };
                                        app.playground.applyData(result);
                                        
                                        //get comments from network
                                        httpReq.getJSON(api_url+"playgrounds/"+id, 
                                            function(status, data) {
                                                app.playground.addComments(data.comments);  
                                            });
                                    }
                                }); 
                
            });
            //app.playground.addVoteSystem();
                    
            
        }
        },
        
        applyData: function(data){
            if (data.file_name)
                {
                    app.playground.elems.playground_img.src = url_img + data.file_name;
                }
                else {
                    if (sessionStorage.getItem("token"))
                    {
                        app.playground.elems.playground_img.addEventListener("touchend", app.playground.changePicture, false);
                    }
                }
                app.playground.elems.titre.innerHTML = data.nom;
                app.playground.elems.description.innerHTML = data.description;
                app.playground.elems.surface.innerHTML = "Surface : " + (data.surface ? data.surface : "NC");
                app.playground.elems.age.innerHTML = "Age : de " + data.age_min + " à " + data.age_max + " ans";
                app.playground.elems.nbr.innerHTML = "Nombre de jeux: " + data.nbr_jeux;
                if (data.average) {
                    app.playground.showNote(data.average);
                    app.playground.elems.note_value.innerHTML = data.average;
                }
        },
        
        showNote: function(average){
            for (i=0.5;i<=5;i+=0.5){
                if (i-0.25<=average){
                    document.getElementById('note-'+i).classList.remove('empty');
                    document.getElementById('note-'+i).classList.add('full');
                }
            }
        },
        
        addVoteSystem: function(){
            if (sessionStorage.getItem("token")){
                token = sessionStorage.getItem("token");
                document.getElementById("vote_data").classList.remove('hidden');
            }
        },
        
        addComments: function(data){
            for (i in data){
                if (comments.inArray(data[i].id) === -1){
                    var main_div = document.createElement('div');
                    document.getElementById('comments').appendChild(main_div);
                    main_div.classList.add('panel');
                    var header_div = document.createElement('div');
                    header_div.classList.add('panel-heading');
                    header_div.innerHTML = "Par "+data[i].user.username+" <span class=\"comment_date\">"+data[i].created_at.transformUTCDate()+"</span>";
                    var body_div = document.createElement('div');
                    body_div.classList.add('panel-body');
                    body_div.innerHTML = data[i].texte;

                    main_div.appendChild(header_div);
                    main_div.appendChild(body_div);
                    comments.push(data[i].id);
                }
            }
        },
       
        showComments: function (){
            this.classList.add('hidden');
            document.getElementById("comments").classList.remove('hidden');
        },
        
        vote: function(){
            var data = {
                score: document.getElementById("select_note").value,
                aire_id: id
            };
            cordovaHTTP.post(api_url+"votes", data,{"X-WSSE": token}, function(response) {
              app.makeToast('Vous avez voté avec succès !');
              app.playground.show(1);
          
          }, function(response) {
                navigator.notification.alert(response.error, function(){});
          });
        },
        
        comment: function(){
            var data = {
                texte: document.getElementById("comment").value,
                aire_id: id
            };
            cordovaHTTP.post(api_url+"comments", data,{"X-WSSE": token}, function(response) {
              app.makeToast('Vous avez commenté avec succès !');
              app.playground.show(1);
          
          }, function(response) {
                navigator.notification.alert(response.error, function(){});
          });
        },
        
        changePicture: function() {
            navigator.camera.getPicture(app.playground.onPictureSuccess, app.playground.onPictureFail, {
                quality: 70,
                destinationType: Camera.DestinationType.DATA_URL,
                targetWidth: 500,
                targetHeight: 500,
                saveToPhotoAlbum: false});
        },
        
        onPictureSuccess: function (imageURI) {
            image = imageURI;
            app.playground.elems.playground_img.src = "data:image/jpeg;base64," + imageURI;
            navigator.notification.confirm('Envoyer la photo ?', app.playground.onConfirmPicture, 'Conformation', ['oui', 'non']);
        },
        
        onPictureFail: function (message) {
            //navigator.notification.alert('Failed because: ' + message, function () {
            //});
        },
        
        onConfirmPicture: function(buttonIndex){
            if (buttonIndex === 1 )
            {
                console.log('changement photo');
                var data = {
                img64: image,
                aire_id: id
                    };
                    cordovaHTTP.post(api_url+"uploads/pictures.json", data,{"X-WSSE": token}, function(response) {
                      app.makeToast('Photo envoyé avec succés');
                      app.playground.show(1);

                  }, function(response) {
                        navigator.notification.alert(response.error, function(){});
                  });
            }
            else{
                app.playground.elems.playground_img.src = "img/imagedefaut.png";
            }
        }
        
};





