
var random = (Math.floor(Math.random() * 3) + 1) * 1000;
setTimeout(begin, random);

var data;
var width;
var windowWidth;
var h;
var max_stud;
var selectedRect;
var windowHeight;

function begin() {
    $("#load").remove();
    windowHeight = $(window).height();

    $.getJSON("data/studzahlen.json",
        function (d) {
            data = d;
            max_stud = d3.max(data.map(getStudierende));
            width = (0.6 * $(window).width()) / data.length;
            h = d3.scaleLinear().domain([0, max_stud]).range([0, (0.8 * windowHeight)]);
            displayData();
        }
    )
    .fail(function() {
        displayError();
    });
}

function displayData() {
    if(data == null) {
        displayError();
    } else {
        windowWidth = $(window).width();
        // adding the left diagram
        $("body").append("<div id=\"left_diagram\"><svg><g></g></svg></div>");
        d3.select("svg")
          .attr("width", windowWidth * 0.6).attr("height", h(max_stud) + 50);
        
        d3.select("g")
          .selectAll("rect").data(data).enter().append("rect")
          .attr("width", (function(d) { return width - 3;}))
          .attr("height", (function(d) { return h(d.studierende);}))
          .attr("x", (function(d) { return data.indexOf(d) * width;}))
          .attr("y", function(d) { return h(max_stud) - h(d.studierende);})
          .attr("style", function(d) { return "fill: rgb(21, 63, 119);"})
          .attr("class", "balken");
    
        $("svg").append("<text>Semester</text>");
        d3.select("text")
          .attr("text-anchor", "middle")
          .attr("x", width/2)
          .attr("y", h(max_stud) + 20);

        // hover functionality for the bars on the left
        $("rect").hover(onRectHoverIn, onRectHoverOut);

        // click functionality for the bars on the left
        $("rect").click(displayMoreInformation);

        // adding the information on the right
        $("body").append("<div id=\"info\"><p>Bitte wählen Sie einen Balken aus!</p></div>");

//    $("#select").css("width", 0.4* $(window).width());
    
    }
}

function displayMoreInformation() {
    // update the visuals of the selected bar
    if(selectedRect == null) {
        selectedRect = this;
        $("#info").attr("id", "right_diagram");
        $("#right_diagram p").remove();
    } else {
        $("#right_diagram").empty();
    }
    $(selectedRect).bind('mouseenter mouseleave');
    d3.select(selectedRect).attr("style", "fill: rgb(21, 63, 119);");
    $(this).unbind('mouseenter mouseleave');
    d3.select(this).attr("style", "fill: rgb(209, 43, 43);"); 
    selectedRect = this;

    // displays more information on the right diagram

    $("#right_diagram").append("<svg id=\"donut\"></svg><table></table>");

    var n = $(selectedRect).prevAll().length;
    var fakultaeten = data[n].fakultaeten;

    const colors = ['#97BF0D', '#FFD300', '#00457D', '#878783', '#E6444F'];
    let pieData = d3.pie();
    // append the svg object to the div called 'right_diagram'
    var radius = 0.95 * ((windowWidth - width * data.length) / 2);
    d3.select("#donut")
        .attr("width", 2 * radius + 30)
        .attr("height", 2*radius + 30)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    let fak = fakultaeten.map(function (f) { return f.anzahlStud; });
    console.log(fak);
    d3.select("#donut")
        .select("g")
        .selectAll('path')
        .data(pieData(fakultaeten.map(function (f) { return f.anzahlStud; }))) // is the data right?
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(0.8*radius)         // This is the size of the donut hole
            .outerRadius(radius)
        )
        .attr('fill', function (d, i) {
            return (colors[i]);
        });


    // creating the table
    $("table").append("<tr id=\"firstRow\"></tr>");
    $("table").append("<tr id=\"secondRow\"></tr>");
    for(i = 0; i < fakultaeten.length; i++) {
        var f = fakultaeten[i];
        $("#firstRow").append("<th id=\"f" + i + "\">" + f.name + "</th>");
        $("#f" + i).css("background-color", colors[i]);
        $("#secondRow").append("<td>" + f.anzahlStud + "</td>");
    }

}

function onRectHoverIn() {
    d3.select(this).attr("style", "fill: rgb(209, 43, 43);");
}

function onRectHoverOut() {    
    d3.select(this).attr("style", "fill: rgb(21, 63, 119);");
}

function displayError() {
    $("body").append("<p>Daten konnten nicht geladen werden</p>");
}

function getStudierende(sem) {
    return sem.studierende;
}