
var random = (Math.floor(Math.random() * 3) + 1) * 1000;
setTimeout(begin, random);

var data;
var barWidth;
var windowHeight;
var windowWidth;
var heightScale;
var maxStud;
var selectedRect;

const colors = ['#97BF0D', '#FFD300', '#00457D', '#878783', '#E6444F'];

function begin() {
    $("#load").remove();

    $.getJSON("data/studzahlen.json",
        function (d) {
            data = d;
            assignVariables();
            displayBarDiagram();
            $("body").append("<div id=\"info\"><p>Bitte wählen Sie einen Balken aus!</p></div>");    // adding the information on the right 

            // ist das fenster zu klein, werden die Diagramme untereinander angeordnet
            if(windowWidth > 800) {
                $("#info").css("margin-left", windowWidth*0.75).css("margin-top", windowHeight / 2.5);
                $("#left_diagram").css("float", "left");
            }
        }
    )
    .fail(function() {
        displayError();
    });
}

function assignVariables() {
    windowHeight = $(window).height();
    windowWidth = $(window).width();
    maxStud = d3.max(data.map(getStudierende));
    barWidth = (0.6 * windowWidth) / data.length;
    heightScale = d3.scaleLinear().domain([0, maxStud]).range([0, (0.8 * windowHeight)]);
}

function displayBarDiagram() {
    $("body").append("<div id=\"left_diagram\"><svg><g></g></svg></div>");

    d3.select("svg")
      .attr("width", windowWidth * 0.65).attr("height", heightScale(maxStud) + 50);

    // creating the bars
    d3.select("g")
      .attr("transform", "translate(30,0)")
      .selectAll("rect").data(data).enter().append("rect")
      .attr("width", (barWidth - 3))
      .attr("height", (function(d) { return heightScale(d.studierende);}))
      .attr("x", (function(d, i) { return i * barWidth;}))
      .attr("y", function(d) { return heightScale(maxStud) - heightScale(d.studierende);})
      .attr("style", "fill: rgb(21, 63, 119);")
      .attr("class", "balken");

    // label for the axes
    d3.select("svg").append("text").attr("x", barWidth*data.length / 2).attr("y", heightScale(maxStud) + 25).attr("font-size", 23).attr("fill", "black").text("Semester");
    d3.select("svg").append("text").attr("x", 5).attr("y", heightScale(maxStud)/2).attr("font-size", 23).attr("text-anchor", "middle")
      .attr("fill", "black").attr("transform", "rotate(90, 10," + heightScale(maxStud)/2 + ")").text("Studierendenzahlen");

    // hover functionality
    $("rect").hover(function() { d3.select(this).attr("style", "fill: rgb(209, 43, 43);"); },               // handlerIn
                      function() { d3.select(this).attr("style", "fill: rgb(21, 63, 119);"); });              // handlerOut
                      
    // click functionality
    $("rect").click(displayMoreInformation);
}

function displayMoreInformation() {
    // update the visuals of the selected bar
    if(selectedRect == null) {
        $("#info").attr("id", "right_diagram");
        $("#right_diagram p").remove();
        d3.select("#left_diagram").select("g").append("text").attr("id", "anzahlStud");
    } else {
        $("#right_diagram").empty();
        $(selectedRect).bind('mouseenter mouseleave');
        d3.select(selectedRect).attr("style", "fill: rgb(21, 63, 119);");
    }
    $(this).unbind('mouseenter mouseleave');
    d3.select(this).attr("style", "fill: rgb(209, 43, 43);"); 
    selectedRect = this;

    var n = $(selectedRect).prevAll().length;       // index of the selected Rectangle
    var fakultaeten = data[n].fakultaeten;          // array with the fakultaeten of the selected Rectangle

    // creating donut diagram and table
    $("#right_diagram").append("<svg id=\"donut\"></svg><table></table>");

    // creating the donut diagram
    let pieData = d3.pie();
    let radius = 0.85 * (Math.min((windowWidth *0.35), windowHeight*0.6) / 2);       // the radius of the donut diagram, depending on the remaining space

    d3.select("#donut")
        .attr("width", windowWidth * 0.35)
        .attr("height", windowHeight * 0.6)
        .append("g")
        .attr("transform", "translate(" + (radius + 3) + "," + (radius + 3) + ")");

    d3.select("#donut")
        .select("g")
        .selectAll('path')
        .data(pieData(fakultaeten.map(function (f) { return f.anzahlStud; })))      // the argument of pieData is an array with the amount of students per faculty
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(0.8*radius)         // the size of the donut hole
            .outerRadius(radius))
        .attr('fill', function (d, i) { return (colors[i]);})
        .attr("stroke", "black")
        .attr("stroke-width", "2px");

    d3.select("#donut").select("g").append("text").attr("text-anchor", "middle").attr("font-size", 20).text(selectedRect.__data__.semester); // semester-label in the middle of the donut 
    d3.select("#anzahlStud").attr("x", n*barWidth).attr("y", heightScale(maxStud) - 4).attr("font-size", 12).attr("fill", "white").text(selectedRect.__data__.studierende); // amount of students at selected bar

    // creating the table
    $("table").append("<tr id=\"firstRow\"></tr>");
    $("table").append("<tr id=\"secondRow\"></tr>");
    for(i = 0; i < fakultaeten.length; i++) {
        var f = fakultaeten[i];
        $("#firstRow").append("<th id=\"f" + i + "\">" + f.name + "</th>");
        $("#f" + i).css("background-color", colors[i]);
        $("#secondRow").append("<td>" + f.anzahlStud + "</td>");
    }

    // ist das fenster zu klein, werden die Diagramme untereinander angeordnet
    if(windowWidth > 800) {
        $("th, td").css("height", 0.06 * windowHeight).css("max-width", 0.3*windowWidth / fakultaeten.length);
        $("#right_diagram").css("margin-left", windowWidth*0.65).css("margin-top", 0);
    }
}


function displayError() {
    $("body").append("<p>Daten konnten nicht geladen werden</p>");
}

function getStudierende(sem) {
    return sem.studierende;
}