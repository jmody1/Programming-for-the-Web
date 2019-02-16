<!DOCTYPE html>
<html>
  <head>
    <title>User Details</title>
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    {{#docs}}
    <h1 class="doc-name">{{name}}</h1>
    {{/docs}}
    <ul>
      {{#errors}}
        <li class="error">{{.}}</li>
      {{/errors}}
    </ul>
    <br>
    <pre class="content">
    {{#docs}}
    {{content}}
    {{/docs}}
	   </pre>
     </br>
    {{>footer}}
  </body>
</html>
