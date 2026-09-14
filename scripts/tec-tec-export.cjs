/* Exporte la page courante, sans modifier le site ni les règles du jeu. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../jeux-cadeaux/tec-tec');
const destination=process.argv[2];if(!destination)throw new Error('Indiquer le chemin du fichier HTML à produire.');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="(?:icon|canonical)"[^>]*>\n/g,'');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,href)=>'<style>\n'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n</style>');
html=html.replace(/<script defer src="([^"]+)"><\/script>/g,(_,src)=>'<script>\n'+fs.readFileSync(path.join(root,src.split('?')[0]),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});fs.writeFileSync(destination,html);
console.log(path.resolve(destination));
