import xapi from 'xapi';
let urls; //["web@webex.com", "connext@m.webex.com", "mytest@edema.com.mx" ]
let webURI; // webURI = urls[spinner_value] => e.g. connext@m.webex.com
let spinner_value=0;
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
    console.log('Agregando: ' + event.Text, event.FeedbackId);
    nuevaURI=event.Text;
    urls.push(nuevaURI);
    mem.write('URIs', urls)
  }
});

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if ((event.WidgetId === 'add') && (event.Type === 'clicked')){
         add_URI();
         //console.log(nuevaURI)
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
/////////////////////////////////////// SIP Call Function /////////////////////////////////////////////////////////////////////////////////////////////



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

const MEETING_ID = 'meetingID';

/* This will be the Panel/Widget ID you are using in the UI Extension */
const INROOMCONTROL_AUDIOCONTROL_PANELID = 'JoinMeetingPanel'; 

/* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,11})$/; 


//////// END to define variables for call
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getMeetingID(text, value = ''){

  xapi.Command.UserInterface.Message.TextInput.Display({
    
    //Placeholder: `No need to type ${meetingDomain}`,
    Title: "Ingrese ID de Meeting", /* Create a custom title for your meeting Input Display here */
    Text: '(3 a 11 digitos para completar la llamada) <p>' + 'XXXXX.'+ webURI,
    InputText: value,
    SubmitText: "Join",
    //CancelText: "Join",
    FeedbackId: MEETING_ID,
    InputType: 'Numeric',
    //KeyboardState: 'Open',
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
        case MEETING_ID:
          /* Change this to whatever filter you want to check for validity */
          const regex = REGEXP_NUMERICDIALER; 
          const match = regex.exec(event.Text);

          if (match) {
			      const meetingID = match[1];
            //const at = meetingDomain.startsWith('@') ? '' : '@';
            const Number_URI =  meetingID + "." + webURI;
            console.log(Number_URI);
            xapi.command("dial", {Number: Number_URI, Protocol: 'SIP', CallType: CALL_TYPES.VIDEO}).catch((error) => { console.error(error); });
          }
          else{
              getMeetingID("You typed in an invalid number. Please try again.", event.Text );
          }
          break;
    }
});
