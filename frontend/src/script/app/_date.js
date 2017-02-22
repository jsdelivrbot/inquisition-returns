(function (wquery) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];


  /**
   * Format date string to human readable date
   * @param {string} dateString
   * @return {string}
   */
  app.formatDate = function(dateString) {
    var date = new Date(dateString);
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    return monthNames[monthIndex] + ' ' + day + ', ' + year;
  };

  wquery.$('.time').forEach(function(element) {
    element.innerText = app.formatDate(element.innerText);
  });

})(_WQ);
