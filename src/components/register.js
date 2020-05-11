import React, { Component }  from 'react';
import {ipcRenderer, remote} from 'electron';
import '../css/windowPopUp.css';

class Register extends Component {
  
  constructor(props) { 
    super(props);
    

  }
register(){
    ipcRenderer.emit('registering');
}
closeWindow(){
    ipcRenderer.emit('closeRegisterWindow');
}
  render() {
    return (
        <div class="row">
                <div class="col-md-12">
                    <div class="well well-sm">
                        <div id="registerWindowExit"><strong>X</strong></div>
                        <form class="form-horizontal" method="post" id="registerForm">
                            <fieldset>
                                <legend class="text-center header">Registrate</legend>

                                <div class="form-group">
                                    <span class="col-md-1 col-md-offset-2 text-center"><i class="fa fa-phone-square bigicon"></i></span>
                                    <div class="col-md-8">
                                        <input id="user" name="user" type="text" placeholder="Usuario" class="form-control"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <span class="col-md-1 col-md-offset-2 text-center"><i class="fa fa-user bigicon"></i></span>
                                    <div class="col-md-8">
                                        <input id="fname" name="name" type="text" placeholder="Nombre" class="form-control"/>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <span class="col-md-1 col-md-offset-2 text-center"><i class="fa fa-user bigicon"></i></span>
                                    <div class="col-md-8">
                                        <input id="lname" name="name" type="text" placeholder="Apellidos" class="form-control"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <span class="col-md-1 col-md-offset-2 text-center"><i class="fa fa-envelope-o bigicon"></i></span>
                                    <div class="col-md-8">
                                        <input id="email" name="email" type="text" placeholder="Email" class="form-control"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="col-md-12 text-center">
                                        <button type="submit" class="btn btn-primary btn-lg" onclick={this.register()}>Submit</button>
                                        <button type="submit" class="btn btn-primary btn-lg" onclick={this.closeWindow()}>Cancelar</button>
                                    </div>
                                
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
          </div>
    )
  }
}

export default Register;
