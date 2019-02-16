<!DOCTYPE html>
<html>
  <head>
    <title>Add Document</title>
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    <h1>Add Document</h1>
    <ul>
      {{#errors}}
        <li class="error">{{.}}</li>
      {{/errors}}
    </ul>
    <form method="POST" action="{{{base}}}/add" enctype="multipart/form-data>
      <label>
      <span class="label"> <b>Choose file: </b> </span>
	    <input name="file" type="file" id="file">
	    </label>
	    <br/>
	    {{#errorMessage}}
	      <span class="error">{{errorMessage}}</span><br/>
	    {{/errorMessage}}

      <input name="submit" type="submit" value="add" class="control">
    </form>
    {{>footer}}
  </body>
</html>
