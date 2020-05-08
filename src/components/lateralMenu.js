import React, { Component }  from 'react';
import {ipcRenderer, remote} from 'electron';
import '../css/lateralMenu.css';

class LateralMenu extends Component {
  
  constructor(props) { 
    super(props);
    
    if (props.options) 
      this.options = props.options;

  }
  show(){
      let n_options =  this.props.options.length;
      let menuLateral=[];

      for(let i = 0 ; i < n_options; i++)
      {
           menuLateral.push(
               <div id={this.props.options[i]}>{this.props.options[i]}</div>
           );
      }

      return menuLateral;
  }
  render() {
    return (
      <div className="menuLateral">
        {this.show()}
      </div>
    )
  }
}

export default LateralMenu;
