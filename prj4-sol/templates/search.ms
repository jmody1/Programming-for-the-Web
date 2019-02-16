<!DOCTYPE html>
<html>
  <head>
    <title>Document Collection Search</title>
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    <h1>Document Collection Search</h1>
    <ul>
      {{#errors}}
        <li class="error">{{.}}</li>
      {{/errors}}
    </ul>
    <form method="GET" action="{{{base}}}/search.html">
       <p>
	 Please fill in one or more search terms in the field below
        </p>
	    <label>
	    <span class="label">Search Terms:</span>
	    <input name="name" type ="text"
	           value="">
	    </label>
	    <br/>
	    {{#errorMessage}}
	      <span class="error">{{errorMessage}}</span><br/>
	    {{/errorMessage}}

      <input name="submit" type="submit" value="search" class="control">
    </form>
    {{>footer}}
  </body>
</html>
