<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
</head>
<body>
  <form action="/login" method="post" id="loginForm">
    <table>
      <tr>
        <td><label> Email Address: </label></td>
        <td><input name="email" id="email" value={{email}}></input></td>
      </tr>
      <tr>
        <td><label>Password:</label></td>
        <td><input type="password" name="password" id="password"/></td>
      </tr>
      <tr>
        <td colspan="2"><center><input type="submit" name="submit" id="submit" value="Login"></center></td>
      </tr>
      <tr>
        <td colspan="2"><center><a href="registration.html">New User? Click Here</a></center></td>
      </tr>
      {{#errorMsg}}
      <tr>
	      <td colspan="2"><center>{{errorMsg}}</center></td>
      </tr>
      {{/errorMsg}}
    </table>
  </form>
</body>
</html>
