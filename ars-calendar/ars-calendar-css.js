var css =
`
  #cal {
    background: #ffffff;

    box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.25);
    -moz-box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.25);
    -webkit-box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.25);

    margin-bottom: 1px;

    font: 13px/1.5 "Helvetica Neue", Helvetica, Arial, san-serif;
    display: table;
    width: 100%;
  }

  #cal .header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    cursor: default;
    background: #b32b0c;
    background: linear-gradient(top, #b32b0c, #cd310d);
    height: 34px;
    color: #fff;
    
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;  

    font-weight: bold;
    text-shadow: 0px -1px 0 #87260C;
    text-transform: uppercase;
    line-height: 34px;
  }

  #cal .header .button {
    min-width: 24px;
    text-align: center;
    border-radius: 5px;
  }

  #cal .header .button.right {
    margin-left: 20px;
  }

  #cal .header .button:hover {
    background: #d94215;
    background: linear-gradient(top, #d94215, #bb330f);
  }

  #cal .header .month-year {
    letter-spacing: 1px;
    text-align: center;
  }

  #cal table {
    background: #fff;
    //border-collapse: collapse;
  }



  #cal td {
    color: #2b2b2b;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    /* border: 1px solid #e6e6e6; */
    cursor: pointer;
    //border: 1px solid transparent;
  }

  #cal #localizedAbbreviatedDays td {
    height: 26px;
    line-height: 26px;
    text-transform: uppercase;
    font-size: 90%;
    color: #9e9e9e;
  }
  #cal #localizedAbbreviatedDays td:not(:last-child) {
    border-right: 1px solid #fff;
  }

  #localizedAbbreviatedDays {
    width: 100%;
  }

  .curr {
    width: 100%;
  }

  #cal-frame td.selected-day {
    //border: 1px solid;
    color: #8c8c8c;
    //box-shadow: '10px 10px 30px yellow';
    box-shadow: 1px 1px 1px 1px black;
  }
  
  #cal-frame td:not(.no_hover):hover {
    text-shadow: 0px 0px 4px black;
  }

`

export default css
