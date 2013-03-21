//Global variables
var theCanvas,ctx;
var globalX=0,globalY=0;
var mapCenterX=0;mapCenterY=0;
var innerMapTop=0,innerMapLeft=0;
var dragStartLeft=0,dragStartTop=0;
var dragging=false;

//Variables for measuring
var measureFlag=false;
var measuredLength=0;
var measureUnits = "Miles";
var xPointArray = new Array();
var yPointArray = new Array();

//Used for drawing
var xOffset=-5;
var yOffset=3;

var pixelPerLong=19085.91694; 
var pixelPerLat=19085.91694;
var longMax=-106.7718712;
var latMax=37.84239234;
var tileSizeX=1056;
var tileSizeY=1056;
var zoomSizes=[ [ "1056px", "1056px" ], [ "3168px", "3168px" ], [ "9504px", "9504px" ], [ "28512px", "28512px" ], [ "85536px", "85536px" ], [ "256608px", "256608px" ], [ "769824px", "769824px" ] ];
var divideByArray=new Array(243,81,27,9,3,1);
var blankTileArray=new Array(0,2,8,26,80,242); 
var externalViewerArray=new Array(6,8,10,11,13,15); 
var BlankTiles=0;

var zEvent=0; //not a zoom event = 0, zoom event = 1
var zDirection=0; //zoom in = 0, zoom out = 1
var currentZoom=0;
var mapType="Highway"; 
var extensionType=".png";
var noMap=3;
var overlay = "ClearOverlay";

//Start map operations
function init() {
  outerDiv.onmousedown = startMove;	
  outerDiv.onmousemove = processMove;	
  outerDiv.onmouseup = stopMove;	
	outerDiv.onmousewheel = scrollMap;
	outerDiv.onmouseout = stopMove;
  outerDiv.ondragstart = function() {return false}; // for IE	
  window.onresize = resizeRootElements;
	 
  setInnerMapSize(zoomSizes[currentZoom][0], zoomSizes[currentZoom][1]);	 
  resizeRootElements();
  zoomToFeature(30.6,-96.7,"Highway",0)
	
	 //for drawing
	 theCanvas=document.getElementById("theCanvas");
   ctx=theCanvas.getContext("2d");
	 
	 toggleTable("Districts");	
}

function preventScrollingHandler(event) {
   event.preventDefault();
}

function changeMap(theMap,theExt,maxZoom) {
   mapType=theMap;
	 extensionType=theExt;
	 noMap=maxZoom;
   emptyInnerMap();	 
   checkTiles();  
}

function scrollMap(e) {
	var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if (delta==1) {
		 if (currentZoom < noMap) {
	      toggleZoom("In");
		 }	
	}
	else {
	   if (currentZoom > 0) {
	      toggleZoom("Out");		
		 }
	}
}

function toggleDiv(selectedDiv) {
   if(document.getElementById(selectedDiv).style.display == "block") {
      document.getElementById(selectedDiv).style.display = "none";
      }
   else {
      document.getElementById(selectedDiv).style.display = "block"; 
      }
}

function resizeRootElements() {
  var outerDiv = document.getElementById("outerDiv"); 
  outerDiv.style.width = document.body.clientWidth-285; //was 320
  outerDiv.style.height = document.body.clientHeight-250; //was 200
  
  var tocDiv = document.getElementById("tocDiv"); 
  tocDiv.style.width = 265; //was 300
  tocDiv.style.height = document.body.clientHeight-15;
  
  var tableDiv = document.getElementById("tableDiv"); 
  tableDiv.style.width = document.body.clientWidth-285; //was 320 
  tableDiv.style.top = stripPx(outerDiv.style.height) + 12;
  tableDiv.style.height = document.body.clientHeight-stripPx(outerDiv.style.height)-22;
  checkTiles();
}

function reportMouseCoords() {
   var readOut = document.getElementById("readoutDiv");
   readOut.innerHTML="Map=" + currentZoom + ", NAD83 Unprojected Long=" + globalX + " Lat=" + globalY;
}

function updateGlobalXY(theX,theY) {
   globalX = Math.round(convertPixelXToLong(theX-277) * 10000000) / 10000000; 
   globalY = Math.round(convertPixelYToLat(theY+5) * 10000000) / 10000000;	 
}

function getMapCenter() {
  var outerDiv = document.getElementById("outerDiv"); 
  mapCenterX = Math.round(convertPixelXToLong((stripPx(outerDiv.style.width)/2))*10000000)/10000000; 
  mapCenterY = Math.round(convertPixelYToLat((stripPx(outerDiv.style.height)/2))*10000000)/10000000; 
}

function updateExternalLinks() {
   getMapCenter();
   var linkOut = document.getElementById("linkOut"); 	 
	 linkOut.innerHTML = "<a href='http://maps.google.com/maps?ll=" + mapCenterY + "," + mapCenterX + "&z=" + externalViewerArray[currentZoom] + "' target='_blank'>Google Maps</a><br>";
}

function startMove(e) {
   if (!e) e = window.event; // for IE
	 
   if (e.button==2) {
      if (currentZoom >= 1) {
         currentZoom = currentZoom - 1;
         zoomToFeature(globalY,globalX,mapType,currentZoom);	
      	 if (measureFlag) {
      	    clearCanvas();
      	    reDrawMeasuredLine();	 
      	 }					 				  
      }	  
      return; 
   }	 

   var outerDiv=document.getElementById("outerDiv"); 
   outerDiv.style.cursor="move";	  
   dragStartLeft=e.clientX; 
   dragStartTop=e.clientY; 
   dragging=true;
	 
	 updateGlobalXY(e.clientX,e.clientY);	 
   updateExtents(); 
	 
	 //Begin measuring
   if (measureFlag) {
	    xPointArray.push(globalX);
	    yPointArray.push(globalY);
      reportMeasure();			 
			//document.getElementById("measureResults").innerHTML = Math.round(calculateUnits(measuredLength)*1000)/1000;
			drawCircle(convertLongToPixelX(globalX),convertLatToPixelY(globalY),2,"Red",1,"Red");	 
	 }
	 //End measuring
	 
	 if (identifyFlag) {
	    runIdentify(e,x,y);
      return;
	 }
	 
   return false;
}

function stopMove(e) {
   if (!e) e=window.event; 
   if (dragging) {
      var outerDiv = document.getElementById("outerDiv"); 
      outerDiv.style.cursor = "";;			 
      dragging=false; 
			
		  updateGlobalXY(e.clientX,e.clientY);
      updateExtents();		
			checkTiles();
			
			if(dragStartLeft!=e.clientX||dragStartTop!=e.clientY) {
         if (measureFlag) { 
			      reDrawMeasuredLine();
			   }				
			}
   }
}

function processMove(e) {
   if (!e) e=window.event; 
	 
	 var outerDiv = document.getElementById("outerDiv"); 
	 updateGlobalXY(e.clientX,e.clientY);	  
   reportMouseCoords();	 
	 updateExternalLinks();
	 
	 //For measuring
	 if (measureFlag&&xPointArray.length>0) {
			//document.getElementById("measureResults").innerHTML = Math.round(calculateUnits(reportMeasureDynamic())*1000)/1000;
      document.getElementById("measuredDistance").innerHTML = Math.round(calculateUnits(reportMeasureDynamic())*1000)/1000;			
	 }
	 //End measuring

   if (dragging) {
	 	  clearCanvas();
      var theTop = innerMapTop + (e.clientY - dragStartTop); 
      var theLeft = innerMapLeft + (e.clientX - dragStartLeft); 
      moveInnerDiv(theTop, theLeft);
	 } 
}

function updateExtents() {
   var innerDiv=document.getElementById("innerDiv"); 
   innerMapTop=stripPx(innerDiv.style.top); 
   innerMapLeft=stripPx(innerDiv.style.left); 
}

function moveInnerDiv(theTop, theLeft) {
   var innerDiv = document.getElementById("innerDiv"); 
   innerDiv.style.top = theTop; 
   innerDiv.style.left = theLeft;
}

function stripPx(value) {
   if (value == "") return 0; 
   return parseFloat(value.substring(0, value.length - 2)); 
}

function convertLongToPixelX(theXCoord) {
   var baseXrect = Math.abs(Math.abs(theXCoord) - Math.abs(longMax)) * pixelPerLong; 
   var newposXrect = (baseXrect / divideByArray[currentZoom]); 
   return newposXrect + innerMapLeft; 
}

function convertLatToPixelY(theYCoord) {
   var baseYrect = Math.abs(latMax - theYCoord) * pixelPerLat;
   var newposYrect = (baseYrect / divideByArray[currentZoom]); 
   return newposYrect + innerMapTop; 
}

function convertPixelXToLong(theXPixel) {
   var locX; 
   if (innerMapLeft <= 0) {
      locX = longMax + ((theXPixel + Math.abs(innerMapLeft) - 6) * (divideByArray[currentZoom]) / pixelPerLong);
   }
   else {
      locX = longMax + ((theXPixel - Math.abs(innerMapLeft) - 6) * (divideByArray[currentZoom]) / pixelPerLong);
   }
	 return Math.round(locX*1000000)/1000000;
}

function convertPixelYToLat(theYPixel) {
   var locY; 
   if (innerMapTop <= 0) {
      locY = latMax - ((theYPixel + Math.abs(innerMapTop) - 7) * (divideByArray[currentZoom]) / pixelPerLat);
   }
   else {
      locY = latMax - ((theYPixel - Math.abs(innerMapTop) - 7) * (divideByArray[currentZoom]) / pixelPerLat);
   }
	 return Math.round(locY*1000000)/1000000;
}

function toggleZoom(direction) {
   getMapCenter();
	 
   if (direction == "In") {
      if (currentZoom <= 4) {
         currentZoom = currentZoom + 1;
         zoomToFeature(mapCenterY,mapCenterX,mapType,currentZoom); 				  
      }
   }
   if (direction == "Out") {
      if (currentZoom >= 1) {
         currentZoom = currentZoom - 1; 
         zoomToFeature(mapCenterY,mapCenterX,mapType,currentZoom); 				 
      }
   }
	 
	 if (measureFlag) {
	    clearCanvas();
	    reDrawMeasuredLine();	 
	 }	  
}

function dblclickZoomIn(e) {
	 if (currentZoom <= 4) {
      currentZoom = currentZoom + 1; 
   }

   zoomToFeature(globalY,globalX,mapType,currentZoom);
	 
	 if (measureFlag) {
	    clearCanvas();
	    reDrawMeasuredLine();	 
	 }	 
}

function setInnerMapSize(width, height) {
   var innerDiv = document.getElementById("innerDiv"); 
   innerDiv.style.width = width; 
   innerDiv.style.height = height;
}

function getVisibleTiles() {
   var innerDiv = document.getElementById("innerDiv"); 
   var mapX = stripPx(innerDiv.style.left); 
   var mapY = stripPx(innerDiv.style.top); 
   //for panning
   var startX = Math.abs(Math.floor(mapX / tileSizeX)) - 1; 
   var startY = Math.abs(Math.floor(mapY / tileSizeY)) - 1; 
   var tilesX = Math.ceil((document.body.clientWidth-15) / tileSizeX) + 1; 
   var tilesY = Math.ceil((document.body.clientHeight-15) / tileSizeY) + 1; 
   west = startX * tileSizeX; 
   north = startY * tileSizeY; 
   east = tilesX * tileSizeX + west; 
   south = tilesY * tileSizeY + north; 
   if (currentZoom == 0) {
      startX = 0; 
      startY = 0;
			tilesX = 1;
			tilesY = 1; 
      }
   var visibleTileArray = []; 
   var counter = 0; 
   for (x = startX; x < (tilesX + startX); x++) {
      for (y = startY; y < (tilesY + startY); y++) {
         visibleTileArray[counter++] = [x, y]; 
         }
      }
   return visibleTileArray; 
}

function checkTiles() {
   var visibleTiles = getVisibleTiles(); 
   updateExtents(); 

   var innerDiv = document.getElementById("innerDiv"); 
   var visibleTilesMap = {}; 
	 BlankTiles=blankTileArray[currentZoom];
   for (i = 0; i < visibleTiles.length; i++) {
      var tileArray = visibleTiles[i]; 
			if (tileArray[0] > BlankTiles || tileArray[1] > BlankTiles || tileArray[0] < 0 || tileArray[1] < 0) {
         //Nothing
      }
			else {
			   var tileName = "x" + tileArray[0] + "y" + tileArray[1] + "z" + currentZoom; 
         visibleTilesMap[tileName] = true; 
         var img = document.getElementById(tileName); 
         if (!img) {
            img = document.createElement("img"); 
            if (currentZoom > noMap) {
               img.src = "resources_v3/images/Unavailable.png"; 
            }
            else {
               img.src = "resources_v3/" + mapType + "/z" + currentZoom + "/" + tileName + extensionType + "?" + Math.random(); 
            }
            img.style.position = "absolute"; 
            img.style.left = (tileArray[0] * tileSizeX) + "px"; 
            img.style.top = (tileArray[1] * tileSizeY) + "px"; 
            img.style.zIndex = 0; 
            img.setAttribute("id", tileName); 
            innerDiv.appendChild(img);
				  
            if (overlay != "ClearOverlay") {
               overlayImg = document.createElement("img"); 
               if (currentZoom > noOverlay) {
                  overlayImg.src = "resources_v3/images/Overlay_Unavailable.png"; 
               }
               else {
                  overlayImg.src = "resources_v3/" + overlay + "/z" + currentZoom + "/" + tileName + ".gif?" + Math.random(); 
               }
               overlayImg.style.position = "absolute"; 
               overlayImg.style.left = (tileArray[0] * tileSizeX) + "px"; 
               overlayImg.style.top = (tileArray[1] * tileSizeY) + "px"; 
               overlayImg.style.zIndex = 0; 
               overlayImg.setAttribute("id", tileName); 
               innerDiv.appendChild(overlayImg); 
            }
         }
      }
   }

   var imgs = innerDiv.getElementsByTagName("img"); 
   for (i = 0; i < imgs.length; i++) {
      var id = imgs[i].getAttribute("id"); 
      if (!visibleTilesMap[id]) {
         innerDiv.removeChild(imgs[i]); 
         i--; 
         // compensate for live nodelist
         }
      }
}

function emptyInnerMap() {
   var innerDiv = document.getElementById("innerDiv");
   var imgs = innerDiv.getElementsByTagName("img");
   while (imgs.length > 0) innerDiv.removeChild(imgs[0]);
}

function zoomToFeature(newY,newX,newMap,newZ) {	
   var outerDiv = document.getElementById("outerDiv");
	 var DivWidth = stripPx(outerDiv.style.width);
   var DivHeight = stripPx(outerDiv.style.height);	
	
	 //commenting out the newMap for now, may turn it back on later								 
	 //mapType=newMap;
	 extensionType=".png";
   currentZoom=Number(newZ);
									 
   var baseX = Math.abs(Math.abs(newX)-Math.abs(longMax)) * pixelPerLong;
	 var baseY = Math.abs(latMax-newY) * pixelPerLat;
      							 
   var newposX = Math.round(baseX / divideByArray[currentZoom]);
	 var newposY = Math.round(baseY / divideByArray[currentZoom]);
	 
	 var theLeft = (Number(newposX) - (DivWidth/2))*-1 + "px";
   var theTop = (Number(newposY) - (DivHeight/2))*-1 + "px";

   moveInnerDiv(theTop,theLeft); 								 
   reportMouseCoords();
	 emptyInnerMap();										 										 
   setInnerMapSize(zoomSizes[currentZoom][0], zoomSizes[currentZoom][1]);
   checkTiles();	
}

function toggleTOC(showItem,hideItem1,hideItem2,hideItem3) {
   document.getElementById(showItem).style.display = "block";
   document.getElementById(hideItem1).style.display = "none";
   document.getElementById(hideItem2).style.display = "none";
   document.getElementById(hideItem3).style.display = "none";
	 measureFlag=false;
	 identifyFlag=false;
   clearCanvasCoords();	 
	 
	 if (showItem=="prjMeasure") {
      measureFlag=true;
	 }	
	 else {
	 	  //measureFlag=false;
      //clearCanvasCoords();		
	 } 
	 
	 if (showItem=="prjIdentify") {
	    identifyFlag=true;
	 }	 	 
}

//Start data operations
function GetXmlHttpObject() {
   var objXMLHttp = null; 
   if (window.XMLHttpRequest) {
      objXMLHttp = new XMLHttpRequest(); 
   }
   else if (window.ActiveXObject) {
      objXMLHttp = new ActiveXObject("Microsoft.XMLHTTP"); 
   }
   return objXMLHttp; 
}

function toggleMeasure() {
   if (measureFlag) {
	    measureFlag=false;
			document.getElementById("drawBtn").innerHTML = "Start Drawing";
		  document.getElementById("measureResults").innerHTML = "";
			measuredLength=0;
	    xPointArray.length=0;
      yPointArray.length=0;
			clearCanvas();
	 }
	 else {
	    measureFlag=true;
			//   !!!remove clearing of local storage when everything is completed!!!
			localStorage.clear();
			document.getElementById("drawBtn").innerHTML = "Stop Drawing";	 
	 }
}

//Great Circle Distance
function reportMeasure() {
   if (xPointArray.length > 1) {
	   var i = xPointArray.length;
     var long1 = xPointArray[i-1]; 
     var lat1 = yPointArray[i-1]; 
     var long2 = xPointArray[i-2]; 
     var lat2 = yPointArray[i-2]; 
     var radianConstant = 57.29577951; 
     var arccos = 0; 
     var preformula = 0; 
		 
		 //draw a segment
		 drawLine(convertLongToPixelX(xPointArray[i-1]),convertLatToPixelY(yPointArray[i-1]),convertLongToPixelX(xPointArray[i-2]),convertLatToPixelY(yPointArray[i-2]),2,"Red","Round");
		 
     //Converting decimal degrees to radians for coordinate 1 
     long1 = long1 / radianConstant; 
     lat1 = lat1 / radianConstant; 
     //Converting decimal degrees to radians for coordinate 2
     long2 = long2 / radianConstant; 
     lat2 = lat2 / radianConstant; 
     //calculating the preformula as input to the script arccos function
     preformula = (Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(long2 - long1)); 
     //arccos function with preformula inserted
     arccos = Math.atan( - preformula / Math.sqrt( - preformula * preformula + 1)) + 2 * Math.atan(1); 
     arccos = (3963 * arccos); 
		 measuredLength = Math.round((measuredLength + arccos) * 1000)/1000;
		 return measuredLength;
   }		 
}

//Great Circle Distance with dynamic update
function reportMeasureDynamic() {
   if (xPointArray.length > 0) {
	   var i = xPointArray.length;
		 if (i==1) {
        var long1 = xPointArray[0]; 
        var lat1 = yPointArray[0]; 		    
		 } 
		 else {
		    var long1 = xPointArray[i-1]; 
        var lat1 = yPointArray[i-1]; 
		 }
		 var long2 = globalX; 
     var lat2 = globalY; 
     var radianConstant = 57.29577951; 
     var arccos = 0; 
     var preformula = 0; 
		 
     //Converting decimal degrees to radians for coordinate 1 
     long1 = long1 / radianConstant; 
     lat1 = lat1 / radianConstant; 
     //Converting decimal degrees to radians for coordinate 2
     long2 = long2 / radianConstant; 
     lat2 = lat2 / radianConstant; 
     //calculating the preformula as input to the script arccos function
     preformula = (Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(long2 - long1)); 
     //arccos function with preformula inserted
     arccos = Math.atan( - preformula / Math.sqrt( - preformula * preformula + 1)) + 2 * Math.atan(1); 
     arccos = (3963 * arccos); 
  	 return Math.round((measuredLength + arccos) * 1000)/1000;
   }		 
}

function GreatCircleFunction(fromLong,fromLat,toLong,toLat) {
	   incrementLength=0;
     var long1 = fromLong; 
     var lat1 = fromLat; 
     var long2 = toLong; 
     var lat2 = toLat; 
     var radianConstant = 57.29577951; 
     var arccos = 0; 
     var preformula = 0; 
     //Converting decimal degrees to radians for coordinate 1 
     long1 = long1 / radianConstant; 
     lat1 = lat1 / radianConstant; 
     //Converting decimal degrees to radians for coordinate 2
     long2 = long2 / radianConstant; 
     lat2 = lat2 / radianConstant; 
     //calculating the preformula as input to the script arccos function
     preformula = (Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(long2 - long1)); 
     //arccos function with preformula inserted
     arccos = Math.atan( - preformula / Math.sqrt( - preformula * preformula + 1)) + 2 * Math.atan(1); 
     arccos = (3963 * arccos); 
  	 incrementLength = Math.round((featMeasuredLength + arccos) * 1000) / 1000;
		 return incrementLength;	 
}

function clearCanvas() {
   ctx.clearRect(0,0,document.body.clientWidth,document.body.clientHeight); 	 
}

function clearCanvasCoords() {
	 document.getElementById("measuredDistance").innerHTML = "0.0";
	 measuredLength=0;
	 xPointArray.length=0;
   yPointArray.length=0;
	 clearCanvas();
}

function makeRandomColor(transparency) {
	 var colorRed = Math.floor(Math.random()*255);
	 var colorGreen = Math.floor(Math.random()*255);
	 var colorBlue = Math.floor(Math.random()*255);
	 
   if (transparency<1) {
	    return "rgba(" + colorRed + "," + colorGreen + "," + colorBlue + "," + transparency + ")";
	 }
	 else {
	    return "rgb(" + colorRed + "," + colorGreen + "," + colorBlue + ")";   	 
	 }
}

function drawLine(startX,startY,endX,endY,lineWidth,lineColor,lineCap) {
    ctx.beginPath();
    ctx.moveTo(startX-xOffset,startY-yOffset);
    ctx.lineTo(endX-xOffset,endY-yOffset);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.lineCap = lineCap;
    ctx.stroke();
}

function drawCircle(centerX,centerY,radius,fillStyle,lineWidth,lineColor) {
    ctx.beginPath();
    ctx.arc(centerX-xOffset, centerY-yOffset, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

function reDrawMeasuredLine() {
  var i;
	for (i=0;i<xPointArray.length;i++) {
	   if (i < 1) {
		    drawCircle(convertLongToPixelX(xPointArray[i]),convertLatToPixelY(yPointArray[i]),2,"Red",1,"Red");	
		 }
		 else {
		    drawCircle(convertLongToPixelX(xPointArray[i]),convertLatToPixelY(yPointArray[i]),2,"Red",1,"Red");		 
		    drawLine(convertLongToPixelX(xPointArray[i-1]),convertLatToPixelY(yPointArray[i-1]),convertLongToPixelX(xPointArray[i]),convertLatToPixelY(yPointArray[i]),2,"Red","Round");
		 }	 
	}
}

function changeUnits(theUnit) {
   measureUnits = theUnit;	
   document.getElementById("measureResults").innerHTML = Math.round(calculateUnits(measuredLength)*1000)/1000;	  
}

function calculateUnits(milesToCalculate) {
   var reportedLength=0;
	 if (measureUnits=="Miles") {
			reportedLength = milesToCalculate;   
	 }
	 
	 if (measureUnits=="Kilometers") {  
			reportedLength = milesToCalculate*1.609344; 	 
	 }
	 
	 if (measureUnits=="Feet") {  
			reportedLength = milesToCalculate*5280;	    
	 }
	 
	 if (measureUnits=="Meters") {   
			reportedLength = milesToCalculate*1609.344;	 
	 }
	 return reportedLength;
}

function getTimeStamp() {
   var theTimeStamp;
	 var thetime=new Date();

   var nhours=thetime.getHours();
   var nmins=thetime.getMinutes();
   var nsecn=thetime.getSeconds();
   var AorP=" ";

   if (nhours>=12) {AorP="PM";} else {AorP="AM";}
   if (nhours>=13) {nhours-=12;}
   if (nhours==0) {nhours=12;}
   if (nsecn<10) {nsecn="0"+nsecn;}
   if (nmins<10) {nmins="0"+nmins;}
	 
	 var nmonth=(thetime.getMonth()+1).toString();
	 var nday=thetime.getDate().toString();
	 var nyear=thetime.getFullYear().toString();

	 theTimeStamp = nmonth + "/" + nday + "/" + nyear + " " + nhours + ":" + nmins + ":" + nsecn + " " + AorP;
	 return theTimeStamp;
}

function textXmlParser(txt) {
   var xmlDoc;
   if (window.DOMParser) {
     parser=new DOMParser();
     xmlDoc=parser.parseFromString(txt,"text/xml");
   }
   else {
     xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
     xmlDoc.async="false";
     xmlDoc.loadXML(txt); 
   }
   return xmlDoc;
}

function buildKMLGeom() {
   var theGeom="";
   var geomCount;
	 
   for(geomCount=0;geomCount<=xPointArray.length-1;geomCount++) {
      theGeom=theGeom + xPointArray[geomCount] + "," + yPointArray[geomCount] + ",0 ";			 
   }
   return theGeom;
}

var featMeasuredLength;
function getMeasuredLength(){
   featMeasuredLength=0
	 var measCount;
	 var lenSegArray = new Array();
	    
	 for(measCount=0;measCount<=xPointArray.length-1;measCount++) {
	    if (measCount>0) {  
         lenSegArray.push(GreatCircleFunction(xPointArray[measCount-1],yPointArray[measCount-1],xPointArray[measCount],yPointArray[measCount]));				 
			}
   }
	 
	 var xCounter;
	 for (xCounter=0;xCounter<=lenSegArray.length-1;xCounter++) {
	     featMeasuredLength=featMeasuredLength+lenSegArray[xCounter];
	 }
	 
   return Math.round(featMeasuredLength*1000)/1000;
}

//Search
var searchReq; 
var userInputValue;
var searchLayer="City";

function check(selLayer) {
   searchLayer=selLayer;
   clearSearch();
   document.getElementById("UserInput").focus();
}

function clearSearch() {
   document.getElementById('UserInput').value = "";
   document.getElementById("txtHint").innerHTML= "";
}

function getData(value,keyPressed) {										 
	 if (value.substr(0,1)==" "||value=="") {
      document.getElementById("txtHint").innerHTML= "";
      return;
   }
	 
	 if (searchLayer=="LatLong") {
      handleCoordinate(value);
      return;
   }
										 
	 searchReq=GetXmlHttpObject();
   if (value.length > 2) {
      userInputValue=value.toUpperCase();
      searchReq.onreadystatechange=processSearchInput;
      searchReq.open("GET", "resources_v3/Bookmarks/" + searchLayer + ".txt", false);	
      searchReq.send(null);
												 
      if (searchReq.readyState==4) {
         processSearchInput();
      }
   } 
}		

function processSearchInput() {
   if (userInputValue.substr(0,1)==" "||userInputValue=="") {
      return;
   }
   
	 var userInputLength=userInputValue.length;
   var foundMatch = "false";

   if (searchReq.readyState==4) {
      var data = searchReq.responseText;
      var features = data.split(',');
      var txtToReturn;
      txtToReturn = "<select id='listItems' onchange='getSelectedFeature()' name='listItems' size=6>";
												
      for (i=0;i<features.length;i++) {
         if (userInputValue==features[i].substr(0,userInputLength).toUpperCase()) {
            foundMatch="true";
            txtToReturn=txtToReturn + "<option value='" + features[i] + "'>" + features[i] + "</option>";
         }
      }
												
			txtToReturn=txtToReturn + "</select>";
												
      if (foundMatch=="true") { 
         document.getElementById("txtHint").innerHTML=txtToReturn;
      }
      else {
         document.getElementById("txtHint").innerHTML="Nothing found for " + searchLayer + " " + userInputValue + ".";
      }
   }
}

var selectedFeatureReq;
function getSelectedFeature() {
	 if (searchLayer=="LatLong") {
      zoomToCoordinate(document.getElementById("listItems").value);
      return;
   }
   selectedFeatureReq = GetXmlHttpObject(); 	
   selectedFeatureReq.onreadystatechange=processSelectedFeature;										 								 
   selectedFeatureReq.open("GET", "resources_v3/Bookmarks/" + searchLayer + "/" + document.getElementById("listItems").value + ".txt", true); 
   selectedFeatureReq.send(null);
}

function processSelectedFeature() {									 
   if (selectedFeatureReq.readyState==4) {
      var data = selectedFeatureReq.responseText;
      var features = eval('(' + data + ')');
			zoomToFeature(features.Features[0].Latitude, features.Features[0].Longitude, features.Features[0].Map, features.Features[0].Zoom);
   }
}

function handleCoordinate(theCoord) {
   var coords = theCoord.split(',');
   if (coords.length>1) {
      var searchLongCoord = coords[1].split('.');
      if (searchLongCoord.length>1) {
         if (searchLongCoord[1].length=3) {
				    if (coords[0]<latMax&&coords[0]>latMin&&coords[1]>longMax&&coords[1]<longMin) {
							 document.getElementById("txtHint").innerHTML="<select id='listItems' onchange='getSelectedFeature()' name='listItems' size=6><option value='" + coords[0] + "," + coords[1] + "'>" + coords[0] + "," + coords[1] + "</option>" + "</select>";
            }
						else {
						   document.getElementById("txtHint").innerHTML="Coordinate is outside the map Extent.";
						}
         }
      }
   }
}

function zoomToCoordinate(zoomCoord) {
   var coordToZoom=zoomCoord.split(',');
   zoomToFeature(coordToZoom[0], coordToZoom[1], "Highway", "4");
}
//End Search

//Begin Identify
var queryFilter="Select_Layer";
function changeQueryResults(newFilter) {
   queryFilter=newFilter;
}

var identifyFlag=false;
var identifyRequest;
var theIndexFile;
function runIdentify(event,x,y) {
  if (queryFilter=="Select_Layer") {
		 var displayIdentDiv=document.getElementById("identifyResults");
     displayIdentDiv.innerHTML="Please select a layer.";
		 return;
	}
	
  var displayIdentDiv=document.getElementById("identifyResults");
  displayIdentDiv.innerHTML="";
	
  var thepixelX;
  var thepixelY;
	
	var theQueryExtension;
	if (queryFilter=="STATION") {		 
		 multiIdentify();
		 return;
	}

	if (queryFilter=="CROSSING") {
		 multiIdentify();
		 return;
	}

	if (queryFilter=="CITY"||queryFilter=="HIGHWAY") {
	   theQueryExtension="z6.xml";
		 thepixelX=Math.floor((Math.abs(Math.abs(globalX) - Math.abs(longMax)) * 57257.7)/1056);
		 thepixelY=Math.floor((Math.abs(Math.abs(globalY) - Math.abs(latMax)) * 57257.7)/1056);
		 theIndexFile="x" + thepixelX + "y" + thepixelY + theQueryExtension;
	}
	
	if (queryFilter=="COUNTY") {
	   theQueryExtension="z5.xml"; 
		 thepixelX=Math.floor((Math.abs(Math.abs(globalX) - Math.abs(longMax)) * 19085.9)/1056);
		 thepixelY=Math.floor((Math.abs(Math.abs(globalY) - Math.abs(latMax)) * 19085.9)/1056);
		 theIndexFile="x" + thepixelX + "y" + thepixelY + theQueryExtension;
	}
	
	if (queryFilter=="DISTRICT") {
	   theQueryExtension="z4.xml";
		 thepixelX=Math.floor((Math.abs(Math.abs(globalX) - Math.abs(longMax)) * 6361.9)/1056);
		 thepixelY=Math.floor((Math.abs(Math.abs(globalY) - Math.abs(latMax)) * 6361.9)/1056);
		 theIndexFile="x" + thepixelX + "y" + thepixelY + theQueryExtension;
	}
	
	identifyRequest=GetXmlHttpObject();
	identifyRequest.onreadystatechange=populateIdentifyDiv;							 
  identifyRequest.open("GET", "resources_v3/IdentifyIndex/" + queryFilter + "Index/" + theIndexFile + "?" + Math.random, true);
  identifyRequest.send(null); 
} 

function populateIdentifyDiv() {
  if (identifyRequest.readyState==4) {
		 var displayIdentDiv=document.getElementById("identifyResults");
     displayIdentDiv.innerHTML="";
     var data=identifyRequest.responseXML;
		 var theDisplayText;
		 theDisplayText="<table border=1 width='250px' cellspacing=0>";
		 
		 var theNodeName;
		 var x=data.documentElement.childNodes;
		 
     for (var i=0;i<x.length;i++) { 
		    if (x[i].nodeType==1) {
				   theDisplayText=theDisplayText + "<tr><th colspan=2 align='left'>" + x[i].nodeName.toUpperCase() + "</th></tr>";
				   for (var j=0;j<x[i].childNodes.length;j++) {
					     if (x[i].childNodes[j].nodeType==1) {
							    if (x[i].childNodes[j].firstChild==null) {
									//nothing
									}
									else {
									   theNodeName=x[i].childNodes[j].nodeName;
										 var displayName=theNodeName;
										 										 
										 if (displayName=="Link") {
										    if (queryFilter=="All_Layers") {
												   //theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td><a href='" + x[i].childNodes[j].firstChild.nodeValue + "' target='_blank'>" + x[i].childNodes[j].firstChild.nodeValue + "</a></td></tr>";
													 theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td><a href='" + x[i].childNodes[j].firstChild.nodeValue + "' target='_blank'>More Feature Information</a></td></tr>";
				                } 
												else {
												   if (queryFilter==x[i].nodeName.toUpperCase()) {
													    //theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td><a href='" + x[i].childNodes[j].firstChild.nodeValue + "' target='_blank'>" + x[i].childNodes[j].firstChild.nodeValue + "</a></td></tr>";
															theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td><a href='" + x[i].childNodes[j].firstChild.nodeValue + "' target='_blank'>More Feature Information</a></td></tr>";
													 }
												}										 
										 }
										 else {
										    if (queryFilter=="All_Layers") {
												   theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td>" + x[i].childNodes[j].firstChild.nodeValue + "</td></tr>";
												}
												else {
												   if (queryFilter==x[i].nodeName.toUpperCase()) {
													    theDisplayText=theDisplayText + "<tr><td>" + displayName + "</td><td>" + x[i].childNodes[j].firstChild.nodeValue + "</td></tr>";
													 }
												}	 
										 }
									}						
							 }
					 }																															
        }
		 }
		 	
     displayIdentDiv.innerHTML=theDisplayText + "</table>";	
  }
}

function clearAllIdentifyInfo() {
	document.getElementById("identifyResults").innerHTML="";	 
} 

function padRightFormatY(toPad) {
     if (toPad.length<4){
		 		toPad=toPad + "000";
		 }
		 
		 if (toPad.length<5){
		 		toPad=toPad + "00";
		 }	
		 
		 if (toPad.length<6){
		 		toPad=toPad + "0";
		 }	
		
		 if (toPad.length>6){
		 		toPad=toPad.substring(0,6);
		 }			 
return toPad;
}

function padRightFormatX(toPad) {
     if (toPad.substring(0,2)=="-1") {
  		 if (toPad.length<6){
  		 		toPad=toPad + "000";
  		 }
  		 
  		 if (toPad.length<7){
  		 		toPad=toPad + "00";
  		 }	
  		 
  		 if (toPad.length<8){
  		 		toPad=toPad + "0";
  		 }	
			 
		   if (toPad.length>8){
		 		toPad=toPad.substring(0,8);
			 }
		 }		
		 else {
		 	 if (toPad.length<5){
  		 		toPad=toPad + "000";
  		 }
  		 
  		 if (toPad.length<6){
  		 		toPad=toPad + "00";
  		 }	
  		 
  		 if (toPad.length<7){
  		 		toPad=toPad + "0";
  		 }	
		 
  		 if (toPad.length>7){
  				toPad=toPad.substring(0,7);
  		 } 
		 }
		  
return toPad;
}

function multiIdentify() {
     var thepixelXStr=String(globalX);
		 var thepixelYStr=String(globalY).substring(0,6);
		 
		 if (thepixelXStr.substring(0,2)=="-1") {
		 		thepixelXStr=thepixelXStr.substring(0,8);
		 }		
		 else {
				thepixelXStr=thepixelXStr.substring(0,7);
		 } 
		 
		 var indexFileOne;
		 var indexFileTwo;
		 var indexFileThree;
		 var indexFileFour;
		 var indexFileFive;
		 var indexFileSix;
		 var indexFileSeven;
		 var indexFileEight;
		 var indexFileNine;
		 
		 var newIdentYCoord1=String(Math.round((Number(thepixelYStr) - .001)*1000)/1000);
		 var newIdentYCoord2=String(Math.round((Number(thepixelYStr) + .001)*1000)/1000);
		 var newIdentXCoord1=String(Math.round((Number(thepixelXStr) + .001)*1000)/1000);
		 var newIdentXCoord2=String(Math.round((Number(thepixelXStr) - .001)*1000)/1000);
		 
		 //for latitude
		 newIdentYCoord1=padRightFormatY(newIdentYCoord1);
		 newIdentYCoord2=padRightFormatY(newIdentYCoord2);

		 //for longitude
		 newIdentXCoord1=padRightFormatX(newIdentXCoord1);
		 newIdentXCoord2=padRightFormatX(newIdentXCoord2);		 		 		 
		 
		 indexFileOne=thepixelYStr + thepixelXStr + ".txt";
		 indexFileTwo=newIdentYCoord1 + thepixelXStr + ".txt";
		 indexFileThree=newIdentYCoord2 + thepixelXStr + ".txt";
		 indexFileFour=thepixelYStr + newIdentXCoord1 + ".txt";
		 indexFileFive=thepixelYStr + newIdentXCoord2 + ".txt";
		 indexFileSix=newIdentYCoord2 + newIdentXCoord1 + ".txt";
		 indexFileSeven=newIdentYCoord2 + newIdentXCoord2 + ".txt";
		 indexFileEight=newIdentYCoord1 + newIdentXCoord1 + ".txt";
		 indexFileNine=newIdentYCoord1 + newIdentXCoord2 + ".txt";
		 
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileOne + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileTwo + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileThree + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileFour + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileFive + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileSix + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileSeven + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileEight + "?" + Math.random);
		 getIdentfiyDataResultsText("resources_v3/IdentifyIndex/" + queryFilter + "Index/" + indexFileNine + "?" + Math.random);
}

function getIdentfiyDataResultsText(url) { 
  var XMLHttpRequestObject=GetXmlHttpObject(); 

  if(XMLHttpRequestObject) {
    XMLHttpRequestObject.open("GET", url); 

    XMLHttpRequestObject.onreadystatechange = function() { 
      if (XMLHttpRequestObject.readyState == 4 && XMLHttpRequestObject.status != 404) { 
          populateIdentifyDataDiv(XMLHttpRequestObject.responseText); 
          delete XMLHttpRequestObject;
          XMLHttpRequestObject = null;
      } 
    } 
    XMLHttpRequestObject.send(null); 
	}
}

function populateIdentifyDataDiv(theData) {
   var displayIdentDiv=document.getElementById("identifyResults");
	 displayIdentDiv.innerHTML=displayIdentDiv.innerHTML + theData;
}
//End Identify

//Tables
function toggleTable(theTable) {
   //clearTables();
   //document.getElementById(theTable).style.display = "block";	
	 loadTable(theTable);	 
}

/*function clearTables() {
  var tableNames=["tblAreaOffices","tblCities","tblCounties","tblDistricts","tblMaintenanceSections","tblMPOs","tblParks"];
	var i;
  for (i=0;i<tableNames.length;i++) {
     document.getElementById(tableNames[i]).style.display = "none";		 
  }
}*/

var loadTableReq;
function loadTable(theTableName) {
   loadTableReq = GetXmlHttpObject(); 
   loadTableReq.onreadystatechange = processLoadTable; 
   loadTableReq.open("GET", "resources_v3/Tables/" + theTableName + ".txt", true); 
   loadTableReq.send(null); 
}

function processLoadTable() {
   var outputSpace = document.getElementById("tableData");
	 if (loadTableReq.readyState == 4) {
      outputSpace.innerHTML=loadTableReq.responseText;
   }
}

//Extra table functions
var stationData;
function assignXML(xml) {
   stationData = xml;
	 loadTable(stationData);
}

function loadXMLDoc(dname) {
   if (window.XMLHttpRequest) {
     xhttp=new XMLHttpRequest();
   }
   else {
     xhttp=new ActiveXObject("Microsoft.XMLHTTP");
   }
	 
   xhttp.open("GET",dname,false);
   xhttp.send("");
   return xhttp.responseXML;
}

function loadTable2(theTemplate) {
   document.getElementById("tableData").innerHTML="";
   xml=loadXMLDoc("resources/xml/stations.xml?" + Math.random());
   xsl=loadXMLDoc("resources/xml/stations" + theTemplate + ".xsl?" + Math.random());
   // code for IE
   if (window.ActiveXObject) {
     ex=xml.transformNode(xsl);
     document.getElementById("tableData").innerHTML=ex;
   }
   // code for Mozilla, Firefox, Opera, etc.
   else if (document.implementation && document.implementation.createDocument) {
     xsltProcessor=new XSLTProcessor();
     xsltProcessor.importStylesheet(xsl);
     resultDocument = xsltProcessor.transformToFragment(xml,document);
     document.getElementById("tableData").appendChild(resultDocument);
   }
}

//End Tables