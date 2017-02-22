(function(wquery) {
  'use strict';

  var topbar, search, menu, sidebar, search_input, search_action;

  function openSearchBox() {
    wquery.addClass(topbar, 'search');
    search_input.focus();
  }


  function closeSearchBox() {
    wquery.removeClass(topbar, 'search');
  }

  function openSidebar() {
    wquery.addClass(sidebar, 'open');
    app.disableScroll();
  }


  function closeSidebar() {
    wquery.removeClass(sidebar, 'open');
    app.enableScroll();
  }

  function getSearchInfo(e) {
    if (e.keyCode === 13) {
      var searchText = e.target.value;
      e.target.blur();
      e.target.input = '';
      window.location.href = wquery.base + 'search/' + searchText;
    }
  }


  function handleScroll() {
    var stick = document.body.scrollTop > 64;
    if (stick) {
      wquery.addClass(topbar, 'stick-top');
    }
    else if (document.body.scrollTop === 0) {
      wquery.removeClass(topbar, 'stick-top');
    }
  }

  function scrollHandler() {
    var scrollTop = document.body.scrollTop;
    if (scrollTop > 64) {
      wquery.addClass(topbar, 'full');
    }
    else {
      wquery.removeClass(topbar, 'full');
    }
  }

  function init() {
    topbar= wquery.$$('.topbar');
    if (topbar) {
      window.addEventListener('scroll', scrollHandler);
    }

    search = wquery.$$('.topbar .search');
    if (search) {
      search.onclick = openSearchBox;
    }

    search_input = wquery.$$('.searchbox input');
    if (search_input) {
      search_input.onblur = closeSearchBox;
      search_input.onkeyup = getSearchInfo;
    }

    search_action = wquery.$$('.search-action');
    if (search_action) {
      search_action.onclick = openSearchBox;
    }

    sidebar = wquery.$$('.sidebar');
    if (sidebar) {
      sidebar.onclick = closeSidebar;
    }

    menu = wquery.$$('.topbar .menu-icon');
    if (menu && sidebar) {
      menu.onclick = openSidebar;
    }
  }

  init();
  console.log(topbar, search, menu, sidebar, search_input, search_action);
})(_WQ);
