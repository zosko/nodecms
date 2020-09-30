function getStyle(style) {
  // 1 Black
  // 2 Blue
  // 3 Green
  // 4 Red
  // 5 Purple
  // 0 / 1 Bold
  // ex 11 , 20
  var color = parseInt(style / 10, 10);
  var bold = style % 10;
  var colors = {
    1: "black",
    2: "blue",
    3: "green",
    4: "red",
    5: "purple",
    6: "orange"
  };
  return ("style=color:" + colors[color] + ";font-weight:" + (bold == 1 ? "bold" : "normal") + ";");
}
function getFrontMenu() {
  $.get("/category", function(data, status) {
    var jsonData = JSON.parse(data);
    $("#menu").html('<a style="font-size:18px;" href="/"><b>All News</b></a> |');
    $(jsonData).each(function(index, el) {
      if (el.id != 1) {
        $("#menu").append('&nbsp; <a style="font-size:18px;" href="'+(el.type == 2 ? '/list' : '/page')+ '/' + el.id + '"><b>' + el.title + "</b></a> |");
      }
    });
  });
}
function renderFrontPageStories(jsonData){
    $("#stories").html("");
    $(jsonData).each(function(index, el) {
      $("#stories").append("<a " + getStyle(el.style) + ' ' + (el.content == null ? 'href="' + el.link + '" target="_blank"' : 'href="/article/' + el.id) + '">' + el.title + '</a><div class="verticalgap" style="height:10px"></div>');
    });
}
function getFrontPageStories() {
  $.get("/stories", function(data, status) {
    var jsonData = JSON.parse(data);
    renderFrontPageStories(jsonData);
  });
}

/////////
// EDIT CONTENT
////////
function getFormatDate(timestamp) {
  var date = new Date(timestamp * 1000);
  var year = date.getFullYear();
  var month = "0" + (date.getMonth() + 1);
  var day = "0" + date.getDate();
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var formattedTime = year + "-" + month.substr(-2) + "-" + day.substr(-2);
  //var formattedTime = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes.substr(-2);
  return formattedTime;
}
function getTimestamp(dateString) {
  //yyyy-MM-dd
  var dateFormat = dateString.split("-");
  var timestamp = new Date(dateFormat[0], dateFormat[1] - 1, dateFormat[2]);
  return timestamp / 1000;
}

////////
// ADMIN
///////
function renderAdminStories(jsonData){
    $("#stories").html("");
    $(jsonData).each(function(index, el) {
      if (el.content == null) {
        var style = $("#stories").append('<button data-id="' +el.id +'" class="publish">' +(el.publish ? "Hide" : "Show") +'</button><button data-id="' +el.id +'" class="edit">Edit</button><button data-id="' +el.id +'" class="remove">Remove</button><a ' +getStyle(el.style) +' href="' +el.link +'" target="_blank">' +el.title +"</a><br />");
      } else {
        $("#stories").append('<button data-id="' +el.id +'" class="publish">' +(el.publish ? "Hide" : "Show") +'</button><button data-id="' +el.id +'" class="edit">Edit</button><button data-id="' +el.id +'" class="remove">Remove</button><a ' +getStyle(el.style) +' href="article/' +el.id +'" target="_blank">' +el.title +"</a><br />");
      }
    });
}
function getAdminStories() {
  $.get("/stories/admin", function(data,status) {
    var jsonData = JSON.parse(data);
    renderAdminStories(jsonData);
  });
}
function getAdminCategory() {
  $.get("/category", function(data, status) {
    var jsonData = JSON.parse(data);
    $("#category").html("");
    $("#news_category").empty();
    $("#article_category").empty();
    $("#sort_news").html('<b>CATEGORIES: </b> <a href="#" data-id="0" class="sort_by">All News</a> |');
    $(jsonData).each(function(index, el) {
      if (el.id != 1) {
        $("#category").append(('['+ ['','Normal','List'][el.type] +']') + '<button data-id="' + el.id + '" class="edit">Edit</button><button data-id="' + el.id + '" class="remove">Remove</button>' + el.title + "<br />");
      }
      $("#sort_news").append('<a href="#" data-id="' + el.id + '" class="sort_by"> ' + el.title + " </a> |");
      $('#news_category').append(el.title + '<input type="checkbox" value="'+ el.id +'" name="news_category[]"> | '); 
      $('#article_category').append(el.title + '<input type="checkbox" value="'+ el.id +'" name="article_category[]"> | '); 
    });
  });
}
