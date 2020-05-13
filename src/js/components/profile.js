import React, { Component }  from 'react';
import {ipcRenderer, remote} from 'electron';
import '../css/profile.css';

class Profile extends Component {
  
  constructor(props) { 
    super(props);
    
    if (props.data) 
      this.data = props.data;

  }
  render() {
    return (
      <div className="card">
        <div id="profile">
            <div class="usuario">{this.props.data.usuario}</div>
            <div class="nombre">{this.props.data.nombre+" "+this.props.data.apellidos}</div>
            <div class="email">{this.props.data.email}</div>
            <div class="tipo">{this.props.data.usuario}</div>
            <div class="tlf">{this.props.data.usuario}</div>
        </div>
      </div>
    )
  }
}

export default Profile;
