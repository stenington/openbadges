<div class="navbar">
  <div class="navbar-inner">
    <div class="container" style="position: relative;">
      <h3><a class="brand" href="/">Open Badge Backpack</a></h3>
      <a href="http://www.mozilla.org/" id="tabzilla">a mozilla.org joint</a> 
      <ul class="nav">
        <li><a href="{{#reverse}}backpack.manage{{/reverse}}">Home</a></li>
      </ul>
      {{#user}}
        <ul class="nav pull-right">
          <li class="user">{{attributes.email}}</li>
          <li><a href="{{#reverse}}backpack.signout{{/reverse}}">Sign Out</a></li>
        </ul>
      {{/user}}
    </div>
  </div>
</div>
