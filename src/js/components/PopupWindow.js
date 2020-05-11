import React, { Component }  from 'react';
import {ipcRenderer, remote} from 'electron';
import '../css/windowPopUp.css';

class PopupWindow extends Component {
  
  constructor(props) { 
    super(props);
    
    if (props.title) 
      this.title = props.title;
    if (props.message) 
      this.message = props.message;

  }
  render() {
    return (
      <div className="popupDIV">
        <div id="popup">
        </div>
      </div>
    )
  }
}

export default PopupWindow;
