window.onload = function () {
  var loader = document.getElementById("loader");
  var content = document.getElementById("content");

  var minimumLoadingTime = 1800; // 1800ms = 1.8 seconds
  var startTime = new Date().getTime();

  function hideLoader() {
    loader.style.display = "none";
    content.style.visibility = "visible";
  }

  function getRemainingTime() {
    var currentTime = new Date().getTime();
    var elapsedTime = currentTime - startTime;
    return Math.max(0, minimumLoadingTime - elapsedTime);
  }

  var remainingTime = getRemainingTime();

  setTimeout(hideLoader, remainingTime);
};
