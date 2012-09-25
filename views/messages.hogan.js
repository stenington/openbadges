<div class='message-container'>
{{#error.length}}
  <div class="alert alert-error">
    <a class="close" data-dismiss="alert">×</a>
    {{error}}
  </div>
{{/error.length}}

{{#success.length}}
  <div class="alert alert-success">
    <a class="close" data-dismiss="alert">×</a>
    {{success}}
  </div>
{{/success.length}}
</div>
