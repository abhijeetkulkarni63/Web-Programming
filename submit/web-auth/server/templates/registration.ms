<!DOCTYPE html>
<html>
<head>
  <title>Registration</title>
</head>
<body>
  <form action="/register" method="post" id="registerForm">
    <table>
      <tr>
        <td> <label>First Name:</label> </td>
        <td> <input name="fname" id="fname" value={{fname}}> </td>
      </tr>
      <tr>
        <td> <label>Last Name:</label> </td>
        <td> <input name="lname" id="lname" value={{lname}}> </td>
      </tr>
      <tr>
        <td> <label>Email:</label> </td>
        <td> <input name="email" id="email" value={{email}}> </td>
      </tr>
      <tr>
        <td> <label>Password:</label> </td>
        <td> <input type="password" name="pw" id="pw"/> </td>
      </tr>
      <tr>
        <td> <label>Confirm Password:</label> </td>
        <td> <input type="password" name="cpw" id="cpw"/> </td>
      </tr>
      <tr>
        <td colspan="2"> <center> <input type="submit" name="registerButton" value="Sign Up"> </center> </td>
      </tr>
      <tr>
        <td colspan="2"> <center> <a href="login.html"> Already a user? Login Here </a> </center> </td>
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
