const locationsList = {
	"Oldsea":{"Lat":48, "Lon":2},
	"Quito":{"Lat":-0.18, "Lon":-78},
	"Reykjavik":{"Lat":64, "Lon":-21},
	"Glendale":{"Lat":34, "Lon":-118}
};
const authorsList = {
	"Kiedis":"Kiedis",
	"Aurvan":"Aurvan",
	"Kilmoor":"Kilmoor",
	"Egijebus":"Egijebus",
	"Orneh":"Orneh",
	"Mayev":"Mayev"
};
const hoursList = {
	"12:00am":0,
	"1:00am":1,
	"2:00am":2,
	"3:00am":3,
	"4:00am":4,
	"5:00am":5,
	"6:00am":6,
	"7:00am":7,
	"8:00am":8,
	"9:00am":9,
	"10:00am":10,
	"11:00am":11,
	"12:00pm":12,
	"1:00pm":13,
	"2:00pm":14,
	"3:00pm":15,
	"4:00pm":16,
	"5:00pm":17,
	"6:00pm":18,
	"7:00pm":19,
	"8:00pm":20,
	"9:00pm":21,
	"10:00pm":22,
	"11:00pm":23
};

const oneDay = 86400001;//one day in milliseconds+1ms

///////////////////////DATE EXPERIMENTS///////////////////////////////////////////////////////////////////////
function makeDateSetterString(theDate, style) {
	//"2009-03-05" is what we're after here
	var monthPart = theDate.getUTCMonth()+1;
	if (monthPart<10) {
		monthPart = "0"+monthPart;
	}
	var dayPart = theDate.getUTCDate();
	if (dayPart<10) {
		dayPart = "0"+dayPart;
	}
	if (style=="set") 
	{
		return (theDate.getUTCFullYear()+"-"+monthPart+"-"+dayPart);
	}else{
		return (monthPart+"/"+dayPart+"/"+theDate.getUTCFullYear());
	}//end if else style
}//end makeDateSetterString


function runDateExperiments() {
	//NEEDs:
	//create a date (Object) from a string or other thing we read from mongoose
	//display that date prettily in HTML
	//set the date of an HTML date input field (from a date object)
	//add a day or days to a date object
	//use UTC? or figure out how timezones work
	//separate out the time from a date object
	//modify that time - or modify the time portion of a Data object
	//make sure that the date object is usable for Mongoose!!
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//create a date (Object) from a string or other thing we read from mongoose
		console.log("lastDate: "+ lastDate.toUTCString());//last date has been read from mongo - so this works!
		//NOTE: date is set and stored as GMT, so you have to read "toUTCString()" or it won't look right

	//display that date prettily in HTML
		var displayDate = document.getElementById("theDate");
		displayDate.innerHTML = makeDateSetterString(lastDate);

	//set the date of an HTML date input field (from a date object)
		//var changeDate = document.getElementById("changeDate");
		//changeDate.value = makeDateSetterString(lastDate, "set");

	//add a day or days to a date object
		var nextDayDate = new Date(lastDate.getTime() + oneDay); // + 1 day in ms
		var goDate = document.getElementById("goDate");
		goDate.value = makeDateSetterString(nextDayDate, "set");

	//use UTC? or figure out how timezones work
		//we are now using UTC, but should we add timezone support at some point?

	//separate out the time from a date object
		console.log("lastDate.getUTCHours(): "+lastDate.getUTCHours());
	//modify that time - or modify the time portion of a Data object
		lastDate.setUTCHours(15);
		console.log("lastDate with hours set to 15: "+ lastDate.toUTCString());
	//make sure that the date object is usable for Mongoose!!
		//well we're getting data so I guess we're OK!
}//end experients
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


//this is just a default value - hopefully overwritten on connection to the db
var temp ='1966-03-13'.split('-');
var lastDate = new Date(temp[0], temp[1]-1, temp[2]);
var lastDateId; 

var displayDate = document.getElementById("theDate");
var displayDateObj = new Date(lastDate.toUTCString());
var displayDateRec = {Date: new Date(lastDate.toUTCString()), Month:displayDateObj.getMonth()+1, Day:displayDateObj.getDate(), Year:displayDateObj.getFullYear()};
console.dir (displayDateRec);

/*
var changeDate = document.getElementById("changeDate");
changeDate.value = displayDateRec.Date.toUTCString();

var changeDateRec = {Month:changeDate.getMonth()+1, Day:changeDate.getDate(), Year:changeDate.getFullYear()};
var newEntry = document.getElementById("newEntry");
var newEntryRec = {Month:newEntry.getMonth()+1, Day:newEntry.getDate(), Year:newEntry.getFullYear()};
var goDate = document.getElementById("goDate");
var goDateRec = {Month:goDate.getMonth()+1, Day:goDate.getDate(), Year:goDate.getFullYear()};
*/


/*
getDate() // Returns the date
getMonth() // Returns the month
getFullYear() // Returns the year
*/
var writingList = document.getElementById("writingList");
//clear it out just to be sure
clearWritingList();

var controlTemplate = document.getElementById("controlTemplate");
var textTemplate = document.getElementById("textTemplate");
var writingItemTemplate = document.getElementById("writingItemTemplate");

var weatherSelect = document.getElementById("weather");
var temperatureSelect = document.getElementById("temperature");

var savedCursor;

var defaultRec = {
	"WritingId": 666,
	"Date":lastDate,
	"Author": "Aurvan",
	"Location": "Oldsea",
	"Temperature": "Warm",
	"Weather": "Clear",
	"WritingContent": ""
}

var inDay;
var inMonth;
var inYear;
var inLat;
var inLon;
var inTimeZone;

var theSock;


function populateSelect(selector, options, type) {
    //console.log('populating ');
    //console.dir(selector);
    for (i = 0; i < Object.keys(options).length; i++) { 
        //add each option to the selector & 
        //set the onClick for the selector
        var option = document.createElement("option");
        if (type=="location") {
        	option.value = Object.keys(options)[i];//locations just take the name as the value
        } else {
        	option.value = Object.values(options)[i];
        }//end else not location
        option.text = Object.keys(options)[i];
        selector.appendChild(option);
    }//end for
    selector.setAttribute("value", type);
    selector.onchange = saveWriting;///I don't think this is correct anymore
}// end populateSelect



async function startSetUp() {
	//set up connection to Web Socket
    theSock = await new WebSocket('ws://localhost:40510');
    theSock.onopen = function () {
        console.log('websocket is connected ...')
    }
    theSock.onmessage = function (ev) {
        console.log(ev);
        var coreMess = JSON.parse(ev.data);
        //DISPATCH COMMANDS
        if (coreMess.Command == "PUT") {/////////////////////////////////////////PUT/////////////////////////////////
        	console.log('got a PUT with: ')
        	console.dir(coreMess.Data)
        	var sortedWritings = sortWritings(coreMess.Data)
        	console.log('post sort: ');
        	console.dir(sortedWritings);
        	putWritings(sortedWritings);
        	console.log('about to check if theres any writings: ');
        	console.dir(writingList.firstChild);
        	if(!writingList.firstChild) {
        		//nothing on this day so make a writing entry
        		newWriting();
        	}
        //end 'PUT'
    	}else if (coreMess.Command == "UPDATE") {////////////////////////////////////////UPDATE////////////////////////
        //gotta populate the correct writing with the new data
        	console.log('got a UPDATE with: ');
        	console.dir(coreMess.Data);
        	//find the correct writing div on the page and repop all the data

			var divToUpdate = document.getElementById(coreMess.Data[0]._id);
        	updateWritings(divToUpdate, coreMess.Data[0]);
        //end UPDATE
    	}else if (coreMess.Command == "DATE") {
    		//this is called initially to set the date viewed to the lastDate (saved in the db)
        	console.log('got a DATE with: ');
        	console.dir(coreMess.Data[0]);
        	lastDate = new Date(coreMess.Data[0].Date);
        	lastDateId = coreMess.Data[0]._id;
        	continueSetUp();/////////////////////////////SHOULD WE SOLDIER ON USING A DEFAULT DATE IF THIS FAILS?????????????????????????????????????
    		//end DATE
    	}
    }

}//end startSetUp

function continueSetUp() {

	displayDate.innerHTML = lastDate.getMonth()+"/"+lastDate.getDate()+"/"+lastDate.getFullYear();


    //set up writing control panel
    console.dir(timeSelect);
	populateSelect(timeSelect, hoursList, "hour");
	populateSelect(authorSelect, authorsList, "author");
	populateSelect(locationSelect, locationsList, "location");

	//fetch writings for that date - theSock message handler will populate them
	var newWSMessage = {"Command":"GET", "Data":{"Date":lastDate}};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);
	//do moon and sun times
	runDateExperiments();
}//end continueSetUp()

function sortWritingDivs(){
	console.log('in sortWritingDivs()...');
	console.dir(writingList);

	var items = writingList.childNodes;
	var itemsArr =[];

	for(let i=0;i<items.length;i++){
	    if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
	        itemsArr.push(items[i]);
	    }//end if nodeType
	}//end for

	clearWritingList();
	console.log('post clearout...');
	console.dir(writingList);
	console.dir(itemsArr);


	itemsArr.sort((a,b)=>{
			if (a.childNodes[1].childNodes[5].value < b.childNodes[1].childNodes[5].value) {//author
				return -1;
			}else if (a.childNodes[1].childNodes[5].value > b.childNodes[1].childNodes[5].value) {
				return 1;
			}else{
			  	if (a.childNodes[1].childNodes[1].value < b.childNodes[1].childNodes[1].value) {
			  		return -1;
			  	}else if (a.childNodes[1].childNodes[1].value > b.childNodes[1].childNodes[1].value) {
			  		return 1;
			  	}else{
			  		return 0;
			  	}//end else date is same
			}//else author is same
		});//end sort func
	console.log('post sort...');
	console.dir(itemsArr);
	itemsArr.map(node=>writingList.appendChild(node))
}//end sortWritingDivs()

function sortWritings(writings) {
    console.log('in sortWritings() with: ')
	console.dir(writings)
	var writingArray = [];
	for (var writing in writings) {
	    writingArray.push(writings[writing]);
	}//end for - making array
    console.log('now writingArray is: ')
	console.dir(writingArray)
	writingArray.sort(function(a,b) {
		if (a.Author < b.Author) {
			return -1;
		}else if (a.Author > b.Author) {
			return 1;
		}else{
		  	if (a.Date < b.Date) {
		  		return -1;
		  	}else if (a.Date > b.Date) {
		  		return 1;
		  	}else{
		  		return 0;
		  	}//end else date is same
		}//else author is same
	});//end sort func
	console.log('post sort writingArray is: ')
	console.dir(writingArray)
	return writingArray;
}//end sortWritings


function putWritings(writings)
{
	console.log("in putWritings()...");

	for (i = 0; i < writings.length; i++) { 

		console.log("writings[i]:");
		console.dir(writings[i]);
		console.log("writings[i].Date:");
		console.dir(writings[i].Date);
//and why isnt the big scrolling container being drawn?
	    //create a div
	    var writingItem = writingItemTemplate.cloneNode(true);///use to clone a new writing item
	    var controlArea = writingItem.childNodes[1];
	    var textArea = writingItem.childNodes[3];
	   	textArea.setAttribute("id", "visible");//make text area visible
	    controlArea.setAttribute("id", "visible");//make control area visible
	    writingItem.setAttribute("id", writings[i]._id);//ad the writing ID to the newly cloned div
	    var nextDate = new Date(writings[i].Date);
		console.log("hours:");
		console.log(nextDate.getUTCHours());
	    controlArea.childNodes[1].value = nextDate.getUTCHours();//set the time control
	    SelectItemByValue(controlArea.childNodes[5],writings[i].Author);//set the author control
	    SelectItemByValue(controlArea.childNodes[9],writings[i].Location);//set the location control
	    textArea.childNodes[1].innerHTML = writings[i].WritingContent;//set the writing content

	    writingList.appendChild(writingItem);//writingItem added to writingList

	    //set the weather selects (there's only one setting per day so far)
	    SelectItemByValue(weatherSelect, writings[i].Weather);
	    SelectItemByValue(temperatureSelect, writings[i].Temperature);

	    //Also update the default values
	    defaultRec.Date = writings[i].Date;
	    defaultRec.Author = writings[i].Author;
	    defaultRec.Location = writings[i].Location;
	    defaultRec.Temperature = writings[i].Temperature;
	    defaultRec.Weather = writings[i].Weather;

	}//end for i

	if(writingList.firstChild) {
		//sortWritingDivs();
		doMoon();
		doSun();
	}


}//end putWritings

function updateWritings(divToUpdate, updateData)
{
	console.log("in updateWritings() with updateData...");
	console.dir(updateData);
	var sortNoSort = updateData.Sort;
	var actualData = updateData.Data;
	var controlArea = divToUpdate.childNodes[1];
    var textArea = divToUpdate.childNodes[3];
    var updateDATE = new Date(updateData.Date);
	controlArea.childNodes[1].value = updateDATE.getUTCHours();//set the time control
    SelectItemByValue(controlArea.childNodes[5],updateData.Author);//set the author control
    SelectItemByValue(controlArea.childNodes[9],updateData.Location);//set the location control
    textArea.childNodes[1].innerHTML = updateData.WritingContent;//set the writing content
    SelectItemByValue(weatherSelect, updateData.Weather);//set Weather
    SelectItemByValue(temperatureSelect, updateData.Temperature);//set Temp
    setCurrentCursorPosition(textArea.childNodes[1], savedCursor);

    if (sortNoSort) {
    	//console.log("SORT DIVS because updateData.Sort = "+sortNoSort);
    	//sortWritingDivs()
    }else{
    	//console.log("NO SORT DIVS because updateData.Sort = "+sortNoSort);
    }
	doMoon();
	doSun();

}//end updateWritings


function newWriting(thing)
{
	console.log("in newWriting()...");
	if(thing) {
		var controlArea = thing.parentNode;
		console.dir(controlArea);
		var lastHour = Number(controlArea.childNodes[1].value);
	}else{
		//no thing means make last hour -1
		lastHour = -1;//which will be midnight after we add 1 to it in a sec!
	}
	console.log("lastHour: "+lastHour);
	lastHour+=1;
	console.log("after +1 lastHour: "+lastHour);
	lastDate.setUTCHours(lastHour);
	console.log("lastDate with +1 hours: "+ lastDate.toUTCString());
	defaultRec.Date = lastDate;
	if(thing){
		defaultRec.Author = controlArea.childNodes[5].value;//set the author value
		defaultRec.Location = controlArea.childNodes[9].value;//set the location value
		defaultRec.Weather = weatherSelect.value;//set the weather value
		defaultRec.Temperature = temperatureSelect.value;//set the temp value
	}//end any child nodes
    //get default or last data
	//save data to mongo
	var newWSMessage = {"Command":"NEW", "Data":defaultRec};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);

	possibleLastDate(lastDate);

	doMoon();
	doSun();

	//Mongo needs to "PUT" in response to our "NEW" so the new item should appear when that happens!

}//end newWriting

function updateWeather(theField, theValue) {
	console.log("in updateWeather()...");
	defaultRec[theField] = theValue;
	for(let i=0;i<writingList.childNodes.length;i++){
	    if (writingList.childNodes[i].nodeType == 1) { // get rid of the whitespace text nodes

			var dataRec = {
				"targetId": String(writingList.childNodes[i].id),
				"targetField": theField,
				"fieldValue": theValue
			};

			console.log("writingId: "+dataRec.targetId);
			console.log("theField: "+dataRec.targetField);
			console.log("theValue: "+dataRec.fieldValue);

		    //send the UPDATE message to theSock (WebSocket Server)
			var newWSMessage = {"Command":"UPDATE", "Data":dataRec};
			var JSONMess = JSON.stringify(newWSMessage);
			theSock.send(JSONMess);

	    }//end if nodeType is 1
	}//end for	


}//end updateWeather

function update(writingId, theField, theValue, theElement) {
	console.log("in update()...");
	if (theField != "WritingContent") {
   		//Also update the default value
   		defaultRec[theField] = theValue;
   	}else{
   		savedCursor = getCurrentCursorPosition(theElement.parentNode);
   	}
   	if (theField == "Time") {
   		//Time is really Date - but it requires some special surgery!
   		lastDate.setUTCHours(Number(theValue));
		theValue = lastDate;
   		theField = "Date";
   	}//end if "Time"

	var dataRec = {
		"targetId": String(writingId),
		"targetField": theField,
		"fieldValue": theValue
	};

	console.log("writingId: "+writingId);
	console.log("theField: "+theField);
	console.log("theValue: "+theValue);

    //send the UPDATE message to theSock (WebSocket Server)
	var newWSMessage = {"Command":"UPDATE", "Data":dataRec};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);

	doMoon();
	doSun();
}//end update


function saveWriting()
{
	console.log("in saveWriting...");




}//end saveWriting


function changeDates(toDate) {
	console.log("in changeDates...");
}//end changeDates

function newForDate(newDate) {
	console.log("in newForDate...");
	//go to new date if it's not this date
	if (!(newDate==lastDate)) {
		goToDate(newDate);
	}
	if (writingList.firstChild) {
		console.dir(writingList.firstChild);
		//there ARE no writing entries so make the first one
		newWriting(writingList.lastChild.childNodes[1].childNodes[5]);
	}else{
		//make new entry for newDate
		newWriting();
	}//end else
}//end newForDate

function clearWritingList() {
	while (writingList.firstChild) {
	    writingList.removeChild(writingList.firstChild);
	}//end while
}//end clearWritingList

function goToDate(toDate) {
	console.log("in goToDate...");
	//remove all writing entries 'cuse we're switching to a new day
	clearWritingList();

	displayDate.innerHTML = makeDateSetterString(toDate);
	lastDate = toDate;
	lastDate.setUTCHours(0);//reset time to 12am
	//fetch writings for that date - theSock message handler will populate them
	var newWSMessage = {"Command":"GET", "Data":{"Date":toDate}};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);
}//end goToDate


function getAll()
{
	console.log("in getAll...");
	var newWSMessage = {"Command":"ALL", "Data":""};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);

}//end getAll

function possibleLastDate(theDate) {
	console.log("in possibleLastDate...");
	var newWSMessage = {"Command":"LASTDATE", "Data":theDate};
	var JSONMess = JSON.stringify(newWSMessage);
	theSock.send(JSONMess);
}//end possibleLastDate


function findBestAstroDiv(hour) {

	var bestDiv = null;

	//console.log("length = "+writingList.childNodes.length);

	for (i = 0; i < writingList.childNodes.length; i++) { 
		var thisWritingEntry = writingList.childNodes[i];
		var nextWritingEntry = writingList.childNodes[i+1];

		/*
		console.log("when i="+i);
		console.log("thisWritingEntry: ");
		console.dir(thisWritingEntry);
		console.log("nextWritingEntry: ");
		console.dir(nextWritingEntry);
		*/

		if (typeof thisWritingEntry != 'undefined') {
			//there IS a time
			var thisDateSelect = thisWritingEntry.childNodes[1].childNodes[1];
			/*
			console.log("thisDateSelect:");
			console.dir(thisDateSelect);
			console.log("thisWritingEntry.childNodes[1].childNodes[1]");
			console.dir(thisWritingEntry.childNodes[1].childNodes[1]);
			*/
		}
		if (typeof nextWritingEntry != 'undefined') {
			//there IS a time
			var nextDateSelect = nextWritingEntry.childNodes[1].childNodes[1];
			/*
			console.log("nextWritingEntry.childNodes[1].childNodes[1]");
			console.dir(nextWritingEntry.childNodes[1].childNodes[1]);
			*/
		}
		/*
		console.log("nextDateSelect:");
		console.dir(nextDateSelect);
		*/
		if (typeof nextWritingEntry == 'undefined') {
			//console.log("nextWritingEntry is UNDEFINED, so going to return this writing entry("+i+")");
			return i;
		}else if(Number(nextDateSelect.value)>hour) {
			//console.log("nextDateSelect.VALUE ("+nextDateSelect.value+") is > hour ("+hour+")...");
			//console.log("so going to return this writing entry ("+i+")");
			return i;
		}

	}//end for
	
	return -1;

}//end findBestAstroDiv

function getMoonPhase(year, month, day)
{
    var c = e = jd = b = 0;
    const phaseCount = 29;

    if (month < 3) {
        year--;
        month += 12;
    }

    ++month;

    c = 365.25 * year;

    e = 30.6 * month;

    jd = c + e + day - 694039.09; //jd is total days elapsed

    jd /= 29.5305882; //divide by the moon cycle

    b = parseInt(jd); //int(jd) -> b, take integer part of jd

    jd -= b; //subtract integer part to leave fractional part of original jd

    b = Math.round(jd * phaseCount); //scale fraction from 0-8 and round

    if (b >= phaseCount ) {
        b = phaseCount; //0 and 8 are the same so turn 8 into 0
    }

    // 0 => New Moon
    // 1 => Waxing Crescent Moon
    // 2 => Quarter Moon
    // 3 => Waxing Gibbous Moon
    // 4 => Full Moon
    // 5 => Waning Gibbous Moon
    // 6 => Last Quarter Moon
    // 7 => Waning Crescent Moon
    
    console.log(b);

    return b;
}//end getMoonPhase

function doMoon(writing) {

	//clear all existing moon notes
	var riseNotes =document.getElementsByClassName("Moonrise");
		for (i = 0; i < riseNotes.length; i++) { 
			riseNotes[i].innerHTML = "";
		}//end for

	var setNotes =document.getElementsByClassName("Moonset");
		for (i = 0; i < setNotes.length; i++) { 
			setNotes[i].innerHTML = "";
		}//end for


    var moonImg = new Image();

	//get the date from the date input
  	inDay = lastDate.getUTCDate()+1;
  	inMonth = lastDate.getUTCMonth()+1;
  	inYear = lastDate.getUTCFullYear();
	var thisPhase = getMoonPhase(inYear, inMonth, inDay);

//get the lat long from the location
	var locationField = writingList.firstChild.childNodes[1].childNodes[9];
	inLat = locationsList[locationField.options[locationField.selectedIndex].value].Lat;
	inLon = locationsList[locationField.options[locationField.selectedIndex].value].Lon;
	inTimeZone = Math.floor(inLon/15);

//find rise and set times
	console.log("inDay: "+inDay+" inMonth: "+inMonth+" inYear: "+inYear+" inTimeZone: "+inTimeZone+" inLon: "+inLon+"  inLat: "+inLat);
	var moonRec = find_moonrise_set(mjd(inDay, inMonth, inYear, 0), inTimeZone, inLon, inLat);
	console.log(OLDfind_moonrise_set(mjd(inDay, inMonth, inYear, 0), inTimeZone, inLon, inLat));
	var moonRise12H;
	var moonRiseAMPM;
	var moonSet12H;
	var moonSetAMPM;
	var moonRiseMinString;
	var moonSetMinString;

	if (moonRec.rise.hours>12)
		{
		moonRise12H = moonRec.rise.hours-12;
		moonRiseAMPM = "pm";
		}
	else
		{
		moonRise12H = moonRec.rise.hours;
		moonRiseAMPM = "am";
		}

	if (moonRec.set.hours>12)
		{
		moonSet12H = moonRec.set.hours-12;
		moonSetAMPM = "pm";
		}
	else
		{
		moonSet12H = moonRec.set.hours;
		moonSetAMPM = "am";
		}

	if (moonRec.rise.minutes<10)
		{
		moonRiseMinString = "0"+moonRec.rise.minutes;
		}
	else
		{
		moonRiseMinString = ""+moonRec.rise.minutes;
		}

	if (moonRec.set.minutes<10)
		{
		moonSetMinString = "0"+moonRec.set.minutes;
		}
	else
		{
		moonSetMinString = ""+moonRec.set.minutes;
		}


console.log("bestAstroDiv for Rise is: "+findBestAstroDiv(moonRec.rise.hours));

//find Phase
var phase = getMoonPhase(inYear, inMonth, inDay);
moonImg.src = "/moon"+phase+".png";
moonImg.onload = function () {
	//console.log("I'M FO REAL RISE!!!!!!!!!!!!!!!!!!!")
	writingList.childNodes[findBestAstroDiv(moonRec.rise.hours)].childNodes[1].childNodes[11].innerHTML = "moonrise "+moonRise12H+":"+moonRiseMinString+moonRiseAMPM+" <img src='/moon"+phase+".png' alt='moon' height='15' width='15'>";
	//console.log("I'M FO REAL SET!!!!!!!!!!!!!!!!!!!")
	writingList.childNodes[findBestAstroDiv(moonRec.set.hours)].childNodes[1].childNodes[13].innerHTML = "moonset "+moonSet12H+":"+moonSetMinString+moonSetAMPM+" <img src='/moon"+phase+".png' alt='moon' height='15' width='15'>";
}//end onload


/*
//post them to a note area
    moonImg.onload = function () {
		moonNote1.innerHTML = "moonrise "+moonRise12H+":"+moonRiseMinString+moonRiseAMPM+" <img src='/moon"+phase+".png' alt='moon' height='15' width='15'>";
		moonNote2.innerHTML = "moonset "+moonSet12H+":"+moonSetMinString+moonSetAMPM+" <img src='/moon"+phase+".png' alt='moon' height='15' width='15'>";
		//moonNote1.innerHTML="shit";
		console.log("moonNote1.innerHTML: "+moonNote1.innerHTML);
		console.log("moonNote2.innerHTML: "+moonNote2.innerHTML);
	}//end onload
	*/
}//end doMoon

function doSun(writing) {
	//clear all existing sun notes
	var riseNotes =document.getElementsByClassName("Sunrise");
		for (i = 0; i < riseNotes.length; i++) { 
			riseNotes[i].innerHTML = "";
		}//end for

	var setNotes =document.getElementsByClassName("Sunset");
		for (i = 0; i < setNotes.length; i++) { 
			setNotes[i].innerHTML = "";
		}//end for

	//get the date from the date input
  	inDay = lastDate.getUTCDate()+1;
  	inMonth = lastDate.getUTCMonth()+1;
  	inYear = lastDate.getUTCFullYear();

//get the lat long from the location
	var locationField = writingList.firstChild.childNodes[1].childNodes[9];
	inLat = locationsList[locationField.options[locationField.selectedIndex].value].Lat;
	inLon = locationsList[locationField.options[locationField.selectedIndex].value].Lon;

//find rise and set times
	inTimeZone = Math.floor(inLon/15);
	console.log("inDay: "+inDay+" inMonth: "+inMonth+" inYear: "+inYear+" inTimeZone: "+inTimeZone+" inLon: "+inLon+"  inLat: "+inLat);
	var sunRec = find_sun_and_twi_events_for_date(mjd(inDay, inMonth, inYear, 0), inTimeZone, inLon, inLat);
	console.log(OLDfind_sun_and_twi_events_for_date(mjd(inDay, inMonth, inYear, 0), inTimeZone, inLon, inLat));
	var sunRise12H;
	var sunRiseAMPM;
	var sunSet12H;
	var sunSetAMPM;
	var sunRiseMinString;
	var sunSetMinString;

	if (sunRec.rise.hours>12)
		{
		sunRise12H = sunRec.rise.hours-12;
		sunRiseAMPM = "pm";
		}
	else
		{
		sunRise12H = sunRec.rise.hours;
		sunRiseAMPM = "am";
		}

	if (sunRec.set.hours>12)
		{
		sunSet12H = sunRec.set.hours-12;
		sunSetAMPM = "pm";
		}
	else
		{
		sunSet12H = sunRec.set.hours;
		sunSetAMPM = "am";
		}

	if (sunRec.rise.minutes<10)
		{
		sunRiseMinString = "0"+sunRec.rise.minutes;
		}
	else
		{
		sunRiseMinString = ""+sunRec.rise.minutes;
		}

	if (sunRec.set.minutes<10)
		{
		sunSetMinString = "0"+sunRec.set.minutes;
		}
	else
		{
		sunSetMinString = ""+sunRec.set.minutes;
		}

//post them to a note area

	//console.log("I'M FO REAL SUNRISE!!!!!!!!!!!!!!!!!!!")
	writingList.childNodes[findBestAstroDiv(sunRec.rise.hours)].childNodes[1].childNodes[15].innerHTML = "sunrise "+sunRise12H+":"+sunRiseMinString+sunRiseAMPM;
	//console.log("I'M FO REAL SUNSET!!!!!!!!!!!!!!!!!!!")
	writingList.childNodes[findBestAstroDiv(sunRec.set.hours)].childNodes[1].childNodes[17].innerHTML = "sunset "+sunSet12H+":"+sunSetMinString+sunSetAMPM;

}//end doSun

// This is a translation of a set of routines from Montenbruck and Pfleger's
// Astonomy on the Computer 2nd english ed - see chapter 3.8 the sunset progrm
//

//
//	*** Main loop here ***
//

function Main(InForm) {
	var OutString = "";
	var calend;
	var quady = new Array;
	var sunp = new Array;
	var moonp = new Array;
	var y, m, day, glong, glat, tz, numday, mj, lst1, i;
	var rads = 0.0174532925, sinmoonalt;
	InForm.OutTable.value = "Calculating...";
	//
	// table header
	//
	HeadString = "             sun       c twi    n twi     a twi     moon\n" +
	             "date        r    s   b    e    b    e    b    e     r    s\n" +
	             "------------------------------------------------------------\n";
	//
	// key for bottom of table
	//
	KeyString = "\nKey\n.... means sun or moon below horizon all day or\n     twilight never begins\n" +
                "**** means sun or moon above horizon all day\n     or twilight never ends\n" +
	            "---- in rise column means no rise that day and\n" +
	            "     in set column - no set that day\n";

	//
	// parse the form to make sure the numbers are numbers and not strings!
	//
	y = parseInt(InForm.Year.value, 10);
	m = parseInt(InForm.Month.value, 10);
	day = parseInt(InForm.Day.value, 10);
	numday = parseInt(InForm.NumDays.value, 10);
	glong = parseFloat(InForm.Glong.value);
	glat = parseFloat(InForm.Glat.value);
	tz = parseFloat(InForm.TimeZone.value);

	//
	//  print the table header to the text area
	//
	InForm.OutTable.value = HeadString;

	//
	// main loop. All the work is done in the functions with the long names
	// find_sun_and_twi_events_for_date() and find_moonrise_set()
	//
	mj = mjd(day, m, y, 0.0);
	for(i = 0; i < numday; i++) {
		InForm.OutTable.value += caldat(mj + i) + " " +
			find_sun_and_twi_events_for_date(mj + i, tz, glong, glat) + " " +
			find_moonrise_set(mj + i, tz, glong, glat) + "\n";
		}

	//
	// writes key to the bottom of the table.
	//
	InForm.OutTable.value += KeyString;

	} // end of main program

//
//  *** Functions go here - mostly adapted from Montenbruck and Pfleger section 3.8 ***
//

function hrsmin(hours) {
//
//	takes decimal hours and returns a string in hhmm format
//
	var hrs, h, m, dum;
	hrs = Math.floor(hours * 60 + 0.5)/ 60.0;
	h = Math.floor(hrs);
	m = Math.floor(60 * (hrs - h) + 0.5);
	dum = h*100 + m;
	//
	// the jiggery pokery below is to make sure that two minutes past midnight
	// comes out as 0002 not 2. Javascript does not appear to have 'format codes'
	// like C
	//
	if (dum < 1000) dum = "0" + dum;
	if (dum <100) dum = "0" + dum;
	if (dum < 10) dum = "0" + dum;
	return dum;
	}

function hrsmin2(hours) {
//
//	takes decimal hours and returns a string in hhmm format
//
	var hrs, h, m, dum;
	var hourMinRec = {"hours":-100, "minutes":-100};

	hrs = Math.floor(hours * 60 + 0.5)/ 60.0;
	h = Math.floor(hrs);
	m = Math.floor(60 * (hrs - h) + 0.5);
	//dum = h*100 + m;
	hourMinRec.hours = h;
	hourMinRec.minutes = m;
	//
	// the jiggery pokery below is to make sure that two minutes past midnight
	// comes out as 0002 not 2. Javascript does not appear to have 'format codes'
	// like C
	//
	//if (dum < 1000) dum = "0" + dum;
	//if (dum <100) dum = "0" + dum;
	//if (dum < 10) dum = "0" + dum;
	return hourMinRec;
	}


function ipart(x) {
//
//	returns the integer part - like int() in basic
//
	var a;
	if (x> 0) {
	    a = Math.floor(x);
		}
	else {
		a = Math.ceil(x);
		}
	return a;
	}


function frac(x) {
//
//	returns the fractional part of x as used in minimoon and minisun
//
	var a;
	a = x - Math.floor(x);
	if (a < 0) a += 1;
	return a;
	}

//
// round rounds the number num to dp decimal places
// the second line is some C like jiggery pokery I
// found in an OReilly book which means if dp is null
// you get 2 decimal places.
//
   function round(num, dp) {
//   dp = (!dp ? 2: dp);
   return Math.round (num * Math.pow(10, dp)) / Math.pow(10, dp);
    }


function range(x) {
//
//	returns an angle in degrees in the range 0 to 360
//
	var a, b;
	b = x / 360;
	a = 360 * (b - ipart(b));
	if (a  < 0 ) {
		a = a + 360
		}
	return a
	}


function mjd(day, month, year, hour) {
//
//	Takes the day, month, year and hours in the day and returns the
//  modified julian day number defined as mjd = jd - 2400000.5
//  checked OK for Greg era dates - 26th Dec 02
//
	var a, b;
	if (month <= 2) {
		month = month + 12;
		year = year - 1;
		}
	a = 10000.0 * year + 100.0 * month + day;
	if (a <= 15821004.1) {
		b = -2 * Math.floor((year + 4716)/4) - 1179;
		}
	else {
		b = Math.floor(year/400) - Math.floor(year/100) + Math.floor(year/4);
		}
	a = 365.0 * year - 679004.0;
	return (a + b + Math.floor(30.6001 * (month + 1)) + day + hour/24.0);
	}

function caldat(mjd) {
//
//	Takes mjd and returns the civil calendar date in Gregorian calendar
//  as a string in format yyyymmdd.hhhh
//  looks OK for Greg era dates  - not good for earlier - 26th Dec 02
//
	var calout;
	var b, d, f, jd, jd0, c, e, day, month, year, hour;
	jd = mjd + 2400000.5;
	jd0 = Math.floor(jd + 0.5);
	if (jd0 < 2299161.0) {
		c = jd0 + 1524.0;
		}
	else {
		b = Math.floor((jd0 - 1867216.25) / 36524.25);
		c = jd0 + (b - Math.floor(b/4)) + 1525.0;
		}
	d = Math.floor((c - 122.1)/365.25);
	e = 365.0 * d + Math.floor(d/4);
	f = Math.floor(( c - e) / 30.6001);
	day = Math.floor(c - e + 0.5) - Math.floor(30.6001 * f);
	month = f - 1 - 12 * Math.floor(f/14);
	year = d - 4715 - Math.floor((7 + month)/10);
	hour = 24.0 * (jd + 0.5 - jd0);
	hour = hrsmin(hour);
	calout = round(year * 10000.0 + month * 100.0 + day + hour/10000, 4);
	return calout + ""; //making sure calout is a string
	}


function quad(ym, yz, yp) {
//
//	finds the parabola throuh the three points (-1,ym), (0,yz), (1, yp)
//  and returns the coordinates of the max/min (if any) xe, ye
//  the values of x where the parabola crosses zero (roots of the quadratic)
//  and the number of roots (0, 1 or 2) within the interval [-1, 1]
//
//	well, this routine is producing sensible answers
//
//  results passed as array [nz, z1, z2, xe, ye]
//
	var nz, a, b, c, dis, dx, xe, ye, z1, z2, nz;
	var quadout = new Array;

	nz = 0;
	a = 0.5 * (ym + yp) - yz;
	b = 0.5 * (yp - ym);
	c = yz;
	xe = -b / (2 * a);
	ye = (a * xe + b) * xe + c;
	dis = b * b - 4.0 * a * c;
	if (dis > 0)	{
		dx = 0.5 * Math.sqrt(dis) / Math.abs(a);
		z1 = xe - dx;
		z2 = xe + dx;
		if (Math.abs(z1) <= 1.0) nz += 1;
		if (Math.abs(z2) <= 1.0) nz += 1;
		if (z1 < -1.0) z1 = z2;
		}
	quadout[0] = nz;
	quadout[1] = z1;
	quadout[2] = z2;
	quadout[3] = xe;
	quadout[4] = ye;
	return quadout;
	}


function lmst(mjd, glong) {
//
//	Takes the mjd and the longitude (west negative) and then returns
//  the local sidereal time in hours. Im using Meeus formula 11.4
//  instead of messing about with UTo and so on
//
	var lst, t, d;
	d = mjd - 51544.5
	t = d / 36525.0;
	lst = range(280.46061837 + 360.98564736629 * d + 0.000387933 *t*t - t*t*t / 38710000);
	return (lst/15.0 + glong/15);
	}


function minisun(t) {
//
//	returns the ra and dec of the Sun in an array called suneq[]
//  in decimal hours, degs referred to the equinox of date and using
//  obliquity of the ecliptic at J2000.0 (small error for +- 100 yrs)
//	takes t centuries since J2000.0. Claimed good to 1 arcmin
//
	var p2 = 6.283185307, coseps = 0.91748, sineps = 0.39778;
	var L, M, DL, SL, X, Y, Z, RHO, ra, dec;
	var suneq = new Array;

	M = p2 * frac(0.993133 + 99.997361 * t);
	DL = 6893.0 * Math.sin(M) + 72.0 * Math.sin(2 * M);
	L = p2 * frac(0.7859453 + M / p2 + (6191.2 * t + DL)/1296000);
	SL = Math.sin(L);
	X = Math.cos(L);
	Y = coseps * SL;
	Z = sineps * SL;
	RHO = Math.sqrt(1 - Z * Z);
	dec = (360.0 / p2) * Math.atan(Z / RHO);
	ra = (48.0 / p2) * Math.atan(Y / (X + RHO));
	if (ra <0 ) ra += 24;
	suneq[1] = dec;
	suneq[2] = ra;
	return suneq;
	}


function minimoon(t) {
//
// takes t and returns the geocentric ra and dec in an array mooneq
// claimed good to 5' (angle) in ra and 1' in dec
// tallies with another approximate method and with ICE for a couple of dates
//
	var p2 = 6.283185307, arc = 206264.8062, coseps = 0.91748, sineps = 0.39778;
	var L0, L, LS, F, D, H, S, N, DL, CB, L_moon, B_moon, V, W, X, Y, Z, RHO;
	var mooneq = new Array;

	L0 = frac(0.606433 + 1336.855225 * t);	// mean longitude of moon
	L = p2 * frac(0.374897 + 1325.552410 * t) //mean anomaly of Moon
	LS = p2 * frac(0.993133 + 99.997361 * t); //mean anomaly of Sun
	D = p2 * frac(0.827361 + 1236.853086 * t); //difference in longitude of moon and sun
	F = p2 * frac(0.259086 + 1342.227825 * t); //mean argument of latitude

	// corrections to mean longitude in arcsec
	DL =  22640 * Math.sin(L)
	DL += -4586 * Math.sin(L - 2*D);
	DL += +2370 * Math.sin(2*D);
	DL +=  +769 * Math.sin(2*L);
	DL +=  -668 * Math.sin(LS);
	DL +=  -412 * Math.sin(2*F);
	DL +=  -212 * Math.sin(2*L - 2*D);
	DL +=  -206 * Math.sin(L + LS - 2*D);
	DL +=  +192 * Math.sin(L + 2*D);
	DL +=  -165 * Math.sin(LS - 2*D);
	DL +=  -125 * Math.sin(D);
	DL +=  -110 * Math.sin(L + LS);
	DL +=  +148 * Math.sin(L - LS);
	DL +=   -55 * Math.sin(2*F - 2*D);

	// simplified form of the latitude terms
	S = F + (DL + 412 * Math.sin(2*F) + 541* Math.sin(LS)) / arc;
	H = F - 2*D;
	N =   -526 * Math.sin(H);
	N +=   +44 * Math.sin(L + H);
	N +=   -31 * Math.sin(-L + H);
	N +=   -23 * Math.sin(LS + H);
	N +=   +11 * Math.sin(-LS + H);
	N +=   -25 * Math.sin(-2*L + F);
	N +=   +21 * Math.sin(-L + F);

	// ecliptic long and lat of Moon in rads
	L_moon = p2 * frac(L0 + DL / 1296000);
	B_moon = (18520.0 * Math.sin(S) + N) /arc;

	// equatorial coord conversion - note fixed obliquity
	CB = Math.cos(B_moon);
	X = CB * Math.cos(L_moon);
	V = CB * Math.sin(L_moon);
	W = Math.sin(B_moon);
	Y = coseps * V - sineps * W;
	Z = sineps * V + coseps * W
	RHO = Math.sqrt(1.0 - Z*Z);
	dec = (360.0 / p2) * Math.atan(Z / RHO);
	ra = (48.0 / p2) * Math.atan(Y / (X + RHO));
	if (ra <0 ) ra += 24;
	mooneq[1] = dec;
	mooneq[2] = ra;
	return mooneq;
	}


function sin_alt(iobj, mjd0, hour, glong, cglat, sglat) {
//
//	this rather mickey mouse function takes a lot of
//  arguments and then returns the sine of the altitude of
//  the object labelled by iobj. iobj = 1 is moon, iobj = 2 is sun
//
	var mjd, t, ra, dec, tau, salt, rads = 0.0174532925;
	var objpos = new Array;
	mjd = mjd0 + hour/24.0;
	t = (mjd - 51544.5) / 36525.0;
	if (iobj == 1) {
		objpos = minimoon(t);
				}
	else {
		objpos = minisun(t);
		}
	ra = objpos[2];
	dec = objpos[1];
	// hour angle of object
	tau = 15.0 * (lmst(mjd, glong) - ra);
	// sin(alt) of object using the conversion formulas
	salt = sglat * Math.sin(rads*dec) + cglat * Math.cos(rads*dec) * Math.cos(rads*tau);
	return salt;
	}

function OLDfind_sun_and_twi_events_for_date(mjd, tz, glong, glat) {
//
//	this is my attempt to encapsulate most of the program in a function
//	then this function can be generalised to find all the Sun events.
//
//
	var sglong, sglat, date, ym, yz, above, utrise, utset, j;
	var yp, nz, rise, sett, hour, z1, z2, iobj, rads = 0.0174532925;
	var quadout = new Array;
	var sinho = new Array;
	var   always_up = " ****";
	var always_down = " ....";
	var outstring = "";
	var sunRec={
		"rise":{"hours":-666, "minutes":-666},
		"twilight":{"hours":-666, "minuutes":-666},
		"set":{"hours":-666, "minutes":-666},

		};
//
//	Set up the array with the 4 values of sinho needed for the 4
//      kinds of sun event
//
	sinho[0] = Math.sin(rads * -0.833);		//sunset upper limb simple refraction
	sinho[1] = Math.sin(rads *  -6.0);		//civil twi
	sinho[2] = Math.sin(rads * -12.0);		//nautical twi
	sinho[3] = Math.sin(rads * -18.0);		//astro twi
	sglat = Math.sin(rads * glat);
	cglat = Math.cos(rads * glat);
	date = mjd - tz/24;
//
//	main loop takes each value of sinho in turn and finds the rise/set
//      events associated with that altitude of the Sun
//
	for (j = 0; j < 4; j++) {
		rise = false;
		sett = false;
		above = false;
		hour = 1.0;
		ym = sin_alt(2, date, hour - 1.0, glong, cglat, sglat) - sinho[j];
		if (ym > 0.0) above = true;
		//
		// the while loop finds the sin(alt) for sets of three consecutive
		// hours, and then tests for a single zero crossing in the interval
		// or for two zero crossings in an interval or for a grazing event
		// The flags rise and sett are set accordingly
		//
		while(hour < 25 && (sett == false || rise == false)) {
			yz = sin_alt(2, date, hour, glong, cglat, sglat) - sinho[j];
			yp = sin_alt(2, date, hour + 1.0, glong, cglat, sglat) - sinho[j];
			quadout = quad(ym, yz, yp);
			nz = quadout[0];
			z1 = quadout[1];
			z2 = quadout[2];
			xe = quadout[3];
			ye = quadout[4];

			// case when one event is found in the interval
			if (nz == 1) {
				if (ym < 0.0) {
					utrise = hour + z1;
					rise = true;
					}
				else {
					utset = hour + z1;
					sett = true;
					}
				} // end of nz = 1 case

			// case where two events are found in this interval
			// (rare but whole reason we are not using simple iteration)
			if (nz == 2) {
				if (ye < 0.0) {
					utrise = hour + z2;
					utset = hour + z1;
					}
				else {
					utrise = hour + z1;
					utset = hour + z2;
					}
				} // end of nz = 2 case

			// set up the next search interval
			ym = yp;
			hour += 2.0;

			} // end of while loop
			//
			// now search has completed, we compile the string to pass back
			// to the main loop. The string depends on several combinations
			// of the above flag (always above or always below) and the rise
			// and sett flags
			//
/*
Key
.... means sun or moon below horizon all day or
     twilight never begins
**** means sun or moon above horizon all day
     or twilight never ends
---- in rise column means no rise that day and
     in set column - no set that day
*/


			if (rise == true || sett == true ) {
				if (rise == true) outstring += " " + hrsmin(utrise);
				else outstring += " ----";
				if (sett == true) outstring += " " + hrsmin(utset);
				else outstring += " ----";
				}
			else {
				if (above == true) outstring += always_up + always_up;
				else outstring += always_down + always_down;
				}

/*				

			if (rise == true || sett == true ) {
				if (rise == true) sunRec.rise = hrsmin2(utrise);
				else sunRec.rise={"hours":-1, "minutes":-1};
				if (sett == true) sunRec.set = hrsmin2(utset);
				else sunRec.set={"hours":-1, "minutes":-1};
				}
			else {
				if (above == true) sunRec.rise={"hours":100, "minutes":100};
				else sunRec.rise={"hours":-100, "minutes":-100};
				}
*/

	} // end of for loop - next condition

		return outstring;
		//return sunRec;
}//end OLDsun

function OLDfind_moonrise_set(mjd, tz, glong, glat) {
//
//	Im using a separate function for moonrise/set to allow for different tabulations
//  of moonrise and sun events ie weekly for sun and daily for moon. The logic of
//  the function is identical to find_sun_and_twi_events_for_date()
//
	var sglong, sglat, date, ym, yz, above, utrise, utset, j;
	var yp, nz, rise, sett, hour, z1, z2, iobj, rads = 0.0174532925;
	var quadout = new Array;
	var sinho;
	var   always_up = " ****";
	var always_down = " ....";
	var outstring = "";
	var moonRec={
		"rise":{"hours":-666, "minuutes":-666},
		"set":{"hours":-666, "minuutes":-666},
		};


	sinho = Math.sin(rads * 8/60);		//moonrise taken as centre of moon at +8 arcmin
	sglat = Math.sin(rads * glat);
	cglat = Math.cos(rads * glat);
	date = mjd - tz/24;
		rise = false;
		sett = false;
		above = false;
		hour = 1.0;
		ym = sin_alt(1, date, hour - 1.0, glong, cglat, sglat) - sinho;
		if (ym > 0.0) above = true;
		while(hour < 25 && (sett == false || rise == false)) {
			yz = sin_alt(1, date, hour, glong, cglat, sglat) - sinho;
			yp = sin_alt(1, date, hour + 1.0, glong, cglat, sglat) - sinho;
			quadout = quad(ym, yz, yp);
			nz = quadout[0];
			z1 = quadout[1];
			z2 = quadout[2];
			xe = quadout[3];
			ye = quadout[4];

			// case when one event is found in the interval
			if (nz == 1) {
				if (ym < 0.0) {
					utrise = hour + z1;
					rise = true;
					}
				else {
					utset = hour + z1;
					sett = true;
					}
				} // end of nz = 1 case

			// case where two events are found in this interval
			// (rare but whole reason we are not using simple iteration)
			if (nz == 2) {
				if (ye < 0.0) {
					utrise = hour + z2;
					utset = hour + z1;
					}
				else {
					utrise = hour + z1;
					utset = hour + z2;
					}
				}

			// set up the next search interval
			ym = yp;
			hour += 2.0;

			} // end of while loop
/*
			Key
.... means sun or moon below horizon all day or
     twilight never begins
**** means sun or moon above horizon all day
     or twilight never ends
---- in rise column means no rise that day and
     in set column - no set that day
*/

			if (rise == true || sett == true ) {
				if (rise == true) outstring += " " + hrsmin(utrise);
				else outstring += " ----";
				if (sett == true) outstring += " " + hrsmin(utset);
				else outstring += " ----";
				}
			else {
				if (above == true) outstring += always_up + always_up;
				else outstring += always_down + always_down;
				}
/*
			if (rise == true || sett == true ) {
				if (rise == true) moonRec.rise = hrsmin2(utrise);
				else moonRec.rise={"hours":-1, "minutes":-1};
				if (sett == true) moonRec.set = hrsmin2(utset);
				else moonRec.set={"hours":-1, "minutes":-1};
				}
			else {
				if (above == true) moonRec.rise={"hours":100, "minutes":100};
				else moonRec.rise={"hours":-100, "minutes":-100};
				}

*/

		return outstring;
		//return moonRec;

	}//end old moon calc




function find_sun_and_twi_events_for_date(mjd, tz, glong, glat) {
//
//	this is my attempt to encapsulate most of the program in a function
//	then this function can be generalised to find all the Sun events.
//
//
	var sglong, sglat, date, ym, yz, above, utrise, utset, j;
	var yp, nz, rise, sett, hour, z1, z2, iobj, rads = 0.0174532925;
	var quadout = new Array;
	var sinho = new Array;
	var   always_up = " ****";
	var always_down = " ....";
	var outstring = "";
	var sunRec={
		"predawn":{"hours":-666, "minutes":-666},
		"rise":{"hours":-666, "minutes":-666},
		"twilight":{"hours":-666, "minutes":-666},
		"set":{"hours":-666, "minutes":-666},

		};
	const ordinalsForSunRec = ["rise", "set", "predawn", "twilight"];
		
//
//	Set up the array with the 4 values of sinho needed for the 4
//      kinds of sun event
//
	sinho[0] = Math.sin(rads * -0.833);		//sunset upper limb simple refraction
	sinho[1] = Math.sin(rads *  -6.0);		//civil twi
	sinho[2] = Math.sin(rads * -12.0);		//nautical twi
	sinho[3] = Math.sin(rads * -18.0);		//astro twi
	sglat = Math.sin(rads * glat);
	cglat = Math.cos(rads * glat);
	date = mjd - tz/24;
	const sunEventCount = 2;//1= sunrise/set only, 2=also civil twilight, 3 = also naut twilight, 4 = also astro twilight 
//
//	main loop takes each value of sinho in turn and finds the rise/set
//      events associated with that altitude of the Sun

	for (sunEvent = 0; sunEvent < sunEventCount; sunEvent++) {
		rise = false;
		sett = false;
		above = false;
		hour = 1.0;
		ym = sin_alt(2, date, hour - 1.0, glong, cglat, sglat) - sinho[j];
		if (ym > 0.0) above = true;
		//
		// the while loop finds the sin(alt) for sets of three consecutive
		// hours, and then tests for a single zero crossing in the interval
		// or for two zero crossings in an interval or for a grazing event
		// The flags rise and sett are set accordingly
		//
		while(hour < 25 && (sett == false || rise == false)) {
			yz = sin_alt(2, date, hour, glong, cglat, sglat) - sinho[sunEvent];
			yp = sin_alt(2, date, hour + 1.0, glong, cglat, sglat) - sinho[sunEvent];
			quadout = quad(ym, yz, yp);
			nz = quadout[0];
			z1 = quadout[1];
			z2 = quadout[2];
			xe = quadout[3];
			ye = quadout[4];

			// case when one event is found in the interval
			if (nz == 1) {
				if (ym < 0.0) {
					utrise = hour + z1;
					rise = true;
					}
				else {
					utset = hour + z1;
					sett = true;
					}
				} // end of nz = 1 case

			// case where two events are found in this interval
			// (rare but whole reason we are not using simple iteration)
			if (nz == 2) {
				if (ye < 0.0) {
					utrise = hour + z2;
					utset = hour + z1;
					}
				else {
					utrise = hour + z1;
					utset = hour + z2;
					}
				} // end of nz = 2 case

			// set up the next search interval
			ym = yp;
			hour += 2.0;

			} // end of while loop
			//
			// now search has completed, we compile the string to pass back
			// to the main loop. The string depends on several combinations
			// of the above flag (always above or always below) and the rise
			// and sett flags
			//
/*
Key
.... means sun or moon below horizon all day or
     twilight never begins
**** means sun or moon above horizon all day
     or twilight never ends
---- in rise column means no rise that day and
     in set column - no set that day
*/
/*

			if (rise == true || sett == true ) {
				if (rise == true) outstring += " " + hrsmin(utrise);
				else outstring += " ----";
				if (sett == true) outstring += " " + hrsmin(utset);
				else outstring += " ----";
				}
			else {
				if (above == true) outstring += always_up + always_up;
				else outstring += always_down + always_down;
				}
*/
				
			var whichRec = sunEvent*2;//the index of the property name we want to set in ordinalsForSunRec[]
			if (rise == true || sett == true ) {
				if (rise == true) sunRec[ordinalsForSunRec[whichRec]] = hrsmin2(utrise);
				else sunRec.rise={"hours":-1, "minutes":-1};
				if (sett == true) sunRec[ordinalsForSunRec[whichRec+1]] = hrsmin2(utset);
				else sunRec.set={"hours":-1, "minutes":-1};
				}
			else {
				if (above == true) sunRec[ordinalsForSunRec[whichRec]] ={"hours":100, "minutes":100};
				else sunRec[ordinalsForSunRec[whichRec]]={"hours":-100, "minutes":-100};
				}
} // end of for loop - next condition (next SunEvent)

		//return outstring;
		return sunRec;
}//end sun

function find_moonrise_set(mjd, tz, glong, glat) {
//
//	Im using a separate function for moonrise/set to allow for different tabulations
//  of moonrise and sun events ie weekly for sun and daily for moon. The logic of
//  the function is identical to find_sun_and_twi_events_for_date()
//
	var sglong, sglat, date, ym, yz, above, utrise, utset, j;
	var yp, nz, rise, sett, hour, z1, z2, iobj, rads = 0.0174532925;
	var quadout = new Array;
	var sinho;
	var   always_up = " ****";
	var always_down = " ....";
	var outstring = "";
	var moonRec={
		"rise":{"hours":-666, "minuutes":-666},
		"set":{"hours":-666, "minuutes":-666},
		};


	sinho = Math.sin(rads * 8/60);		//moonrise taken as centre of moon at +8 arcmin
	sglat = Math.sin(rads * glat);
	cglat = Math.cos(rads * glat);
	date = mjd - tz/24;
		rise = false;
		sett = false;
		above = false;
		hour = 1.0;
		ym = sin_alt(1, date, hour - 1.0, glong, cglat, sglat) - sinho;
		if (ym > 0.0) above = true;
		while(hour < 25 && (sett == false || rise == false)) {
			yz = sin_alt(1, date, hour, glong, cglat, sglat) - sinho;
			yp = sin_alt(1, date, hour + 1.0, glong, cglat, sglat) - sinho;
			quadout = quad(ym, yz, yp);
			nz = quadout[0];
			z1 = quadout[1];
			z2 = quadout[2];
			xe = quadout[3];
			ye = quadout[4];

			// case when one event is found in the interval
			if (nz == 1) {
				if (ym < 0.0) {
					utrise = hour + z1;
					rise = true;
					}
				else {
					utset = hour + z1;
					sett = true;
					}
				} // end of nz = 1 case

			// case where two events are found in this interval
			// (rare but whole reason we are not using simple iteration)
			if (nz == 2) {
				if (ye < 0.0) {
					utrise = hour + z2;
					utset = hour + z1;
					}
				else {
					utrise = hour + z1;
					utset = hour + z2;
					}
				}

			// set up the next search interval
			ym = yp;
			hour += 2.0;

			} // end of while loop
/*
			Key
.... means sun or moon below horizon all day or
     twilight never begins
**** means sun or moon above horizon all day
     or twilight never ends
---- in rise column means no rise that day and
     in set column - no set that day
*/
/*
			if (rise == true || sett == true ) {
				if (rise == true) outstring += " " + hrsmin(utrise);
				else outstring += " ----";
				if (sett == true) outstring += " " + hrsmin(utset);
				else outstring += " ----";
				}
			else {
				if (above == true) outstring += always_up + always_up;
				else outstring += always_down + always_down;
				}
*/

			if (rise == true || sett == true ) {
				if (rise == true) moonRec.rise = hrsmin2(utrise);
				else moonRec.rise={"hours":-1, "minutes":-1};
				if (sett == true) moonRec.set = hrsmin2(utset);
				else moonRec.set={"hours":-1, "minutes":-1};
				}
			else {
				if (above == true) moonRec.rise={"hours":100, "minutes":100};
				else moonRec.rise={"hours":-100, "minutes":-100};
				}
		//return outstring;
		return moonRec;

	}

function SelectItemByValue(element, value) {
	if (value !== undefined && value !== null) {
		var length = element.options.length;
		for (var i = 0; i < length; i++) {
			if (element.options[i].value === value) {
				element.selectedIndex = i;
				return;
			}
		}//end for i
	}//end if not null
}//end func SelectItemByValue


function createRange(node, chars, rangee) {
    if (!rangee) {
        rangee = document.createRange()
        rangee.selectNode(node);
        rangee.setStart(node, 0);
    }

    if (chars.count === 0) {
        rangee.setEnd(node, chars.count);
    } else if (node && chars.count >0) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.length < chars.count) {
                chars.count -= node.textContent.length;
            } else {
                 rangee.setEnd(node, chars.count);
                 chars.count = 0;
            }
        } else {
            for (var lp = 0; lp < node.childNodes.length; lp++) {
                rangee = createRange(node.childNodes[lp], chars, rangee);

                if (chars.count === 0) {
                   break;
                }
            }
        }
   }

   return rangee;
};

function setCurrentCursorPosition(element,chars) {
    if (chars >= 0) {
        var selection = window.getSelection();

        rangee = createRange(element.parentNode, { count: chars });

        if (rangee) {
            rangee.collapse(false);
            selection.removeAllRanges();
            selection.addRange(rangee);
        }
    }
};

function isChildOf(node, parentId) {
    while (node !== null) {
        if (node.id === parentId) {
            return true;
        }
        node = node.parentNode;
    }

    return false;
};

function getCurrentCursorPosition(parentId) {
    var selection = window.getSelection(),
        charCount = -1,
        node;

    if (selection.focusNode) {
        if (isChildOf(selection.focusNode, parentId)) {
            node = selection.focusNode;
            charCount = selection.focusOffset;

            while (node) {
                if (node.id === parentId) {
                    break;
                }

                if (node.previousSibling) {
                    node = node.previousSibling;
                    charCount += node.textContent.length;
                } else {
                     node = node.parentNode;
                     if (node === null) {
                         break;
                     }
                }
           }
      }
   }

    return charCount;
};

startSetUp();












