import xapi from 'xapi';

let urls; //["web@webex.com", "connext@m.webex.com", "mytest@sedena.gob.mx" ]
let webURI; // webURI = urls[spinner_value] => e.g. connext@m.webex.com
let spinner_value=0;
let text_XXX;

const KEYBOARD_TYPES = {
  NUMERIC: 'Numeric',
  SINGLELINE: 'SingleLine',
  PASSWORD: 'Password',
  PIN: 'PIN',
};   
  
const CALL_TYPES = {
      AUDIO     :   'Audio'
    , VIDEO     :   'Video'
}     

//const MEETING_ID = 'meetingID';

/* This will be the Panel/Widget ID you are using in the UI Extension */
const INROOMCONTROL_AUDIOCONTROL_PANELID = 'JoinMeetingPanel'; 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////// READ FROM MEMORY /////////////////////////////////////////////////////////
import { mem } from './Memory_Functions'; mem.localScript = module.name;
mem.read("URIs").then((value) => { 
  urls = value;
  webURI = urls[0];
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'myspinner',
        value: webURI});
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// Functions spinner /////////////////////////////////////////////////////////////////////////////////////////////
   
xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    //console.log(event);
    if ((event.WidgetId === 'myspinner') && (event.Type === 'clicked')) {
        if (event.Value === 'increment') {
          if ( urls.length - 1 > spinner_value) {
              spinner_value++;
          }
          
        }
        else {
            if ( 0 < spinner_value) {
              spinner_value--;
              
          }
        }
        
        xapi.command('UserInterface Extensions Widget SetValue', {WidgetId:
            'myspinner', value: urls[spinner_value]});
        webURI = urls[spinner_value];
            
 }
 });    
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// ADD BUTTON //////////////////////////////////////////////////////////////////////////
let nuevaURI
function add_URI(text, value = ''){
  xapi.Command.UserInterface.Message.TextInput.Display({
    Title: "Ingrese la nueva direccion URI", 
    Text: 'Formato: xxxx@yyyy.com',
    InputText: '',
    SubmitText: "Agregar",
    FeedbackId: 'add URI',
    })
  .catch((error) => console.error(error));
}
//Si se selecciono agregar:
xapi.event.on('UserInterface Message TextInput Response', (event) => {

  if (event.FeedbackId === 'add URI') {
    // event.Text tiene la infomacion de la nueva URI tecleada;
    console.log('Agregando: ' + event.Text, event.FeedbackId);

    if (event.Text.search('@') == -1){
      // se agrega arroba si el usuario no lo ingresó
      nuevaURI='@'+event.Text
    }
    else{
      nuevaURI=event.Text
    }
    // Se adiciona a la memoria y a la variable local "urls", la nueva direccion URI ingresada
    urls.push(nuevaURI);
    mem.write('URIs', urls)
  }
});

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if ((event.WidgetId === 'add') && (event.Type === 'clicked')){
         add_URI();
         
    }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// DEL BUTTON //////////////////////////////////////////////////////////////////////////
function del_URI(text, value = ''){
    xapi.command('UserInterface Message Prompt Display', {
    Title: "Se Eliminará la siguiente direccion URI", 
    Text: webURI,
    FeedbackId: 'delete URI',
    'Option.1':'Borrar',
    'Option.2':'Regresar',
    });
}

xapi.event.on('UserInterface§ Message Prompt Response', (event) => {
if (event.FeedbackId !== 'delete URI') return;
    console.log('Borrando: ' + webURI, event.OptionId);
    if (event.OptionId === '1') {
      console.log('Borrando ahora si..');
      let indice = urls.indexOf(webURI);
      if (indice > -1) {
        urls.splice(indice, 1);
      }
      webURI = urls[0]
      spinner_value=0
      xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'myspinner',
        value: webURI});
      mem.write('URIs', urls)
    }
});

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if ((event.WidgetId === 'delete') && (event.Type === 'clicked')){
         del_URI();
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// SIP Call Function //////////////////////////////////////////////////////////////////////////

function getMeetingID(text, value = ''){

if (webURI[0] == '@'){
     text_XXX='XXXXX';  // XXXX.devnet@lync.webex.com en Msje de Invitacion
  }
else {
     text_XXX='XXXXX.';  // XXXX.devnet@lync.webex.com en Msje de Invitacion
};

  xapi.Command.UserInterface.Message.TextInput.Display({ 
    //Placeholder: `No need to type ${meetingDomain}`,
    Title: "Ingrese ID de Meeting", /* Create a custom title for your meeting Input Display here */
    Text: '(3 a 11 digitos para completar la llamada) <p>' + text_XXX + webURI,
    InputText: value,
    SubmitText: "Join",
    FeedbackId: "entered_meeting",
    })
  .catch((error) => console.error(error));
}

/* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if ((event.WidgetId === 'connect') && (event.Type === 'clicked')){
         getMeetingID("Enter the meeting id from your invite:" );
    }
});


/* Event listener for the dial pad being posted */
xapi.Event.UserInterface.Message.TextInput.Response.on((event) => {
    switch(event.FeedbackId){
        case "entered_meeting":
          /* Change this to whatever filter you want to check for validity */

          const meetingID = event.Text;
          
            //const at = meetingDomain.startsWith('@') ? '' : '@';
            var Dialed_Number =  meetingID + "." + webURI;  //.xxxx@yyyy.com;
            if (webURI[0] == '@'){
              var Dialed_Number =  meetingID + webURI;  // @yyyy.com
            }
                        
            console.log(Dialed_Number);
            xapi.command("dial", {Number: Dialed_Number, Protocol: 'SIP', CallType: CALL_TYPES.VIDEO}).catch((error) => { console.error(error); });
          break;
    }    
});  


