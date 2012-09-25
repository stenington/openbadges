<!DOCTYPE html>
<html>
  <head>
  {{> head}}
  </head>
  <body>
    {{> nav}}
    <div id="body" class="container">
      {{> messages}}

      <div class="row">
        <div class="span8 column">
          Left.
        </div>
        
        <div class="span4 column">
          Right.
        </div>
      </div>
    </div>

    {{> footer}}
    {{> javascripts}}

  </body>
</html>
