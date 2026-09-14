// Teste exclusivamente local: dispensa login/consultas da CLI Firebase.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {join} from 'node:path';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const jar=process.env.FIRESTORE_EMULATOR_JAR||join(homedir(),'.cache/firebase/emulators/cloud-firestore-emulator-v1.19.8.jar');
const emulator=spawn('java',['-Duser.language=en','-Duser.country=US','-jar',jar,'--host','127.0.0.1','--port','8180','--project_id','mosaico-game-teste'],{cwd,stdio:['ignore','pipe','pipe']});
let output='';
try{
 await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Emulador nao iniciou em 20 segundos. '+output.slice(-1200))),20000);
   const fail=error=>{clearTimeout(timer);reject(error);};
   emulator.once('error',fail);emulator.once('exit',code=>fail(Error('Emulador encerrou: '+code+' '+output.slice(-1200))));
   const read=data=>{output+=data.toString();if(output.includes('Dev App Server is now running.')){clearTimeout(timer);resolve();}};
   emulator.stdout.on('data',read);emulator.stderr.on('data',read);
 });
 const result=spawn(process.execPath,['--test','tests/regras.test.mjs'],{cwd,stdio:'inherit'});
 process.exitCode=await new Promise((resolve,reject)=>{result.once('error',reject);result.once('exit',code=>resolve(code??1));});
}catch(error){console.error(error.message);process.exitCode=1;}
finally{emulator.kill();}
