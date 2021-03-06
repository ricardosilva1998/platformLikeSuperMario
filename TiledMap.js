/*
	C�digo original: Colt McAnlis (Google Advocate Developer): http://mainroach.blogspot.com/p/about.html 
	Adapta��o: Cl�udio Barradas (2018)
	Qualquer modifica��o dever� manter semrpe refer�ncia ao c�digo original.
	
*/
var TiledMap = Class.extend(function () {
    // This is where we store the full parsed
    // JSON of the map.json file.
    this.currMapData=null;
	var callback=null;
	this.path="";
    // tilesets stores each individual tileset
    // from the map.json's 'tilesets' Array.
    // The structure of each entry of this
    // Array is explained below in the
    // parseAtlasDefinition method.
    this.tilesets= [];

    // This is where we store the width and
    // height of the map in tiles. This is
    // in the 'width' and 'height' fields
    // of map.json, respectively.
    // The values 100 here are just set
    // so these fields are initialized to
    // something, rather than null.
    this.numXTiles= 100;
    this.numYTiles= 100;

    // The size of each individual map
    // tile, in pixels. This is in the
    // 'tilewidth' and 'tileheight' fields
    // of map.json, respectively.
    // The values 64 here are just set
    // so these fields are initialized to
    // something, rather than null.
    this.tileSize= {
        "x": 64,
        "y": 64
    };
	
	this.getWidth= function(){
		return this.numXTiles*this.tileSize.x;
	}
	
	this.getHeight= function(){
		return this.numYTiles*this.tileSize.y;
	}
    // The size of the entire map,
    // in pixels. This is calculated
    // based on the 'numXTiles', 'numYTiles',
    // and 'tileSize' parameters.
    // The values 64 here are just set
    // so these fields are initialized to
    // something, rather than null.
    this.pixelSize= {
        "x": 64,
        "y": 64
    };

    // Counter to keep track of how many tile
    // images we have successfully loaded.
    this.imgLoadCount= 0;

    // Boolean flag we set once our tile images
    // has finished loading.
    this.fullyLoaded= false;

	//-----------------------------------------
    // Load the json file at the url 'map' into
    // memory. This is similar to the requests
    // we've done in the past using
    // XMLHttpRequests.
    this.load= function (path,mapJSON,_callback) {
		callback=_callback;
        // Perform an XMLHttpRequest to grab the
        // JSON file at url 'map'0
		this.path=path;
		var url=path+"/"+mapJSON;
		var ajax = new AJAX(); 
		
        ajax.request(url,"GET", "application/json;charset=UTF-8", true, function (data) {
            // Once the XMLHttpRequest loads, call the
            // parseMapJSON method.
            this.parseMapJSON(data.responseText);
        }.bind(this));
    };

    //-----------------------------------------
    // Parses the map data from 'mapJSON', then
    // stores that data in a number of members
    // of our 'TILEDMapClass' that are defined
    // above.
    this.parseMapJSON= function (mapJSON) {
        // Call JSON.parse on 'mapJSON' and store
        // the resulting map data
        this.currMapData = JSON.parse(mapJSON);

        var map = this.currMapData;
      
        // Set 'numXTiles' and 'numYTiles' from the
        // 'width' and 'height' fields of our parsed
        // map data.
        this.numXTiles = map.width;
        this.numYTiles = map.height;
      
        // Set the 'tileSize.x' and 'tileSize.y' fields
        // from the 'tilewidth' and 'tileheight' fields
        // of our parsed map data.
        this.tileSize.x = map.tilewidth;
        this.tileSize.y = map.tileheight;
      
        // Set the 'pixelSize.x' and 'pixelSize.y' fields
        // by multiplying the number of tiles in our map
        // by the size of each tile in pixels.
        this.pixelSize.x = this.numXTiles * this.tileSize.x;
        this.pixelSize.y = this.numYTiles * this.tileSize.y;

        // Loop through 'map.tilesets', an Array...
        for(var i = 0; i < map.tilesets.length; i++) {

            // ...loading each of the provided tilesets as
            // Images...
            var img = new Image();
            img.onload = function () {
                // ...Increment the above 'imgLoadCount'
                // field of 'TILEDMap' as each tileset is 
                // loading...
                this.imgLoadCount++;
                if (this.imgLoadCount === map.tilesets.length) {
                    // ...Once all the tilesets are loaded, 
                    // set the 'fullyLoaded' flag to true...
                    this.fullyLoaded = true;
							//-- Acrescentado
					//console.log(this.fullyLoaded);
					callback("Tilesheet Loaded");
                }
            }.bind(this);

            // The 'src' value to load each new Image from is in
            // the 'image' property of the 'tilesets'.
            img.src = this.path+'/'+map.tilesets[i].image;

            // This is the javascript object we'll create for
            // the 'tilesets' Array above. First, fill in the
            // given fields with the corresponding fields from
            // the 'tilesets' Array in 'currMapData'.
            var ts = {
                "firstgid": this.currMapData.tilesets[i].firstgid,

                // 'image' should equal the Image object we
                // just created.

                "image": img,
                "imageheight": this.currMapData.tilesets[i].imageheight,
                "imagewidth": this.currMapData.tilesets[i].imagewidth,
                "name": this.currMapData.tilesets[i].name,

                // These next two fields are tricky. You'll
                // need to calculate this data from the
                // width and height of the overall image and
                // the size of each individual tile.
                // 
                // Remember: This should be an integer, so you
                // might need to do a bit of manipulation after
                // you calculate it.

                "numXTiles": Math.floor(this.currMapData.tilesets[i].imagewidth / this.tileSize.x),
                "numYTiles": Math.floor(this.currMapData.tilesets[i].imageheight / this.tileSize.y)
            };

            // After that, push the newly created object into
            // the 'tilesets' Array above. Javascript Arrays
            // have a handy method called, appropriately, 'push'
            // that does exactly this. It takes the object
            // we'd like to put into the Array as a parameter.
            // 
            this.tilesets.push(ts);
		 
        }
	
    };

    //-----------------------------------------
    // Grabs a tile from our 'layer' data and returns
    // the 'pkt' object for the layer we want to draw.
    // It takes as a parameter 'tileIndex', which is
    // the id of the tile we'd like to draw in our
    // layer data.
    this.getTilePacket= function (tileIndex) {

        // We define a 'pkt' object that will contain
        // 
        // 1) The Image object of the given tile.
        // 2) The (x,y) values that we want to draw
        //    the tile to in map coordinates.
        var pkt = {
            "img": null,
            "px": 0,
            "py": 0
        };

        // The first thing we need to do is find the
        // appropriate tileset that we want to draw
        // from.
        //
        // Remember, if the tileset's 'firstgid'
        // parameter is less than the 'tileIndex'
        // of the tile we want to draw, then we know
        // that tile is not in the given tileset and
        // we can skip to the next one.
        var tile = 0;
        for(tile = this.tilesets.length - 1; tile >= 0; tile--) {
            if(this.tilesets[tile].firstgid <= tileIndex) break;
        }

        // Next, we need to set the 'img' parameter
        // in our 'pkt' object to the Image object
        // of the appropriate 'tileset' that we found
        // above.
        pkt.img = this.tilesets[tile].image;


        // Finally, we need to calculate the position to
        // draw to based on:
        //
        // 1) The local id of the tile, calculated from the
        //    'tileIndex' of the tile we want to draw and
        //    the 'firstgid' of the tileset we found earlier.
        var localIdx = tileIndex - this.tilesets[tile].firstgid;

        // 2) The (x,y) position of the tile in terms of the
        //    number of tiles in our tileset. This is based on
        //    the 'numXTiles' of the given tileset. Note that
        //    'numYTiles' isn't actually needed here. Think about
        //    how the tiles are arranged if you don't see this,
        //    It's a little tricky. You might want to use the 
        //    modulo and division operators here.
        var lTileX = Math.floor(localIdx % this.tilesets[tile].numXTiles);
        var lTileY = Math.floor(localIdx / this.tilesets[tile].numXTiles);

        // 3) the (x,y) pixel position in our tileset image of the
        //    tile we want to draw. This is based on the tile
        //    position we just calculated and the (x,y) size of
        //    each tile in pixels.
        pkt.px = (lTileX * this.tileSize.x);
        pkt.py = (lTileY * this.tileSize.y);


        return pkt;
    };

	
	this.getLayerByName=function(layerName){
		var reqLayer=null;
		for(tLayer of this.currMapData.layers){
			if(tLayer.name===layerName){
				reqLayer=tLayer;
				break;
			}
		}
		return reqLayer;
	}
	
	this.getLayer=function(layerIdx){
		return this.currMapData.layers[layerIdx];
	}
	
    //-----------------------------------------
    // Draws all of the map data to the passed-in
    // canvas context, 'ctx'.
    this.draw= function (ctx) {
        // First, we need to check if the map data has
        // already finished loading...
        if(!this.fullyLoaded) return;

        // ...Now, for every single layer in the 'layers' Array
        // of 'currMapData'...
        for(var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++) {
            // Check if the 'type' of the layer is "tilelayer". If it isn't, we don't
            // care about drawing it...
            if(this.currMapData.layers[layerIdx].type != "tilelayer") continue;

            // ...Grab the 'data' Array of the given layer...
            var dat = this.currMapData.layers[layerIdx].data;

            // ...For each tileID in the 'data' Array...
            for(var tileIDX = 0; tileIDX < dat.length; tileIDX++) {
                // ...Check if that tileID is 0. Remember, we don't draw
                // draw those, so we can skip processing them...
                var tID = dat[tileIDX];
                if(tID === 0) continue;

                // ...If the tileID is not 0, then we grab the
                // packet data using getTilePacket.
                var tPKT = this.getTilePacket(tID);

               
                
                var worldX= Math.floor(tileIDX % this.numXTiles ) * this.tileSize.x;
				var worldY= Math.floor(tileIDX  / this.numXTiles ) * this.tileSize.y;
				 
              
                ctx.drawImage(tPKT.img, tPKT.px, tPKT.py,
							this.tileSize.x, this.tileSize.y,
							worldX, worldY,
							this.tileSize.x,
							this.tileSize.y);            
            }
        }
    };

});